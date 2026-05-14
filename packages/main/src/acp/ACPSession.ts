import type { ICompletionMessage } from 'code-assist-shared';
import type { SessionData } from './SessionStore';

export interface PromptConfig {
  baseURL: string
  apiKey: string
  model: string
  provider: string
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
      model: config?.model ?? '',
      provider: config?.provider ?? '',
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
    session.data = { ...data };
    return session;
  }

  addMessage(msg: ICompletionMessage): void {
    this.data.messages.push(msg);
    this.data.updatedAt = Date.now();
  }

  cancel(): void {
    this.activeController?.abort();
    this.activeController = null;
  }
}
