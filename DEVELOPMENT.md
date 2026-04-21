## 开发

### 环境要求

- Node.js >= 18
- pnpm >= 8

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
