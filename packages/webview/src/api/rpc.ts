import type { IChatParams, IModelParams } from '@/models/Model';
import { EnumRpcMessage, WebviewRpcClient } from 'vscode-webview-rpc';

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
      this.rpcClient = new WebviewRpcClient(vscode, globalThis, { debug: true });
    }
  }

  streamMessage(params: IChatParams, callbacks: StreamCallbacks): void {
    if (!this.rpcClient) {
      throw new Error('RPC client not initialized');
    }
    const { baseURL, apiKey, model } = params;
    if (!baseURL) {
      throw new Error('baseURL required');
    }
    if (!apiKey) {
      throw new Error('apiKey required');
    }
    if (!model) {
      throw new Error('model required');
    }
    this.rpcClient.streamCall(EnumRpcMessage.Stream, params, {
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
    return this.rpcClient.call(EnumRpcMessage.Stop, {});
  }

  async models(params: IModelParams): Promise<any> {
    if (!this.rpcClient) {
      throw new Error('RPC client not initialized');
    }
    return this.rpcClient.call(EnumRpcMessage.Models, params);
  }

  async summary(params: { messages: any[] }): Promise<any> {
    if (!this.rpcClient) {
      throw new Error('RPC client not initialized');
    }
    return this.rpcClient.call(EnumRpcMessage.Summary, params);
  }
}

export const chatRpcService = new ChatRpcService();
