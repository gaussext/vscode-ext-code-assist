import type { ChatParams } from '@/models/Model';
import { WebviewRpcClient } from 'vscode-webview-rpc';

export interface StreamCallbacks {
  onChunk: (delta: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

class ChatRpcService {
  private rpcClient: WebviewRpcClient;

  constructor() {
    if (globalThis.acquireVsCodeApi) {
      const vscode = (globalThis as any).acquireVsCodeApi();
      this.rpcClient = new WebviewRpcClient(vscode, { debug: true });
      this.rpcClient.setupMessageListener();
    }
  }

  streamMessage(params: ChatParams, callbacks: StreamCallbacks): void {
    if (!this.rpcClient) {
      throw new Error('RPC client not initialized');
    }
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
    if (!this.rpcClient) {
      throw new Error('RPC client not initialized');
    }
    return this.rpcClient.call('chat/stopChat', {});
  }
}

export const chatRpcService = new ChatRpcService();
