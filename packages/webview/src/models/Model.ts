import { useSettingStore } from '@/stores/setting';
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
  model: string = 'qwen3:0.6b';
  content: string = '';
  reasoning?: string = '';
  startTime?: number = Date.now();
  loadTime?: number = Date.now();
  endTime?: number = Date.now();
  constructor(role: MessageRole, conversationId: string) {
    const settingStore = useSettingStore();
    this.role = role;
    this.model = settingStore.currentModel.id;
    this.conversationId = conversationId;
  }
}

export interface IChatParams {
  model: string;
  messages: any[];
  apiKey: string;
  baseURL: string;
}

export interface IModelParams {
  apiKey: string;
  baseURL: string;
}

export enum EnumTemperature {
  CodeAndMath = 0.0,
  DataAnalysis = 1.0,
  Translation = 1.3,
  CreativeWriting = 1.5,
}
