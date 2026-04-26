# code-assist-shared

共享常量定义，用于 main 和 webview 之间的消息方法名。

## Installation

```bash
pnpm add code-assist-shared
```

## Usage

```typescript
import { EnumRpcMessage } from 'code-assist-shared';

console.log(EnumRpcMessage.Stream);   // '/rpc/chat/stream'
console.log(EnumRpcMessage.Summary);   // '/rpc/chat/summary'
console.log(EnumRpcMessage.Stop);    // '/rpc/chat/stop'
console.log(EnumRpcMessage.Models);    // '/rpc/models'
```

## License

MIT