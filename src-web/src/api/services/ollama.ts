import axios from "axios";
import { createRequestData } from "../utils";

const origin = "http://127.0.0.1:11434"; // code-assist.ollama
const API_TAGS = origin + "/api/tags";
const API_CHAT = origin + "/api/chat";
const API_STOP = origin + "/api/delete";

interface ChatParams {
    model: string;
    content: string;
    messages: any[];
}

class OllamaService {

    private controller = new AbortController();

    getModels() {
        return axios.get(API_TAGS)
    }

    stop() {
        this.controller.abort();
        return axios.get(API_STOP)
    }

    async chat({ content, messages, model }: ChatParams, callback: any) {
        const data = createRequestData(model, content, messages);
        const response = await axios.post(API_CHAT, data, {
            method: "POST",
            responseType: 'stream',
            signal: this.controller.signal,
            adapter: 'fetch'
        });
        const reader = response.data.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            const text = decoder.decode(value, { stream: true });
            if (text.trim()) {
                callback(text)
            }
        }
    }

}

export const ollamaService = new OllamaService();