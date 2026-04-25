import type { IChatParams, IProviderParams } from '@/models/Model';
import { EnumRpcMessage, WebviewRpcClient } from 'code-assit-rpc';
import { RpcMock } from './rpc-mock';
import type { IChunk } from '@/types';

export interface StreamCallbacks {
  onChunk: (chunk: IChunk) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

class ChatRpcClient {
  private rpcClient: WebviewRpcClient;
  private abortController: AbortController = new AbortController();

  constructor() {
    if (globalThis.acquireVsCodeApi) {
      const vscode = (globalThis as any).acquireVsCodeApi();
      this.rpcClient = new WebviewRpcClient(vscode, globalThis, { debug: true });
    }
  }

  streamMessage(params: IChatParams, callbacks: StreamCallbacks): void {
    if (!this.rpcClient) {
      RpcMock.mockStream(callbacks);
      return;
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
    this.abortController = new AbortController();
    this.rpcClient.streamCall(EnumRpcMessage.Stream, params, {
      onChunk: (chunk: IChunk) => {
        if (this.abortController.signal.aborted) {
          callbacks.onComplete();
          return;
        }
        callbacks.onChunk(chunk);
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
      RpcMock.abort();
      return;
    }
    this.abortController.abort();
    return this.rpcClient.call(EnumRpcMessage.Stop, {});
  }

  async models(params: IProviderParams): Promise<any> {
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

export const chatRpcClient = new ChatRpcClient();
