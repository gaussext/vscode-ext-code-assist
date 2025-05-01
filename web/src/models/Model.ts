import * as uuid from 'uuid';
declare const acquireVsCodeApi: any;
export const vscode = acquireVsCodeApi();

export class Conversation {
    id: string = '0';
    title: string = '新建对话';
}

export class Info {
    modelId: string = "";
    startTime: number = 0;
    endTime: number = 0;
    duration: number = 0;
    tokens: number = 0;
}

export class State extends Info {
    content: string = "";
    isLoading: boolean = false;
}

type MessageRole = 'system' | 'user' | 'assistant';

export class ChatMessage {
    role: MessageRole = "system";
    content = '';
    uuid = uuid.v4();
    timestamp = Date.now();
    constructor(role: MessageRole) {
        this.role = role;
    }
}

export class AIModel {
    name: string = "";
    model: string = "";
}

export class IPC {
    // 获取模型列表
    getModels() {
        vscode.postMessage({
            command: "tags",
        });
    }

    // 发送聊天消息
    chat(model: string, text: string, messages: ChatMessage[]) {
        console.log({
            command: "chat",
            model: model,
            text: text,
            messages: messages,
        });
        
        vscode.postMessage({
            command: "chat",
            model: model,
            text: text,
            messages:  JSON.stringify(messages),
        });
    }

    // 中止聊天
    stop() {
        vscode.postMessage({
            command: "stop",
        });
    }
}

export const event = new IPC();;