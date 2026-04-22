import { useSettingStore } from '@/stores/setting';
import * as uuid from 'uuid';

export class ChatConversation {
  id: string = '0';
  title: string = '新建对话';
  uuid: string = uuid.v4();
}

type MessageRole = 'system' | 'user' | 'assistant';

export class ChatMessage {
  role: MessageRole = 'system';
  model: string = 'qwen3:0.6b';
  content: string = '';
  uuid: string = uuid.v4();
  startTime?: number = Date.now();
  timestamp?: number = Date.now();
  constructor(role: MessageRole) {
    const settingStore = useSettingStore();
    this.role = role;
    this.model = settingStore.currentModel.id;
  }
}

export interface IChatParams {
  model: string;
  messages: any[];
  apiKey: string;
  baseURL?: string;
}

export enum EnumTemperature {
  CodeAndMath = 0.0,
  DataAnalysis = 1.0,
  Translation = 1.3,
  CreativeWriting = 1.5,
}
