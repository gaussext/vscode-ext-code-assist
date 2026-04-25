import * as UUID from 'uuid';

export class ChatConversation {
  id: string = UUID.v4();
  title: string = 'New Session';
  isSummary: boolean = false;
}

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

export interface IChatParams {
  model: string;
  messages: any[];
  apiKey: string;
  baseURL: string;
}

export interface IProviderParams {
  apiKey: string;
  baseURL: string;
}

export enum EnumTemperature {
  CodeAndMath = 0.0,
  DataAnalysis = 1.0,
  Translation = 1.3,
  CreativeWriting = 1.5,
}

export class Model {
  id: string = ''
  hash?: string = '';
}

export interface IOption {
  value: string;
  label: string;
}