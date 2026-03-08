import type { ChatVendor } from '@/api';
import * as uuid from 'uuid';

export class ChatConversation {
  id: string = '0';
  title: string = '新建对话';
  uuid: string = uuid.v4();
}

type MessageRole = 'system' | 'user' | 'assistant';

export class ChatMessage {
  role: MessageRole = 'system';
  vendor: ChatVendor;
  model: string;
  content: string = '';
  uuid: string = uuid.v4();
  startTime: number = Date.now();
  timestamp: number = Date.now();
  constructor(role: MessageRole) {
    this.role = role;
  }
}
