import axios from "axios";
import { type ChatParams } from "@/api";
import { type StandardItem } from "@/types";
import { getJsonSafe } from "@/utils";
import setting from "@/setting";

export function createRequestData({ model, content, messages }) {
    return {
        messages: [
            ...messages,
            {
                content: content,
                role: "user"
            }
        ],
        model,
        stream: true,
    };
}

class GeminiService {

    private controller = new AbortController();

    getHeaders(TOKEN) {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${TOKEN}`
        };
    }

    getModels() {
        return Promise.resolve({
            data: {
                models: [
                    {
                        "value": "gemini-2.5-flash",
                        "label": "gemini-2.5-flash",
                    },
                    {
                        "value": "gemini-2.5-flash-lite",
                        "label": "gemini-2.5-flash-lite",
                    },
                    {
                        "value": "gemini-2.0-flash",
                        "label": "gemini-2.0-flash",
                    },
                    {
                        "value": "gemini-2.0-flash-lite",
                        "label": "gemini-2.0-flash-lite",
                    }
                ] as StandardItem<string>[]
            }
        });
    }

    stop() {
        this.controller.abort();
    }

    async chat({ content, messages, model }: ChatParams, callback: any, end: any) {
        const URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
        const TOKEN = setting.geminiToken;
        this.controller = new AbortController();
        const data = createRequestData({ model, content, messages });
        const response = await axios.post(URL, data, {
            method: "POST",
            headers: this.getHeaders(TOKEN),
            responseType: 'stream',
            signal: this.controller.signal,
            adapter: 'fetch',
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
                } else {
                    console.log(json);
                }
            });

        }
    }
}

export const geminiService = new GeminiService();