import axios from "axios";
import { type ChatParams } from "../../api";
import { type StandardItem } from "../../types";
import { getJsonSafe } from "../utils";

const setting = (window as any).setting;
const ORIGIN = setting.get("deepseek") || "https://api.deepseek.com"; // code-assist.deepseek
const TOKEN = setting.get("deepseek_token") || ""; // code-assist.deepseek_token
const API_CHAT = ORIGIN + "/chat/completions";

function createRequestData({ content, messages, model }: ChatParams) {
    return {
        "messages": [
            ...messages,
            {
                "content": content,
                "role": "user"
            }
        ],
        "model": model,
        "stream": true, // stream
    };
}

class DeepseekService {

    private controller = new AbortController();

    getModels() {
        return Promise.resolve({
            data: {
                models: [
                    {
                        "value": "deepseek-chat",
                        "label": "deepseek-chat",
                    },
                    {
                        "value": "deepseek-reasoner",
                        "label": "deepseek-reasoner",
                    }
                ] as StandardItem<string>[]
            }
        });
    }

    stop() {
        this.controller.abort();
    }

    async chat({ content, messages, model }: ChatParams, callback: any, end: any) {
        if (!TOKEN) {
            end('请配置 code-assist.deepseek_token');
            return;
        }
        this.controller = new AbortController();
        const data = createRequestData({ model, content, messages });
        const response = await axios.post(API_CHAT, data, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                Authorization: `Bearer ${TOKEN}`
            },
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
            const lines = text.split('data: ');
            lines.forEach(line => {
                const json = line.trim();
                if (json.startsWith('{') && json.endsWith('}')) {
                    const obj = getJsonSafe(json, { choices: [] });
                    if (obj.choices) {
                        obj.choices.forEach((item: any) => {
                            callback(item.delta?.content || '');
                        });
                    }
                }
            });

        }
    }

}

export const deepseekService = new DeepseekService();
