import * as UUID from 'uuid';

type MessageRole = 'system' | 'user' | 'assistant';

export class ChatMessage {
  id: string = UUID.v4();
  conversationId: string = UUID.v4();
  role: MessageRole = 'system';
  model: string = '';
  content: string = '';
  reasoning?: string = '';
  startTime?: number = Date.now();
  loadTime?: number = Date.now();
  endTime?: number = Date.now();
  constructor(role: MessageRole, conversationId: string) {
    this.role = role;
    this.conversationId = conversationId;
  }
}