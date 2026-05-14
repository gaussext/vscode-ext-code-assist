import type { IProviderParams } from './types';
import { AcpClient, type ProviderConfig } from '@/acp/AcpClient';

const SESSION_KEY_PREFIX = 'acp_session_';

class ChatRpcClient {
  private acpClient: AcpClient;
  private sessionIdByConfig = new Map<string, string>();

  constructor() {
    this.acpClient = new AcpClient();
  }

  /** 初始化并恢复持久化的 session — 在 app 启动时调用 */
  async initSession(config: ProviderConfig): Promise<void> {
    await this.acpClient.initialize();

    const key = this.configKey(config);
    const inMem = this.sessionIdByConfig.get(key);
    if (inMem) return;

    const stored = localStorage.getItem(this.storageKey(config));
    if (stored) {
      this.sessionIdByConfig.set(key, stored);
      this.acpClient['_sessionId'] = stored;
      return;
    }

    const sessionId = await this.acpClient.createSession('', config);
    this.sessionIdByConfig.set(key, sessionId);
    localStorage.setItem(this.storageKey(config), sessionId);
  }

  /** 回放指定 session 的历史消息，返回完整消息列表 */
  async loadAndReplayHistory(config: ProviderConfig): Promise<{ role: string; content: string }[]> {
    const stored = localStorage.getItem(this.storageKey(config));
    if (!stored) return [];

    await this.acpClient.initialize();

    const history = await this.acpClient.loadSessionHistory(stored);
    this.sessionIdByConfig.set(this.configKey(config), stored);
    this.acpClient['_sessionId'] = stored;

    return this.mergeHistory(history);
  }

  private configKey(config: ProviderConfig): string {
    return `${config.baseURL}|${config.model}`;
  }

  private storageKey(config: ProviderConfig): string {
    return SESSION_KEY_PREFIX + this.configKey(config);
  }

  private mergeHistory(
    history: { type: 'user_message_chunk' | 'agent_message_chunk'; text: string }[],
  ): { role: string; content: string }[] {
    const messages: { role: string; content: string }[] = [];
    let cur: { role: string; content: string } | null = null;
    for (const chunk of history) {
      const role = chunk.type === 'user_message_chunk' ? 'user' : 'agent';
      if (cur && cur.role === role) {
        cur.content += chunk.text;
      } else {
        if (cur) messages.push(cur);
        cur = { role, content: chunk.text };
      }
    }
    if (cur) messages.push(cur);
    return messages;
  }

  async models(params: IProviderParams): Promise<any> {
    if (typeof (globalThis as any).acquireVsCodeApi === 'undefined') {
      return { object: 'list', data: [] };
    }
    await this.acpClient.initialize();
    return this.acpClient.listModels(params.baseURL, params.apiKey);
  }

  /** 非流式聊天（用于 summary / 模型测试），直接发消息到 Agent 单次完成 */
  async chatRaw(params: {
    baseURL: string;
    apiKey: string;
    model: string;
    messages: { role: string; content: string }[];
  }): Promise<any> {
    await this.acpClient.initialize();
    const sessionId = await this.acpClient.createSession('', {
      baseURL: params.baseURL,
      apiKey: params.apiKey,
      model: params.model,
      provider: params.baseURL,
    });
    await this.acpClient.saveSession({
      sessionId,
      messages: params.messages,
    });

    let fullContent = '';
    return new Promise((resolve, reject) => {
      const cleanup = this.acpClient.onUpdate((chunk) => {
        if (chunk.type === 'agent_message_chunk') {
          fullContent += chunk.text;
        }
      });
      this.acpClient.prompt(params.messages.map(m => m.content).join('\n'))
        .then(() => {
          cleanup();
          resolve({ choices: [{ message: { content: fullContent } }] });
        })
        .catch((err) => {
          cleanup();
          reject(err);
        });
    });
  }

  /**
   * 发送提示词并使用回调接收流式块
   * @param sessionId 当前会话 ID
   * @param text 用户消息
   * @param onChunk 每个 agent_message_chunk 的回调
   * @param signal 可选的取消信号
   */
  async sendPrompt(
    sessionId: string,
    text: string,
    onChunk?: (chunk: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    await this.acpClient.initialize();
    this.acpClient['_sessionId'] = sessionId;

    const cleanup = this.acpClient.onUpdate((chunk) => {
      if (chunk.type === 'agent_message_chunk') {
        onChunk?.(chunk.text);
      }
    });

    if (signal) {
      signal.addEventListener('abort', () => {
        this.acpClient.cancel();
        cleanup();
      }, { once: true });
    }

    try {
      await this.acpClient.prompt(text);
    } finally {
      cleanup();
    }
  }

  async stopChat(sessionId?: string): Promise<any> {
    if (sessionId) {
      await this.acpClient.initialize();
      this.acpClient.cancelSession(sessionId);
    } else {
      this.acpClient.cancel();
    }
    return { message: 'stopped' };
  }

  // ---- Session CRUD (delegated to the Agent) ----

  async listAllSessions(): Promise<{ id: string; title: string; updatedAt: string }[]> {
    await this.acpClient.initialize();
    return this.acpClient.listSessions();
  }

  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    await this.acpClient.initialize();
    return this.acpClient.updateSessionTitle(sessionId, title);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.acpClient.initialize();
    return this.acpClient.deleteSession(sessionId);
  }

  async getSessionMessages(sessionId: string): Promise<{ messages: { role: string; content: string }[]; model: string; provider: string; title: string }> {
    await this.acpClient.initialize();
    return this.acpClient.getSessionMessages(sessionId);
  }

  async saveSession(data: { sessionId: string; title?: string; messages?: { role: string; content: string }[] }): Promise<void> {
    await this.acpClient.initialize();
    return this.acpClient.saveSession(data);
  }

  async summarizeSession(sessionId: string, baseURL: string, apiKey: string, model: string): Promise<string> {
    await this.acpClient.initialize();
    return this.acpClient.summarizeSession(sessionId, baseURL, apiKey, model);
  }

}

export type { ProviderConfig } from '@/acp/AcpClient';
export const chatRpcClient = new ChatRpcClient();
