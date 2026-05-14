import type { SessionData, StoredMessage } from './SessionStore';

export interface PromptConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  provider: string;
}

export class ACPSession {
  data: SessionData;
  config: PromptConfig = { baseURL: '', apiKey: '', model: '', provider: '' };
  activeController: AbortController | null = null;

  constructor(id: string, cwd: string, config?: Partial<PromptConfig>) {
    this.data = {
      id,
      cwd,
      messages: [],
      title: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  static fromData(data: SessionData): ACPSession {
    const session = new ACPSession(data.id, data.cwd);
    session.data = { ...data, messages: [...data.messages] };
    return session;
  }

  addMessage(msg: StoredMessage): void {
    this.data.messages.push(msg);
    this.data.updatedAt = Date.now();
  }

  /** 转成 OpenAI API 需要的消息格式 */
  toCompletionMessages(): { role: string; content: string }[] {
    const result: { role: string; content: string }[] = [];
    for (const m of this.data.messages) {
      if (m.role === 'agent' || m.role === 'think') {
        result.push({ role: 'assistant', content: m.content });
      } else if (m.role === 'tool') {
        result.push({ role: 'tool', content: m.content });
      } else {
        result.push({ role: m.role as 'user' | 'system', content: m.content });
      }
    }
    return result;
  }

  cancel(): void {
    this.activeController?.abort();
    this.activeController = null;
  }
}
