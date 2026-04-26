# code-assist-rpc

JSON-RPC 2.0 客户端/服务端通信库，支持流式响应。

## Installation

```bash
pnpm add code-assist-rpc
```

## Usage

### Server

```typescript
import { RpcServer } from 'code-assist-rpc';

class MyRpcServer extends RpcServer {
  sendMessage(message: string): void {
    // 发送消息到客户端
  }

  log(level: string, ...args: unknown[]): void {
    console.log(level, ...args);
  }
}

const server = new MyRpcServer({ debug: true });
server.registerHandler('myMethod', async (params) => {
  return { result: params.value * 2 };
});

// 处理收到的消息
const response = await server.handleMessage(jsonRpcRequestString);
if (response) {
  server.sendMessage(response);
}
```

### Client

```typescript
import { RpcClient } from 'code-assist-rpc';

class MyRpcClient extends RpcClient {
  sendMessage(message: string): void {
    // 发送消息到服务端
  }

  log(level: string, message: string, ...args: unknown[]): void {
    console.log(level, message, ...args);
  }
}

const client = new MyRpcClient({ debug: true });

// 普通调用
const result = await client.call('myMethod', { value: 5 });

// 流式调用
await client.streamCall('myStreamMethod', { value: 5 }, {
  onChunk: (chunk) => console.log('chunk:', chunk),
  onComplete: () => console.log('complete'),
  onError: (error) => console.error('error:', error),
});
```

## JSON-RPC 2.0 规范

符合 [JSON-RPC 2.0](https://www.jsonrpc.org/specification) 规范：

- 请求：`{"jsonrpc": "2.0", "method": "methodName", "params": {...}, "id": "..."}`
- 响应：`{"jsonrpc": "2.0", "result": {...}, "id": "..."}`
- 错误响应：`{"jsonrpc": "2.0", "error": {"code": -32603, "message": "..."}, "id": "..."}`

### 流式扩展

通过 `__stream__: true` 参数标记流式请求：

```typescript
{
  "jsonrpc": "2.0",
  "method": "streamMethod",
  "params": {...},
  "id": "...",
  "__stream__": true
}
```

流式响应使用内部消息类型：
- `{ "id": "...", "__type__": "__stream__", "data": {...} }`
- `{ "id": "...", "__type__": "__complete__" }`
- `{ "id": "...", "__type__": "__error__", "error": {...} }`

### 错误码

- `-32600` - Invalid Request
- `-32601` - Method not found
- `-32602` - Invalid params
- `-32603` - Internal error

## License

MIT