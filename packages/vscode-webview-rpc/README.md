# vscode-webview-rpc

[![npm version](https://img.shields.io/npm/v/vscode-webview-rpc.svg)](https://www.npmjs.com/package/vscode-webview-rpc)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

VS Code Webview RPC 通讯库，支持流式数据传输。

## 特性

- 简单易用的 RPC 通讯接口
- 支持普通请求-响应模式
- 支持流式数据传输
- 类型安全的 TypeScript 支持
- 完整的错误处理机制

## 安装

```bash
pnpm install vscode-webview-rpc
```

## 使用方法

### Main 端（VS Code Extension）

```typescript
import * as vscode from 'vscode';
import { WebviewRpcServer } from 'vscode-webview-rpc';

// 创建 RPC 服务器
const rpcServer = new WebviewRpcServer(webview);

// 注册处理器
rpcServer.registerHandlers('chat', {
  async sendMessage(params: { message: string }) {
    return { response: 'Hello!' };
  },
  
  async streamMessage(params: { message: string }, stream) {
    for (let i = 0; i < 5; i++) {
      stream.write({ chunk: `Part ${i}` });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    stream.complete();
  }
});
```

### Webview 端

```typescript
import { WebviewRpcClient } from 'vscode-webview-rpc';

// 创建 RPC 客户端
const rpcClient = new WebviewRpcClient(vscode);

// 设置消息监听
rpcClient.setupMessageListener();

// 普通调用
const result = await rpcClient.call('chat.sendMessage', { message: 'Hello' });

// 流式调用
rpcClient.stream('chat.streamMessage', { message: 'Hello' }, {
  onChunk: (chunk) => console.log('Received:', chunk),
  onComplete: () => console.log('Stream completed'),
  onError: (error) => console.error('Stream error:', error)
});
```

## API

### WebviewRpcServer

- `registerHandlers(path: string, handlers: RpcHandlers)` - 注册处理器
- `unregisterHandlers(path: string)` - 注销处理器
- `dispose()` - 清理资源

### WebviewRpcClient

- `call<TParams, TResult>(path: string, params: TParams): Promise<TResult>` - 普通调用
- `stream<TParams, TChunk>(path: string, params: TParams, options): void` - 流式调用
- `dispose()` - 清理资源

## 许可证

MIT
