import type { IChatParams, IProviderParams } from 'code-assist-shared';
import { EnumRpcMessage } from 'code-assist-shared';
import { RpcMock } from './rpc-mock';
import { WebviewRpcClient } from '@/lib/WebviewRpcClient';
import type { IChatChunk } from '@/types';

class ChatRpcClient {
  private rpcClient: WebviewRpcClient;

  constructor() {
    if (globalThis.acquireVsCodeApi) {
      const vscode = (globalThis as any).acquireVsCodeApi();
      this.rpcClient = new WebviewRpcClient(vscode, globalThis);
    }
  }

  async models(params: IProviderParams): Promise<any> {
    if (!this.rpcClient) {
      return RpcMock.mockModels();
    }
    return this.rpcClient.call(EnumRpcMessage.Models, params);
  }

  async chat(params: IChatParams): Promise<any> {
    if (!this.rpcClient) {
      throw new Error('RPC client not initialized. model:' + params.model);
    }
    return this.rpcClient.call(EnumRpcMessage.Chat, params);
  }

  chatStream(params: IChatParams): ReadableStream<IChatChunk> {
    if (!this.rpcClient) {
      return RpcMock.mockChatStream();
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
    const rawStream = this.rpcClient.call(EnumRpcMessage.ChatStream, params, true);
    return rawStream.pipeThrough(
      new TransformStream<any, IChatChunk>({
        transform(chunk, controller) {
          const delta = chunk.choices?.[0]?.delta;
          if (delta) {
            const reasoning = delta.reasoning || delta.reasoning_content || '';
            if (reasoning) controller.enqueue({ type: 'reasoning', data: reasoning });
            const content = delta.content || '';
            if (content) controller.enqueue({ type: 'content', data: content });
          }
        },
      })
    );
  }

  async stopChat(): Promise<any> {
    if (!this.rpcClient) {
      RpcMock.abort();
      return;
    }
    return this.rpcClient.call(EnumRpcMessage.Stop, {});
  }
}

export const chatRpcClient = new ChatRpcClient();
