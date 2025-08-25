import setting from "@/setting";
import { deepseekService } from "./services/deepseepk";
import { ollamaService } from "./services/ollama";
import { geminiService } from "./services/gemini";

export type ChatVendor = 'ollama' | 'deepseek' | 'gemini';

export interface ChatParams {
    vendor: ChatVendor;
    model: string;
    content: string;
    messages: any[];
}

class ChatService {

    private getService(vendor?: ChatVendor) {
        if (vendor === 'ollama') {
            return ollamaService;
        } 
        if (vendor === 'deepseek')  {
            return deepseekService;
        }
        if (vendor === 'gemini') {
            return geminiService;
        }
        return ollamaService;
    }

    getModels() {
        return Promise.resolve(setting.selectedModels);
    }

    chat(params: ChatParams, callback: any, end: any) {
        return this.getService(params.vendor).chat(params, callback, end);
    }

    stop(vendor: ChatVendor) {
        return this.getService(vendor).stop();
    }
}
export const chatService = new ChatService();