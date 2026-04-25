import type { IChatParams, IModelParams } from '@/models/Model';
import { chatRpcClient } from './rpc';

class ChatService {
  models(params: IModelParams) {
    return chatRpcClient.models(params);
  }

  summary(params: IChatParams) {
    return chatRpcClient.summary(params);
  }

  chat(params: IChatParams, callback: any, end: any) {
    return chatRpcClient.streamMessage(params, {
      onChunk: callback,
      onComplete: end,
      onError: (error: Error) => {
        callback(`Error: ${error.message}`);
        end();
      }
    });
  }

  stop() {
    return chatRpcClient.stopChat();
  }
}

export const chatService = new ChatService();
