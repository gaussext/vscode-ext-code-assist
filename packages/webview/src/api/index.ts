import { chatRpcService } from './rpc';

export interface ChatParams {
  model: string;
  content: string;
  messages: any[];
  apiKey: string;
  baseURL?: string;
}

class ChatService {
  chat(params: ChatParams, callback: any, end: any) {
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
