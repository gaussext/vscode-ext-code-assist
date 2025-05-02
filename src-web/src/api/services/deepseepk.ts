import axios from "axios";
import { createRequestData } from "../utils";

const origin = "https://api.deepseek.com"; // code-assist.deepseek
const API_TAGS = origin + "/api/tags";
const API_CHAT = origin + "/api/chat";
const API_STOP = origin + "/api/delete";


class DeepseekService {

    getModels() {
        return axios.get(API_TAGS)
    }

    stop() {
        return axios.get(API_STOP)
    }

    async chat(
        prompt: string,
        messages: any[],
        model: string,
        controller: AbortController
    ) {
        const data = createRequestData(model, prompt, messages);
        return  axios.post(API_CHAT, data, {
            method: "POST",
            responseType: 'stream',
            signal: controller.signal,
            adapter: 'fetch'
        });
    }
    
}