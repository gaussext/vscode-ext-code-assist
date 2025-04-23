import { SimpleIDB } from "./SimpleIDB";
declare const acquireVsCodeApi: any;

const vscode = acquireVsCodeApi();

class Conversation {
    id: string = '0';
    title: string = '新建对话';
    messages: any[] = [];
    timestamp: number = Date.now();
}

export class Info {
    model: string = "";
    startTime: number = 0;
    endTime: number = 0;
    duration: number = 0;
    tokens: number = 0;
}

export class State extends Info {
    content: string = "";
    isLoading: boolean = false;
}


export class Message {
    role = "";
    timestamp = Date.now();
    content = '';
    info = new Info();
}

export class AIModel {
    name: string = "";
    model: string = "";
}

export class Model {
    db = new SimpleIDB({
        dbName: "code-assist",
        storeName: "conversations",
        version: 4,
    });
    models: AIModel[] = [];
    conversations = [new Conversation()];
    conversationId = "0";
    state = new State();
    messages: Message[] = [];

    constructor() {
        this.state.model = localStorage.getItem("code-assist.model") || "";
    }

    // 获取模型列表
    getModels() {
        vscode.postMessage({
            command: "tags",
        });
    }

    // 发送聊天消息
    chat(model: string, text: string, messages: Message[]) {
        vscode.postMessage({
            command: "chat",
            model: model,
            text: text,
            messages: messages,
        });
    }

    // 中止聊天
    stop() {
        vscode.postMessage({
            command: "stop",
        });
    }

    // 更新模型
    updateModel(model: string) {
        this.state.model = model;
        localStorage.setItem("code-assist.model", model);
    }

    // 切换会话
    updateConversationId(id: string) {
        this.conversationId = id;
    }

    // 获取会话
    getConversations() {
        try {
            const list = JSON.parse(localStorage.getItem("conversations") as string) || [];
            if (list.length) {
                this.conversations = list;
                this.conversationId = list[0].id;
            }
        } catch (error) {
            this.conversations = [new Conversation()];
        }
    }

    // 创建会话
    createConversation() {
        const ids = this.conversations.map((item) => Number(item.id));
        const nextId = (Math.max(...ids) || 0) + 1;
        this.conversationId = `${nextId}`;
        this.conversations.push({
            id: this.conversationId,
            title: "新建对话",
            messages: [],
            timestamp: Date.now(),
        });
        this.saveConversations();
    }

    // 删除会话
    deleteConversation(id: string) {
        if (this.conversations.length <= 1) {
            return false;
        }
        this.conversations = this.conversations.filter((item) => item.id !== id);
        this.conversationId = this.conversations[0].id;
        this.saveConversations();
    }

    // 更新会话标题
    updateConversationTitle(message: string) {
        this.conversations.forEach((item) => {
            if (item.id === this.conversationId) {
                item.title = message.slice(0, 10) + "...";
            }
        });
        this.saveConversations();
    }



    // 保存会话列表
    saveConversations() {
        localStorage.setItem("conversations", JSON.stringify(this.conversations));
    }


    // 获取消息
    getMesasges() {
        this.messages = [];
        return this.db.get(this.conversationId).then((conversation) => {
            if (!conversation) {
                return false;
            }
            this.messages = (conversation as Conversation).messages || [];
            console.log(this.messages);
        });
    }

    addUserMessage(message: string) {
        this.messages.push({
            role: "user",
            timestamp: Date.now(),
            content: message,
            info: new State(),
        });
        this.saveMessages();
    }

    addAIMessage(message: string, info: Info) {
        this.messages.push({
            role: "assistant",
            timestamp: Date.now(),
            content: message,
            info: info,
        });
        this.saveMessages();
    }

    saveMessages() {
        this.db.set({
            id: this.conversationId,
            messages: this.messages,
            timestamp: Date.now(),
        });
    }
}
