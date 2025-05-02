import * as uuid from 'uuid';
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
    value: string = "";
    label: string = "";
}