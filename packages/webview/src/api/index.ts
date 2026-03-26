import { openaiService } from './services/openai';

export type ChatVendor = 'ollama' | 'deepseek' | 'gemini' | 'openai';

export interface ChatParams {
  model: string;
  content: string;
  messages: any[];
}

class ChatService {
  private getService() {
    return openaiService;
  }

  chat(params: ChatParams, callback: any, end: any) {
    return this.getService().chat(params, callback, end);
  }

  stop() {
    return this.getService().stop();
  }
}

export const chatService = new ChatService();
