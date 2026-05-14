# ACP 重构方案：Main ↔ Webview 通讯改造

## 概述

将 `packages/main`（扩展宿主）与 `packages/webview`（Vue 前端）之间的通信从自定义 JSON-RPC 重构为标准的 **ACP（Agent Client Protocol）**，实现真正的 C/S 架构——webview 关闭后后台仍能继续接收数据，重新打开后可恢复会话。

---

## 目录

1. [当前架构问题](#1-当前架构问题)
2. [ACP 协议简介](#2-acp-协议简介)
3. [目标架构](#3-目标架构)
4. [详细设计](#4-详细设计)
5. [文件变更清单](#5-文件变更清单)
6. [分步实施计划](#6-分步实施计划)
7. [风险与注意事项](#7-风险与注意事项)

---

## 1. 当前架构问题

### 现有通信流程（简化）

```
用户输入 → ChatView.vue
          → chatService.chatStream()
            → WebviewRpcClient.call(EnumRpcMessage.ChatStream, ...)
              → vscode.postMessage(JSON-RPC请求)
                → VscodeRpcServer.handleMessage()
                  → OpenAIService.chatStream() → ReadableStream
                  → 逐块发回 __stream__ 内部消息
                → WebviewRpcClient 接收流块
              → TransformStream 解析 OpenAI delta
            → reader.read() 循环读取
          → 更新 UI
```

### 核心问题

| 问题 | 描述 |
|------|------|
| **Webview 是唯一客户端** | 流式响应直接发送到 webview，webview 关闭后连接中断，AI 仍在运行的请求丢失 |
| **无会话持久化** | 消息存储在 webview 的 localforage，扩展宿主无状态 |
| **自定义协议** | `__stream__`/`__complete__`/`__cancel__` 是私有内部消息，不可互操作 |
| **紧耦合** | ChatView.vue 直接处理 RPC 调用和流读取逻辑 |
| **无重连机制** | webview 关闭再打开 = 全新会话 |

---

## 2. ACP 协议简介

[ACP (Agent Client Protocol)](https://agentclientprotocol.com) 是编辑器与 AI 编程助手之间的标准化通信协议，类似 LSP 但面向 AI Agent。

### 核心概念

- **Agent（服务端）**：扩展宿主，处理 AI 请求，管理会话
- **Client（客户端）**：Webview，提供 UI，发送提示词，展示结果
- **Session（会话）**：一个独立对话，有唯一 ID，Agent 维护其状态

### 关键消息类型

| 消息 | 方向 | 说明 |
|------|------|------|
| `initialize` | Client → Agent | 初始化连接，协商版本和能力 |
| `session/new` | Client → Agent | 创建新会话 |
| `session/load` | Client → Agent | 加载已有会话（Agent 回放历史消息） |
| `session/prompt` | Client → Agent | 发送用户提示词（请求-响应模式） |
| `session/update` | Agent → Client | **通知**（非响应），流式推送内容块 |
| `session/cancel` | Client → Agent | 取消当前 prompt（通知，无响应） |
| `session/list` | Client → Agent | 列出所有会话 |
| `session/close` | Client → Agent | 关闭会话释放资源 |

### Prompt Turn 生命周期

```
Client → Agent: session/prompt (用户消息)
  loop
    Agent → Client: session/update (agent_message_chunk)  ← 流式块
    Agent → Client: session/update (tool_call)             ← 工具调用
  end
Agent → Client: session/prompt 响应 { stopReason: "end_turn" }
```

关键区别：**流式数据通过 `session/update` 通知推送**，而不是在 `session/prompt` 的响应中。这意味着即使 Client 断开，Agent 仍可继续处理，只需在重连时用 `session/load` 恢复。

---

## 3. 目标架构

```
┌──────────────────────────────────────────────────────────────┐
│ Extension Host (ACP Agent)                                    │
│                                                               │
│  ┌──────────────────────────────────────────────┐             │
│  │ AgentServer                                   │             │
│  │  - 实现 AgentSideConnection (或自定义 ACP 层) │             │
│  │  - 处理 initialize/session/new/session/prompt │             │
│  │  - 处理 session/cancel/session/load           │             │
│  └──────────────┬───────────────────────────────┘             │
│                 │                                            │
│      ┌──────────▼──────────┐                                 │
│      │  SessionManager      │  ← 会话持久化层                 │
│      │  - Map<sessionId,    │     webview 关闭后仍存在        │
│      │    ACPSession>       │                                 │
│      │  - 消息持久化(Memento)│                                 │
│      └──────────┬──────────┘                                 │
│                 │                                            │
│      ┌──────────▼──────────┐                                 │
│      │  OpenAIService       │  ← 不变，但需要改造             │
│      │  - chatStream()      │     支持外部 AbortSignal       │
│      └─────────────────────┘                                 │
└──────────────────┬───────────────────────────────────────────┘
                   │
          ACP over VS Code postMessage
          (自定义 Transport Adapter)
                   │
┌──────────────────▼───────────────────────────────────────────┐
│ Webview (ACP Client)                                         │
│                                                               │
│  ┌──────────────────────────────────────────────┐             │
│  │ AcpClient                                     │             │
│  │  - 实现 ClientSideConnection (或自定义 ACP 层)│             │
│  │  - 处理 initialize → session/new/load          │             │
│  │  - 接收 session/update 通知                    │             │
│  └──────────────┬───────────────────────────────┘             │
│                 │                                            │
│      ┌──────────▼──────────┐                                 │
│      │  ChatView.vue        │  ← 简化，不直接管理 RPC        │
│      │  - 通过 AcpClient    │                                  │
│      │    收发消息          │                                  │
│      └─────────────────────┘                                 │
└───────────────────────────────────────────────────────────────┘
```

### 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| ACP SDK vs 自实现 | **基于 SDK (`@agentclientprotocol/sdk`)** | 标准化、有社区支持、减少自维护成本 |
| Transport | **自定义：基于 VS Code postMessage** | ACP 标准支持自定义 transport，postMessage 在 webview 环境中是唯一可靠的通信方式 |
| 会话持久化 | **VS Code Memento (globalState)** | 轻量、自动序列化、VS Code 原生支持 |
| 消息源 | **Agent 端是 source of truth** | webview 关闭后再打开时，通过 `session/load` 从 Agent 恢复消息 |

---

## 4. 详细设计

### 4.1 自定义 Transport Adapter

ACP SDK 默认支持 stdio 和 HTTP，我们需要实现一个基于 VS Code `postMessage` 的 Custom Transport。

**Agent 端**（`packages/main/src/acp/transport.ts`）：

```typescript
// Agent 端 Transport 适配器
// 将 VS Code webview 的 postMessage/onDidReceiveMessage 封装为
// ACP SDK 所需的 transport 接口

interface Transport {
  send(message: string): void;
  onMessage(handler: (message: string) => void): Disposable;
  close(): void;
}

class WebviewTransport implements Transport {
  constructor(private webview: vscode.Webview) {
    this.webview.onDidReceiveMessage((msg) => {
      this.messageHandler?.(typeof msg === 'string' ? msg : JSON.stringify(msg));
    });
  }
  send(message: string) {
    this.webview.postMessage(message);
  }
  onMessage(handler: (message: string) => void): Disposable {
    this.messageHandler = handler;
    return { dispose: () => { this.messageHandler = null; } };
  }
  close() { /* cleanup */ }
}
```

**Client 端**（`packages/webview/src/lib/acp-transport.ts`）：

```typescript
class WebviewClientTransport implements Transport {
  private vscode = acquireVsCodeApi();
  send(message: string) {
    this.vscode.postMessage(message);
  }
  onMessage(handler: (message: string) => void): Disposable {
    window.addEventListener('message', (e) => {
      if (typeof e.data === 'string') {
        handler(e.data);
      }
    });
  }
}
```

### 4.2 AgentServer（扩展宿主侧）

**位置**：`packages/main/src/acp/AgentServer.ts`

#### 职责
1. 使用 ACP SDK 的 `AgentSideConnection`（或自实现 ACP 层）处理 ACP 消息
2. 管理会话生命周期（创建、加载、关闭）
3. 将 `session/prompt` 请求路由到 `OpenAIService`
4. 通过 `session/update` 通知推送流式块

#### 会话生命周期

```
new Client connects
  → initialize (协商版本/能力)
  → session/new (创建会话，返回 sessionId)
  → session/prompt (用户发消息)
    → 创建 ACPSession，开始处理
    → OpenAIService.chatStream() 返回 ReadableStream
    → 读取流块，发送 session/update 通知
    → 消息完成，存入 SessionStore
    → 返回 session/prompt 响应 { stopReason: "end_turn" }
  → session/prompt (又一条消息)
    → ...

Client disconnects (webview 关闭)
  → Agent 继续处理（OpenAI 流仍在读取）
  → 流完成 → 消息存入 SessionStore

Client reconnects (webview 重新打开)
  → initialize
  → session/load (sessionId: "之前那个")
  → Agent 回放历史消息（通过 session/update 通知）
  → 如果有正在进行的 prompt，显示进度
```

#### 关键代码设计

```typescript
class AgentServer {
  private sessions = new Map<string, ACPSession>();  // 活跃会话
  private transport: Transport;
  private agentConnection: AgentSideConnection;  // ACP SDK 的连接对象

  constructor(transport: Transport) {
    this.transport = transport;
    // 使用 ACP SDK 初始化 Agent 侧连接
    this.agentConnection = new AgentSideConnection({
      transport: this.transport,
      onInitialize: this.handleInitialize.bind(this),
      onNewSession: this.handleNewSession.bind(this),
      onPrompt: this.handlePrompt.bind(this),
      onCancel: this.handleCancel.bind(this),
      onLoadSession: this.handleLoadSession.bind(this),
    });
  }

  // 处理 session/prompt
  async handlePrompt(sessionId: string, prompt: ContentBlock[]) {
    const session = this.sessions.get(sessionId);
    // 提取用户消息
    const userText = extractTextFromContentBlocks(prompt);
    // 保存用户消息
    await session.addMessage({ role: 'user', content: userText });

    // 启动流式请求（不 await 完成，立即返回）
    this.processPromptAsync(session);
  }

  async processPromptAsync(session: ACPSession) {
    try {
      const stream = await openaiService.chatStream(session.buildChatParams());
      const reader = stream.getReader();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const delta = value.choices?.[0]?.delta;
        const text = delta?.content || '';
        const reasoning = delta?.reasoning || delta?.reasoning_content || '';

        if (text) {
          content += text;
          // 通过 session/update 通知推送流式块
          this.agentConnection.sendUpdate(sessionId, {
            sessionUpdate: 'agent_message_chunk',
            content: { type: 'text', text },
          });
        }
        if (reasoning) {
          this.agentConnection.sendUpdate(sessionId, {
            sessionUpdate: 'reasoning_chunk',  // 自定义扩展
            content: { type: 'text', text: reasoning },
          });
        }
      }

      // 保存完成的 assistant 消息
      await session.addMessage({ role: 'assistant', content });
      // 响应 session/prompt
      this.agentConnection.respondPrompt(sessionId, {
        stopReason: 'end_turn',
      });
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') {
        this.agentConnection.respondPrompt(sessionId, {
          stopReason: 'cancelled',
        });
      } else {
        this.agentConnection.respondPrompt(sessionId, {
          stopReason: 'end_turn',
        });
      }
    }
  }

  // 处理 session/load - 回放历史消息
  async handleLoadSession(sessionId: string) {
    const session = await this.sessionStore.load(sessionId);
    for (const msg of session.messages) {
      this.agentConnection.sendUpdate(sessionId, {
        sessionUpdate: msg.role === 'user' ? 'user_message_chunk' : 'agent_message_chunk',
        content: { type: 'text', text: msg.content },
      });
    }
  }
}
```

### 4.3 ACPSession（会话管理器）

**位置**：`packages/main/src/acp/ACPSession.ts`

```typescript
interface SessionData {
  id: string;
  cwd: string;
  messages: ICompletionMessage[];
  model: string;
  provider: string;
  createdAt: number;
  updatedAt: number;
  title?: string;
}

class ACPSession {
  data: SessionData;
  activePrompt: AbortController | null = null;

  constructor(id: string, cwd: string) {
    this.data = {
      id, cwd,
      messages: [],
      model: '', provider: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  async addMessage(msg: ICompletionMessage) {
    this.data.messages.push(msg);
    this.data.updatedAt = Date.now();
  }

  buildChatParams(): IChatParams {
    return {
      baseURL: this.data.provider,
      apiKey: this.data.model,  // TODO: 安全存储
      model: this.data.model,
      messages: this.data.messages,
    };
  }

  cancel() {
    this.activePrompt?.abort();
    this.activePrompt = null;
  }
}
```

### 4.4 SessionStore（持久化层）

**位置**：`packages/main/src/acp/SessionStore.ts`

使用 VS Code 的 `Memento`（`context.globalState`）存储会话数据。

```typescript
class SessionStore {
  private static STORAGE_KEY = 'acp-sessions';

  constructor(private storage: vscode.Memento) {}

  async save(session: ACPSession): Promise<void> {
    const all = this.getAllSync();
    all[session.data.id] = session.data;
    await this.storage.update(STORAGE_KEY, all);
  }

  async load(sessionId: string): Promise<ACPSession | null> {
    const all = this.getAllSync();
    const data = all[sessionId];
    if (!data) return null;
    const session = new ACPSession(data.id, data.cwd);
    session.data = data;
    return session;
  }

  async list(): Promise<SessionData[]> {
    const all = this.getAllSync();
    return Object.values(all).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async delete(sessionId: string): Promise<void> {
    const all = this.getAllSync();
    delete all[sessionId];
    await this.storage.update(STORAGE_KEY, all);
  }

  private getAllSync(): Record<string, SessionData> {
    return this.storage.get(STORAGE_KEY, {});
  }
}
```

### 4.5 AcpClient（Webview 侧）

**位置**：`packages/webview/src/lib/AcpClient.ts`

```typescript
type UpdateHandler = (update: SessionUpdate) => void;

class AcpClient {
  private transport: Transport;
  private clientConnection: ClientSideConnection;
  private sessionId: string | null = null;
  private updateHandlers = new Set<UpdateHandler>();
  private pendingPrompt: Promise<PromptResponse> | null = null;

  constructor() {
    const vscode = acquireVsCodeApi();
    this.transport = new WebviewClientTransport(vscode);
    this.clientConnection = new ClientSideConnection({
      transport: this.transport,
      // 配置
    });
  }

  async initialize(): Promise<void> {
    await this.clientConnection.initialize({
      protocolVersion: 1,
      clientCapabilities: {},
      clientInfo: { name: 'code-assist', version: '1.0.0' },
    });
  }

  async createSession(cwd: string): Promise<string> {
    const result = await this.clientConnection.newSession({ cwd, mcpServers: [] });
    this.sessionId = result.sessionId;
    return result.sessionId;
  }

  async loadSession(sessionId: string): Promise<void> {
    // Agent 会通过 session/update 回放所有历史消息
    return new Promise((resolve) => {
      const handler = (update: SessionUpdate) => {
        this.updateHandlers.forEach(h => h(update));
      };
      this.clientConnection.loadSession({
        sessionId, cwd: '', mcpServers: [],
      }).then(() => {
        resolve();
      });
    });
  }

  async sendPrompt(prompt: ContentBlock[]): Promise<void> {
    this.pendingPrompt = this.clientConnection.sendPrompt({
      sessionId: this.sessionId!,
      prompt,
    });
    const result = await this.pendingPrompt;
    // result.stopReason 表示完成原因
  }

  onUpdate(handler: UpdateHandler): () => void {
    this.updateHandlers.add(handler);
    return () => this.updateHandlers.delete(handler);
  }

  cancel(): void {
    this.clientConnection.sendCancel(this.sessionId!);
  }

  disconnect(): void {
    // 不 cancel session，只是断开连接
    this.transport.close();
  }
}
```

### 4.6 ChatView.vue 改造要点

移除直接 RPC 调用，改为使用 `AcpClient`：

```typescript
// 新流程
onMounted(async () => {
  await acpClient.initialize();

  // 尝试恢复之前的会话
  const lastSessionId = localStorage.getItem('lastSessionId');
  if (lastSessionId) {
    await acpClient.loadSession(lastSessionId);
    // 从回放中重建消息列表
  } else {
    await acpClient.createSession(vscode.workspace.rootPath);
  }

  // 监听流式更新
  acpClient.onUpdate((update) => {
    if (update.sessionUpdate === 'agent_message_chunk') {
      // 追加到当前流式消息
    } else if (update.sessionUpdate === 'user_message_chunk') {
      // 历史回放中的用户消息
    }
  });
});

// 发送消息
async function onSend() {
  await acpClient.sendPrompt([
    { type: 'text', text: prompt.value },
    ...(promptCode.value ? [{ type: 'resource', resource: { uri: '...', text: promptCode.value } }] : []),
  ]);
}

// Webview 关闭时不 cancel，让 Agent 继续处理
onUnmounted(() => {
  acpClient.disconnect();  // 仅断开连接，不取消 prompt
});
```

### 4.7 向后兼容：命令触发方式

当前 VS Code 命令通过 `postMessage({type, text})` 发送到 webview。改造后有两种方案：

**方案 A（推荐）**：命令直接在 Agent 端转换为 `session/prompt`
- 命令处理程序调用 `AgentServer.handlePrompt(sessionId, prompt)` 
- Agent 处理并将结果存入 session
- webview 打开后通过 `session/load` 看到结果

**方案 B**：保持现有 postMessage 通道，webview 收到后再转为 ACP

采用方案 A 以实现真正的后台处理。

---

## 5. 文件变更清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `packages/main/src/acp/AgentServer.ts` | ACP Agent 主实现 |
| `packages/main/src/acp/ACPSession.ts` | 会话管理 |
| `packages/main/src/acp/SessionStore.ts` | 会话持久化 |
| `packages/main/src/acp/transport.ts` | VS Code postMessage Transport 适配器 |
| `packages/main/src/acp/index.ts` | 重导出 |
| `packages/webview/src/lib/AcpClient.ts` | ACP Client 实现 |
| `packages/webview/src/lib/acp-transport.ts` | Webview 端 Transport 适配器 |
| `docs/acp-refactoring-plan.md` | 本文档 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `packages/main/src/views/ChatWebViewProvider.ts` | 替换 `createRpc()` 为 `createAgentServer()` |
| `packages/main/src/rpc.ts` | 改为创建 ACP Agent 的工厂函数（或删除） |
| `packages/main/src/extension.ts` | 初始化 ACP Agent，传递 `context.globalState` 给 SessionStore |
| `packages/main/src/services/OpenAIService.ts` | 支持外部 `AbortSignal`（少量修改） |
| `packages/webview/src/views/ChatView.vue` | 使用 AcpClient 替代 chatService |
| `packages/webview/src/api/rpc.ts` | 改为基于 AcpClient 实现（或直接删除） |
| `packages/webview/src/api/index.ts` | 更新导出 |
| `packages/webview/src/stores/useMessageStore.ts` | 消息从 Agent 同步，不是存 localforage |
| `packages/webview/src/stores/useConversationStore.ts` | 会话列表改为从 `session/list` 获取 |
| `packages/main/package.json` | 添加 `@agentclientprotocol/sdk` 依赖 |
| `packages/webview/package.json` | 添加 `@agentclientprotocol/sdk` 依赖 |

### 可删除文件（迁移完成后）

| 文件 | 说明 |
|------|------|
| `packages/rpc/src/RpcClient.ts` | 被 ACP Client 替代 |
| `packages/rpc/src/RpcServer.ts` | 被 ACP Agent 替代 |
| `packages/webview/src/lib/WebviewRpcClient.ts` | 被 AcpClient 替代 |
| `packages/main/src/lib/VscodeRpcServer.ts` | 被 transport.ts 替代 |
| `packages/webview/src/api/rpc-mock.ts` | 可选，可改为 mock AcpClient |
| `packages/shared/src/index.ts` | `EnumRpcMessage` 不再需要 |

---

## 6. 分步实施计划

### 第一阶段：基础设施（预计 1 天）

1. 安装 `@agentclientprotocol/sdk`
   ```bash
   pnpm add @agentclientprotocol/sdk --filter code-assist-main
   pnpm add @agentclientprotocol/sdk --filter code-assist-webview
   ```
2. 实现 Transport 适配器
   - `packages/main/src/acp/transport.ts`
   - `packages/webview/src/lib/acp-transport.ts`
3. 实现 SessionStore
   - `packages/main/src/acp/SessionStore.ts`

### 第二阶段：实现 ACP Agent（预计 1.5 天）

1. 实现 `ACPSession` - 会话管理
2. 实现 `AgentServer` - ACP 消息处理核心
   - `initialize` 处理
   - `session/new` 处理
   - `session/prompt` + `session/update` 流式处理
   - `session/cancel` 处理
   - `session/load` 历史回放
3. 修改 `extension.ts` - 初始化 ACP Agent 并传递存储
4. 修改 `ChatWebViewProvider.ts` - 使用 AgentServer

### 第三阶段：实现 ACP Client（预计 1 天）

1. 实现 `AcpClient` - ACP Client 核心
   - 初始化连接
   - 创建/加载会话
   - 发送 prompt
   - 接收 `session/update` 通知
   - 取消和断开
2. 修改 `ChatView.vue` - 集成 AcpClient
3. 修改相关 stores

### 第四阶段：测试与联调（预计 1 天）

1. 测试基本聊天流
2. 测试流式输出
3. 测试取消操作
4. 测试 webview 关闭 → 后台继续 → 重新打开恢复
5. 测试多个会话切换
6. 测试历史会话加载

### 第五阶段：清理（预计 0.5 天）

1. 删除旧的 RPC 代码
2. 更新 package.json 去除不再需要的依赖
3. 更新 AGENTS.md 中的架构描述
4. 全面回归测试

---

## 7. 风险与注意事项

### 风险

| 风险 | 级别 | 应对 |
|------|------|------|
| ACP SDK 不成熟/API 不稳定 | 中 | 关注 SDK v0.21.0，锁定版本；做好自实现 ACP 层的备用方案 |
| ACP SDK 的 `ClientSideConnection` 不支持 webview 环境 | 中 | 如果 SDK 的 connection 类过于耦合 stdio，则自实现 ACP JSON-RPC 消息处理（协议简单，可快速自实现） |
| VS Code Memento 存储大小限制 | 低 | 会话消息量不大（文本），全局存储可接受。如果超限可改用文件存储 |
| 现有 localforage 数据迁移 | 低 | 首次迁移时通过一个启动任务从 localforage 读取并写入 SessionStore |
| webview 重建时性能 | 低 | `session/load` 回放整个对话，消息过多时可能有延迟，可考虑分页 |

### 注意事项

1. **安全**：`apiKey` 不应明文存储在 `SessionStore` 中，应使用 `vscode.SecretStorage`
2. **取消流程**：webview 关闭时不应自动 cancel，但用户明确点击"取消"时应 propagate 到 Agent
3. **并发 prompt**：ACP 规范允许同一 session 的串行 prompt，应确保 `ACPSession` 正确处理串行化
4. **协议版本**：初始使用 ACP v1，关注 v2 进展
5. **自定义扩展**：reasoning 内容可通过 ACP 的 `_meta` 字段或自定义 `session/update` 类型扩展

### 备用方案：自实现 ACP 层

如果 `@agentclientprotocol/sdk` 与 webview 环境不兼容，可以自实现轻量 ACP 兼容层（基于现有 `RpcClient`/`RpcServer` 改造）：

- 修改现有 `RpcClient`/`RpcServer` 的 `types.ts`，添加 ACP 标准消息类型
- 保留流式传输机制，但包装为 `session/update` 通知格式
- 将 `EnumRpcMessage` 映射到 ACP 方法名
- 实现 SessionStore 和会话生命周期

---

## 附录 A：ACP 消息结构参考

### Initialize Request
```json
{
  "jsonrpc": "2.0", "id": 0, "method": "initialize",
  "params": {
    "protocolVersion": 1,
    "clientCapabilities": {},
    "clientInfo": { "name": "code-assist", "version": "1.0.0" }
  }
}
```

### Initialize Response
```json
{
  "jsonrpc": "2.0", "id": 0,
  "result": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "loadSession": true,
      "sessionCapabilities": { "list": {}, "close": {} },
      "promptCapabilities": { "image": false, "audio": false, "embeddedContext": true }
    },
    "agentInfo": { "name": "code-assist-agent", "version": "1.0.0" },
    "authMethods": []
  }
}
```

### Session/New
```json
{
  "jsonrpc": "2.0", "id": 1, "method": "session/new",
  "params": { "cwd": "/home/user/project", "mcpServers": [] }
}
```
→ Response: `{ "jsonrpc": "2.0", "id": 1, "result": { "sessionId": "sess_xxx" } }`

### Session/Prompt
```json
{
  "jsonrpc": "2.0", "id": 2, "method": "session/prompt",
  "params": {
    "sessionId": "sess_xxx",
    "prompt": [{ "type": "text", "text": "Hello" }]
  }
}
```

### Session/Update (notification)
```json
{
  "jsonrpc": "2.0", "method": "session/update",
  "params": {
    "sessionId": "sess_xxx",
    "update": {
      "sessionUpdate": "agent_message_chunk",
      "content": { "type": "text", "text": "Hello! " }
    }
  }
}
```

### Session/Prompt Response
```json
{
  "jsonrpc": "2.0", "id": 2,
  "result": { "stopReason": "end_turn" }
}
```

### Session/Cancel (notification)
```json
{
  "jsonrpc": "2.0", "method": "session/cancel",
  "params": { "sessionId": "sess_xxx" }
}
```

---

## 附录 B：与现有架构的对比

| 维度 | 当前架构 | ACP C/S 架构 |
|------|---------|-------------|
| 协议 | 自定义 JSON-RPC + `__stream__` 内部消息 | 标准化 ACP (JSON-RPC 2.0 + 标准方法) |
| 流式传输 | `ReadableStream` via `__stream__` 块 | `session/update` 通知（无 id, 无响应） |
| 会话所有权 | Webview (localforage) | Agent (Memento/globalState) |
| 会话ID | Webview 生成 | Agent 在 `session/new` 时生成 |
| Webview 关闭 | 所有请求中断 | Agent 继续处理 |
| Webview 重开 | 全新会话 | `session/load` 恢复 |
| 消息列表来源 | localforage | Agent 的会话存储 |
| 模型配置 | Webview store 传递到 Agent | Agent 直接读取配置（或通过初始化参数） |
| 扩展性 | 私有协议，无法复用 | ACP 兼容，可与其他 ACP Client 互操作 |
| 代码复杂度 | ChatView.vue 600+ 行含大量 RPC 逻辑 | ChatView.vue 简化为仅 UI 逻辑 |

---

*文档版本：v1.0*
*最后更新：2026-05-14*
