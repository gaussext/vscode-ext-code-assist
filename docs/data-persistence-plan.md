# 数据持久化方案

## 1. 当前数据分布与问题

### 1.1 数据分布现状

| 数据 | 位置 | 存储方式 | 安全 |
|------|------|----------|------|
| 会话列表 + 消息 | Main: `globalState` (Memento) | JSON KV | 明文 |
| API Key / BaseURL / Model | Webview: `localStorage` | 明文 JSON | ❌ 明文 |
| sessionId ↔ config 映射 | Webview: `localStorage` | 明文 | — |
| 当前选中模型哈希 | Webview: `localStorage` | 明文 | — |
| 摘要模型哈希 | Webview: `localStorage` | 明文 | — |
| 消息时间戳 (start/load/end) | Webview: 内存 | 不持久 | — |

### 1.2 问题

1. **API Key 明文存 webview localStorage** — 安全风险
2. **Memento 单 key 存所有 session 数据** — 随使用量增加会接近大小限制
3. **数据割裂** — webview 和 main 各存一部分，不同步
4. **webview 关闭数据丢失** — 当前会话消息时间戳、reasoning 不持久

---

## 2. VS Code 持久化能力

| API | 说明 | 上限 | 适用场景 |
|-----|------|------|---------|
| `context.globalState` | 全局 key-value 存储，自动序列化 JSON | ~MB 级（整个 store 一个文件） | 配置、映射表、小体积数据 |
| `context.workspaceState` |  workspace 级别，同上 | 同上 | 工作区相关配置 |
| `context.secrets` | 加密存储，系统级加密 | 不限 | API Key、Token |
| `context.globalStorageUri` | 扩展专属目录（文件系统） | 不限 | 大量消息历史、日志、附件 |
| `fs.writeFileSync` 直接写文件 | 完全控制文件结构、分片、轮转 | 不限 | 消息库、需要自己管理的数据 |

### 关键区分

- **Memento / SecretStorage**：VS Code 管理生命周期，自动同步（remote 场景）
- **文件系统**：需要自己管理，但灵活、无大小限制

---

## 3. 推荐方案：Memento + SecretStorage + 文件系统 三层

```
~/.vscode/extensions/<ext-id>/                     (globalStorageUri)
│
├── data/
│   ├── index.json                                  # 会话索引（轻量）
│   └── sessions/
│       ├── sess_xxx.json                           # 每个会话一个文件
│       └── sess_yyy.json
│
├── logs/
│   └── agent.log                                   # winston 日志
│
└── .store (Memento, VS Code 管理，不可见)
    ├── acp-sessions                                # (弃用，迁移到文件)
    └── ui-settings                                 # 当前选中模型等（轻量）
```

### 层级说明

| 层级 | 存储 | 内容 |
|------|------|------|
| L1 | `context.secrets` | API Key：`{ baseURL → apiKey }` |
| L2 | `context.globalState` (Memento) | 索引 + 设置：会话列表摘要、当前选中模型、摘要模型 |
| L3 | 文件系统 (`globalStorageUri + data/sessions/`) | 消息体：每个 session 一个 JSON 文件，含完整 messages + timestamps |

---

## 4. 数据结构设计

### 4.1 L1 — Secrets: API Keys

```typescript
// Secret key 格式
const SECRET_PREFIX = 'code-assist-apikey-';
// 存储: context.secrets.store(`${SECRET_PREFIX}${baseURL}`, apiKey)

// 读取: context.secrets.get(`${SECRET_PREFIX}${baseURL}`)
```

### 4.2 L2 — Memento: 索引 + 设置

```typescript
// globalState 中的 key
const KEYS = {
  SESSION_INDEX: 'session-index',
  UI_SETTINGS: 'ui-settings',
  SESSION_MIGRATED: 'session-migrated-v2',   // 用于数据迁移标记
};

// session-index: SessionSummary[]
interface SessionSummary {
  id: string
  title: string
  cwd: string
  model: string
  provider: string
  createdAt: number
  updatedAt: number
  // 不包含 messages，messages 单独存文件
}

// ui-settings
interface UiSettings {
  currentModelHash: string
  summaryModelHash: string
}
```

### 4.3 L3 — 文件系统: 消息体

```typescript
// data/sessions/{sessionId}.json
interface SessionFile {
  id: string
  title: string
  cwd: string
  model: string
  provider: string
  createdAt: number
  updatedAt: number
  messages: StoredMessage[]
}

interface StoredMessage {
  role: 'user' | 'assistant'
  content: string
  reasoning?: string        // 新增——持久化 reasoning
  startTime?: number        // 新增
  loadTime?: number         // 新增
  endTime?: number          // 新增
}
```

---

## 5. 迁移步骤

### Phase 1: Provider 配置迁移（安全）

**当前**：Webview `localStorage` 明文存 API Key

```typescript
// localStorage
{
  "providers": [
    { "baseURL": "https://api.openai.com/v1", "apiKey": "sk-xxx", ... }
  ]
}
```

