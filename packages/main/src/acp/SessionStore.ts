import * as vscode from 'vscode';
import type { ICompletionMessage } from 'code-assist-shared';

export interface SessionData {
  id: string
  cwd: string
  messages: ICompletionMessage[]
  model: string
  provider: string
  title: string
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'acp-sessions';

export class SessionStore {
  constructor(private storage: vscode.Memento) {}

  async save(data: SessionData): Promise<void> {
    const all = this.getAll();
    all[data.id] = data;
    await this.storage.update(STORAGE_KEY, all);
  }

  async delete(sessionId: string): Promise<void> {
    const all = this.getAll();
    delete all[sessionId];
    await this.storage.update(STORAGE_KEY, all);
  }

  async updateTitle(sessionId: string, title: string): Promise<void> {
    const all = this.getAll();
    if (all[sessionId]) {
      all[sessionId].title = title;
      all[sessionId].updatedAt = Date.now();
      await this.storage.update(STORAGE_KEY, all);
    }
  }

  load(sessionId: string): SessionData | null {
    return this.getAll()[sessionId] ?? null;
  }

  list(): SessionData[] {
    return Object.values(this.getAll()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  private getAll(): Record<string, SessionData> {
    return this.storage.get<Record<string, SessionData>>(STORAGE_KEY, {});
  }
}
