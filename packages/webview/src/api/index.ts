import type { IChatParams, IProviderParams } from 'code-assist-shared';
import { chatRpcClient } from './rpc';
import type { IChatChunk } from '@/types';

class ChatService {
  models(params: IProviderParams) {
    return chatRpcClient.models(params);
  }

  chat(params: IChatParams) {
    return chatRpcClient.chat(params);
  }

  chatStream(params: IChatParams): ReadableStream<IChatChunk> {
    return chatRpcClient.chatStream(params);
  }

  stop() {
    return chatRpcClient.stopChat();
  }
}

export const chatService = new ChatService();
