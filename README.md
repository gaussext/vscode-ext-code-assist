# Code Assist

基于 DeepSeek API 的 VS Code 代码助手扩展，提供智能代码辅助功能。

## 功能特性

- **智能对话**: 支持多会话聊天、上下文对话、历史记录管理
- **代码操作**: 代码解释、优化、注释生成、语法升级（Class/Vue/React）
- **文本处理**: 数据分析、文本翻译、文学鉴赏
- **用户体验**: Markdown 渲染、代码高亮、一键复制、流式响应
- **快捷操作**: 右键菜单集成、快捷键支持（Ctrl+U / Cmd+U）

## 安装

```bash
# 构建扩展
pnpm run vsce

# 安装扩展
code --install-extension code-assist-*.vsix
```

## 配置

在 VS Code 设置中配置：

- `code-assist.deepseek`: DeepSeek 服务器地址（默认：https://api.deepseek.com）
- `code-assist.deepseek_token`: DeepSeek API 密钥

## 使用方法

### 快捷键

- **Ctrl+U** (Windows/Linux) 或 **Cmd+U** (Mac): 打开代码助手

### 右键菜单

选中代码后，可通过右键菜单访问：
- 开始对话、代码解释、代码优化、代码注释
- 升级 Class/Vue/React、数据分析、文本翻译、文学鉴赏

### 命令面板

通过 `Ctrl+Shift+P` / `Cmd+Shift+P` 访问所有 `Code Assist:` 开头的命令。

## 开发

### 环境要求

- Node.js >= 18
- pnpm >= 8
- VS Code >= 1.98.0

### 开发命令

```bash
# 安装依赖
pnpm install

# 构建所有
pnpm run build:prepare

# 编译扩展
pnpm run compile

# 监听模式（开发）
pnpm run watch

# 打包扩展
pnpm run vsce

# 运行 Linter
pnpm run lint
```

## 项目结构

```
vscode-ext-code-assist/
├── packages/
│   ├── main/                    # VS Code 扩展主程序
│   ├── vscode-webview-rpc/      # Webview RPC 通信库
│   └── webview/                 # Vue 3 前端界面
```

## 技术栈

- TypeScript, VS Code Extension API, Vue 3, Vite, Webpack, pnpm, DeepSeek API

## 许可证

MIT License
