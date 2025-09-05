import axios from "axios";
import { type ChatParams } from "@/api";
import { type IStandardItem } from "@/types";
import { getJsonSafe } from "@/utils";
import setting from "@/setting";

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
        const URL = setting.ollama + "/api/tags";
        return axios.get(URL).then(res => {
            const result = {
                data: {
                    models: res.data.models.map((item: IOllamaModel) => {
                        return {
                            value: item.name,
                            label: item.name,
                        };
                    }) as IStandardItem<string>[]
                }
            };
            return Promise.resolve(result);
        });
    }
    stop() {
        this.controller.abort();
    }

    async chat({ content, messages, model }: ChatParams, callback: any, end: any) {
        const URL = setting.ollama + "/api/chat";
        this.controller = new AbortController();
        const data = createRequestData({ vendor: 'ollama', model, content, messages });
        const response = await axios.post(URL, data, {
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
            
            const json = text.trim();
            if (json.startsWith('{') && json.endsWith('}')) {
                const obj = getJsonSafe(json, { message: { content: '' } });
                const delta = obj?.message?.content || '';
                callback && callback(delta);
            } else {
                console.log(text);
            }
        }
    }

}

export const ollamaService = new OllamaService();