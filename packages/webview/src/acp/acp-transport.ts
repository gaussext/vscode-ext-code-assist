import type { Stream, AnyMessage } from '@agentclientprotocol/sdk'

export function createWebviewClientStream(acquireVsCodeApi: () => any): Stream {
  const vscodeApi = acquireVsCodeApi()

  const writable = new WritableStream<AnyMessage>({
    write(msg) {
      vscodeApi.postMessage(JSON.stringify(msg))
    },
  })

  const readable = new ReadableStream<AnyMessage>({
    start(controller) {
      window.addEventListener('message', (event: MessageEvent) => {
        const data = event.data
        // Only process JSON strings (ACP JSON-RPC messages)
        if (typeof data === 'string' && data.includes('"jsonrpc"')) {
          try {
            controller.enqueue(JSON.parse(data))
          } catch {
            // skip malformed JSON
          }
        }
      })
    },
  })

  return { writable, readable }
}
