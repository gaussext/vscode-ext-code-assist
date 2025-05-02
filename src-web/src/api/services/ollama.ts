import axios from "axios";
import { type ChatParams } from "..";
import { type StandardItem } from "../../types";
import { getJsonSafe } from "../utils";

const setting = (window as any).setting;

const ORIGIN = setting.get("ollama") || "http://127.0.0.1:11434"; // code-assist.ollama
const API_TAGS = ORIGIN + "/api/tags";
const API_CHAT = ORIGIN + "/api/chat";
// const API_STOP = ORIGIN + "/api/delete";

interface IOllamaModelDetails {
    format: string;
    family: string;
    families: null;
    parameter_size: string;
    quantization_level: string;
}

interface IOllamaModel {
    name: string;
    modified_at: string;
    size: number;
    digest: string;
    details: IOllamaModelDetails;
}

export function createRequestData({ content, messages, model }: ChatParams) {
    return {
        model,
        messages: [
            ...messages,
            {
                role: "user",
                content: content,
            },
        ],
        stream: true,
        raw: true,
    };
}

class OllamaService {

    private controller = new AbortController();

    getModels() {
        return axios.get(API_TAGS).then(res => {
            const result = {
                data: {
                    models: res.data.models.map((item: IOllamaModel) => {
                        return {
                            value: item.name,
                            label: item.name,
                        }
                    }) as StandardItem<string>[]
                }
            }
            return Promise.resolve(result)
        })
    }
    stop() {
        this.controller.abort();
    }

    async chat({ content, messages, model }: ChatParams, callback: any, end: any) {
        const data = createRequestData({ model, content, messages });
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
                end && end();
                break;
            }
            const text = decoder.decode(value, { stream: true });
            if (text.trim()) {
                const json = getJsonSafe(text, { message: { content: '' } });
                const delta = json?.message?.content || '';
                callback && callback(delta);
            }
        }
    }

}

export const ollamaService = new OllamaService();