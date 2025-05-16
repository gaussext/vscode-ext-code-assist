import type { ChatVendor } from "@/api";
import { deepseekService } from "@/api/services/deepseepk";
import { ollamaService } from "@/api/services/ollama";
import { getJsonSafe } from "@/utils";

const setting = (window as any).setting;
// code-assist.ollama
const OLLAMA = localStorage.getItem('setting.config.ollama') || setting.get("ollama") || "http://127.0.0.1:11434"; 
// code-assist.deepseek
const DEEPSEEK = localStorage.getItem('setting.config.deepseek') || setting.get("deepseek") || "https://api.deepseek.com"; 
// code-assist.deepseek_token
const DEEPSEEK_TOKEN = localStorage.getItem('setting.config.deepseek_token') || setting.get("deepseek_token") || ""; 

const SELECTED_MODELS = getJsonSafe(localStorage.getItem('setting.config.selectedModels') || '[]', []);

export interface IModel {
    vendor: ChatVendor;
    label: string;
    value: string;
    checked: boolean;
}
export class ChatModel implements IModel {
    vendor: ChatVendor = 'ollama';
    label: string = '';
    value: string = '';
    checked: boolean= true;
}

class Setting {

    private state = {
        models: {
            ollama: [] as IModel[],
            deepseek: [] as IModel[],
        },
        config: {
            ollama: '',
            deepseek: '',
            deepseek_token: '',
        },
        selectedModels: [] as IModel[]
    };

    constructor() {
        this.state.config.ollama = OLLAMA;
        this.state.config.deepseek = DEEPSEEK;
        this.state.config.deepseek_token = DEEPSEEK_TOKEN;
        this.state.selectedModels = SELECTED_MODELS;
        setTimeout(() => {
            this.fetchModels();
        });
    }

    fetchModels() {
        ollamaService.getModels().then((res) => {
            this.state.models.ollama = res.data.models.map((item) => {
                return {
                    vendor: 'ollama',
                    label: item.label,
                    value: item.value,
                    checked: false
                } as IModel;
            });
        });
        deepseekService.getModels().then((res) => {
            this.state.models.deepseek = res.data.models.map((item) => {
                return {
                    vendor: 'deepseek',
                    label: item.label,
                    value: item.value,
                    checked: false
                } as IModel;
            });
        });
    }

    get models() {
        return [
            {
                vedor: 'ollama',
                label: 'Ollama',
                value: 'ollama',
                children: this.state.models.ollama.map((item) => {
                    return {
                        vendor: 'ollama',
                        label: item.label,
                        value: item.value,
                        checked: this.state.selectedModels.findIndex((item2) => item2.value === item.value) > -1,
                    } as IModel;
                }),
            },
            {
                label: 'DeepSeek',
                value: 'deepseek',
                vendor: 'deepseek',
                children: this.state.models.deepseek.map((item) => {
                    return {
                        vendor: 'deepseek',
                        label: item.label,
                        value: item.value,
                        checked: this.state.selectedModels.findIndex((item2) => item2.value === item.value) > -1,
                    } as IModel;
                })
            }
        ];
    }

    get selectedModels() {
        return this.state.selectedModels;
    }

    set selectedModels(value: IModel[]) {
        this.state.selectedModels = value;
        localStorage.setItem('setting.config.selectedModels', JSON.stringify(value));
    }

    get ollama() {
        return this.state.config.ollama;
    }

    set ollama(value: string) {
        this.state.config.ollama = value;
        localStorage.setItem('setting.config.ollama', value);
    }

    get deepseek() {
        return this.state.config.deepseek;
    }

    set deepseek(value: string) {
        this.state.config.deepseek = value;
        localStorage.setItem('setting.config.deepseek', value);
    }

    get deepseekToken() {
        return this.state.config.deepseek_token;
    }

    set deepseekToken(value: string) {
        this.state.config.deepseek_token = value;
        localStorage.setItem('setting.config.deepseek_token', value);
    }
}

export default new Setting();