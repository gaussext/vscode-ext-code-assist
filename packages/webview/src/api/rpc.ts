import { WebviewRpcClient } from 'vscode-webview-rpc';

export interface ChatParams {
  model: string;
  content: string;
  messages: any[];
}

export interface StreamCallbacks {
  onChunk: (delta: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

class ChatRpcService {
  private rpcClient: WebviewRpcClient;

  constructor() {
    const vscode = (globalThis as any).acquireVsCodeApi();
    this.rpcClient = new WebviewRpcClient(vscode, { debug: true });
    this.rpcClient.setupMessageListener();
  }

  streamMessage(params: ChatParams, callbacks: StreamCallbacks): void {
    this.rpcClient.stream('chat/streamMessage', params, {
      onChunk: (chunk: any) => {
        callbacks.onChunk(chunk.delta);
      },
      onComplete: () => {
        callbacks.onComplete();
      },
      onError: (error: Error) => {
        callbacks.onError(error);
      }
    });
  }

  async stopChat(): Promise<any> {
    return this.rpcClient.call('chat/stopChat', {});
  }
}

export const chatRpcService = new ChatRpcService();