**目标**：Main `SecretStorage` 加密存 + Memento 存非敏感部分

新增 extMethod：
```
code-assist/provider/list      → 返回 Provider[]（不含 apiKey）
code-assist/provider/save       → 接收 { baseURL, apiKey, ... }，分别存 secrets 和 memento
code-assist/provider/getApiKey  → 返回指定 baseURL 的 apiKey
code-assist/provider/delete     → 删除 provider
```

Webview `useProviderStore` 改为调用 `chatService.listProviders()` 等。

### Phase 2: Session 消息迁移到文件系统

**当前**：Memento `acp-sessions` 存所有 `{ [sessionId]: SessionData }`

**目标**：
- Memento `session-index` 只存 `SessionSummary[]`（无 messages）
- 文件系统 `data/sessions/{id}.json` 存含 messages 的完整数据

### Phase 3: 清理 webview 存储

**当前**：Webview 还剩下 `localStorage` 中：
- `EnumStorageKey.ConversationId` → sessionStorage
- `EnumStorageKey.CurrentModelHash` → 迁到 Agent Memento
- `EnumStorageKey.SummaryModelHash` → 迁到 Agent Memento
- `acp_session_*` → 不再需要（Agent 自己维护映射）

---

## 6. 新接口设计（ACP extMethod）

### Session 索引

```
code-assist/session/list       → SessionSummary[]
code-assist/session/get        { sessionId } → SessionData
code-assist/session/save       { sessionId, ... } → void
code-assist/session/delete     { sessionId } → void
code-assist/session/updateTitle { sessionId, title } → void
code-assist/session/getOrCreate { config } → sessionId  // 替代 localStorage 映射
```

### Provider 管理

```
code-assist/provider/list      → ProviderMeta[]    // 不含 apiKey
code-assist/provider/save      { baseURL, apiKey, ... } → void
code-assist/provider/delete    { baseURL } → void
```

### UI Settings

```
code-assist/setting/get        → UiSettings
code-assist/setting/set        { key, value } → void
```

---

## 7. 文件变更清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `packages/main/src/lib/StoreManager.ts` | 统一管理 L1/L2/L3 存储操作 |
| `packages/main/src/lib/SessionFileStore.ts` | 文件系统读/写 session JSON |

### 修改文件

| 文件 | 改动 |
|------|------|
| `packages/main/src/acp/SessionStore.ts` | 索引剥离到 Memento，消息体改为文件存储 |
| `packages/main/src/acp/AgentServer.ts` | 新增 extMethod：provider CRUD、setting、getOrCreateSession；SessionStore 改文件 |
| `packages/main/src/extension.ts` | 初始化时做数据迁移 v1→v2（Memento→文件），传入 `globalStorageUri` |
| `packages/main/src/views/ChatWebViewProvider.ts` | 传递 `globalStorageUri` 给 AgentServer |
| `packages/webview/src/stores/useProviderStore.ts` | 改为调用 chatService API |
| `packages/webview/src/stores/useSettingStore.ts` | 改为调用 chatService API |
| `packages/webview/src/api/rpc.ts` | 新增 provider/setting API 调用 |
| `packages/webview/src/api/index.ts` | 暴露新方法 |
| `packages/webview/src/lib/AcpClient.ts` | 新增 provider/setting/session 方法 |
| `packages/webview/src/views/ChatView.vue` | 移除 `restoreACPHistoryIfNeeded`（不再需要，Agent 管理 session） |

### 删除文件（可选）

| 文件 | 说明 |
|------|------|
| `packages/webview/src/api/rpc-mock.ts` | 如不再需要 |
| `packages/webview/src/stores/constants.ts` | 待确认 |

---

## 8. 数据迁移（v1 → v2）

首次升级时从旧 Memento 格式迁移到新格式：

```typescript
async function migrateIfNeeded(context: vscode.ExtensionContext) {
  const migrated = context.globalState.get<boolean>('session-migrated-v2');
  if (migrated) return;

  const oldData = context.globalState.get<Record<string, SessionData>>('acp-sessions');
  if (oldData) {
    const dir = path.join(context.globalStorageUri.fsPath, 'data', 'sessions');
    for (const [id, data] of Object.entries(oldData)) {
      // 写文件
      await writeSessionFile(dir, id, data);
      // 更新索引
      index.push(extractSummary(data));
    }
    // 保存索引到 Memento
    await context.globalState.update('session-index', index);
    // 清除旧数据
    await context.globalState.update('acp-sessions', undefined);
  }

  await context.globalState.update('session-migrated-v2', true);
}
```

---

## 9. 安全说明

- API Key 始终只通过 `context.secrets` 存储，**不进 localStorage、不进日志、不进 extMethod 响应**
- 调用 OpenAI 时，Agent 从 secrets 读取，用完即弃（不缓存）
- 文件系统数据无敏感信息（messages 明文，不含 apiKey）

---

*文档版本：v1.0*
*最后更新：2026-05-14*
