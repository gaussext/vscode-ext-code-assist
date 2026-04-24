import type { IChatParams, IModelParams } from '@/models/Model';
import { chatRpcService } from './rpc';

class ChatService {
  models(params: IModelParams) {
    return chatRpcService.models(params);
  }

  summary(params: IChatParams) {
    return chatRpcService.summary(params);
  }

  chat(params: IChatParams, callback: any, end: any) {
    return chatRpcService.streamMessage(params, {
      onChunk: callback,
      onComplete: end,
      onError: (error: Error) => {
        callback(`Error: ${error.message}`);
        end();
      }
    });
  }

  stop() {
    return chatRpcService.stopChat();
  }
}

export const chatService = new ChatService();
