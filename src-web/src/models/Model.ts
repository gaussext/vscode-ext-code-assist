import * as uuid from 'uuid';

export class ChatConversation {
    id: string = '0';
    title: string = '新建对话';
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