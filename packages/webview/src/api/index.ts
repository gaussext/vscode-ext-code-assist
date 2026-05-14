import type { IChatParams, IProviderParams } from 'code-assist-shared';
import { chatRpcClient, type ProviderConfig } from './rpc';
import type { IChatChunk } from '@/types';

export type { ProviderConfig };

class ChatService {
  models(params: IProviderParams) {
    return chatRpcClient.models(params);
  }

  chat(params: IChatParams) {
    return chatRpcClient.chat(params);
  }

  chatStream(params: IChatParams, signal?: AbortSignal): ReadableStream<IChatChunk> {
    return chatRpcClient.chatStream(params, signal);
  }

  stop() {
    return chatRpcClient.stopChat();
  }

  /** 从 ACP Agent 预加载历史消息，用于 webview 重连后恢复对话 */
  loadAndReplayHistory(config: ProviderConfig) {
    return chatRpcClient.loadAndReplayHistory(config);
  }
}

export const chatService = new ChatService();
