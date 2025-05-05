import { deepseekService } from "./services/deepseepk";
import { ollamaService } from "./services/ollama";

export interface ChatParams {
    model: string;
    content: string;
    messages: any[];
}

export type ChatVendor = 'ollama' | 'deepseek';

class ChatService {

    // 服务提供商
    vendor: ChatVendor = 'ollama';

    private getService() {
        if (this.vendor === 'ollama') {
            return ollamaService;
        } else {
            return deepseekService;
        }
    }

    setVendor(vendor: ChatVendor) {
        this.vendor = vendor;
    }

    getModels() {
        return this.getService().getModels();
    }

    chat(params: ChatParams, callback: any, end: any) {
        return this.getService().chat(params, callback, end)
    }

    stop() {
        return this.getService().stop();
    }
}
export const chatService = new ChatService();