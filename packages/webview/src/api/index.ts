import type { IChatParams } from '@/models/Model';
import { chatRpcService } from './rpc';

class ChatService {
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
