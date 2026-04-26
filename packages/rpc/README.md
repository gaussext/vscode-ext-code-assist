# code-assist-rpc

[![npm version](https://img.shields.io/npm/v/code-assist-rpc.svg)](https://www.npmjs.com/package/code-assist-rpc)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

VS Code Webview RPC 通讯库，支持流式数据传输。

## 特性

- 简单易用的 RPC 通讯接口
- 支持普通请求-响应模式
- 支持流式数据传输
- 类型安全的 TypeScript 支持
- 完整的错误处理机制
- 抽象类设计，便于扩展

## 安装

```bash
pnpm install code-assist-rpc
```

## 使用方法

### Main 端（VS Code Extension）

```typescript
import * as vscode from 'vscode';
import { RpcServer } from 'code-assist-rpc';

class MyRpcServer extends RpcServer {
  sendMessage(message: string): void {
    webview.postMessage(message);
  }

  log(level: string, ...args: unknown[]): void {
    console.log(`[${level}]`, ...args);
  }
}

// 创建 RPC 服务器
const rpcServer = new MyRpcServer();

// 注册处理器
rpcServer.registerHandler('chat.sendMessage', async (params: { message: string }) => {
  return { response: 'Hello!' };
});

rpcServer.registerHandler('chat.streamMessage', async (stream, params: { message: string }) => {
  for (let i = 0; i < 5; i++) {
    stream.write({ chunk: `Part ${i}` });
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  stream.complete();
});

// 处理来自 webview 的消息
webview.onDidReceiveMessage(message => {
  rpcServer.handleMessage(message);
});
```

### Webview 端

```typescript
import { RpcClient } from 'code-assist-rpc';

class MyRpcClient extends RpcClient {
  sendMessage(message: string): void {
    vscode.postMessage(message);
  }

  log(level: string, message: string, ...args: unknown[]): void {
    console.log(`[${level}]`, message, ...args);
  }
}

// 创建 RPC 客户端
const rpcClient = new MyRpcClient();

// 设置消息监听
window.addEventListener('message', (event) => {
  rpcClient.handleMessage(event.data);
});

// 普通调用
const result = await rpcClient.call('chat.sendMessage', { message: 'Hello' });

// 流式调用
await rpcClient.streamCall('chat.streamMessage', { message: 'Hello' }, {
  onChunk: (chunk) => console.log('Received:', chunk),
  onComplete: () => console.log('Stream completed'),
  onError: (error) => console.error('Stream error:', error)
});
```

## API

### RpcServer

抽象类，需要子类实现以下方法：

- `sendMessage(message: string): void` - 发送消息到对端
- `log(level: string, ...args: unknown[]): void` - 日志记录

方法：

- `registerHandler(path: string, handler: RpcStreamHandler | RpcHandler)` - 注册处理器
- `unregisterHandler(path: string)` - 注销处理器
- `handleMessage(message: string): Promise<string | null>` - 处理接收到的消息
- `dispose()` - 清理资源

### RpcClient

抽象类，需要子类实现以下方法：

- `sendMessage(message: string): void` - 发送消息到对端
- `log(level: string, message: string, ...args: unknown[]): void` - 日志记录

方法：

- `call<TParams, TResult>(path: string, params: TParams): Promise<TResult>` - 普通调用
- `streamCall<TParams, TChunk>(path: string, params: TParams, options): Promise<void>` - 流式调用
- `handleMessage(message: string): void` - 处理接收到的消息
- `dispose()` - 清理资源

### 类型定义

```typescript
// 流处理器
interface IChannel<T> {
  write: (chunk: T) => void;
  complete: () => void;
  error: (err: Error) => void;
}

// 消息类型
type RpcMessageType = 'request' | 'response' | 'stream' | 'error' | 'complete';

// 消息枚举
enum EnumRpcMessage {
  Stream = '/rpc/chat/stream',
  Summary = '/rpc/chat/summary',
  Stop = '/rpc/chat/stop',
  Models = '/rpc/models',
}
```

## 许可证

MIT