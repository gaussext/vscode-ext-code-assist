import type { IChatParams, IProviderParams } from 'code-assist-shared';
import { AcpClient, type ProviderConfig } from '@/lib/AcpClient';
import type { IChatChunk } from '@/types';
import { RpcMock } from './rpc-mock';

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
      const role = chunk.type === 'user_message_chunk' ? 'user' : 'assistant';
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
      return RpcMock.mockModels();
    }
    await this.acpClient.initialize();
    return this.acpClient.listModels(params.baseURL, params.apiKey);
  }

  async chat(params: IChatParams): Promise<any> {
    const config: ProviderConfig = {
      baseURL: params.baseURL,
      apiKey: params.apiKey,
      model: params.model,
      provider: params.baseURL,
    };

    await this.initSession(config);

    let fullContent = '';
    return new Promise((resolve, reject) => {
      const cleanup = this.acpClient.onUpdate((chunk) => {
        if (chunk.type === 'agent_message_chunk') {
          fullContent += chunk.text;
        }
      });

      const promptText = params.messages.map(m => m.content).join('\n');
      this.acpClient.prompt(promptText)
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

  chatStream(params: IChatParams, signal?: AbortSignal): ReadableStream<IChatChunk> {
    if (typeof (globalThis as any).acquireVsCodeApi === 'undefined') {
      return RpcMock.mockChatStream(signal);
    }

    return new ReadableStream<IChatChunk>({
      start: async (controller) => {
        const config: ProviderConfig = {
          baseURL: params.baseURL,
          apiKey: params.apiKey,
          model: params.model,
          provider: params.baseURL,
        };

        try {
          await this.initSession(config);

          const cleanup = this.acpClient.onUpdate((chunk) => {
            if (chunk.type === 'agent_message_chunk') {
              controller.enqueue({ type: 'content', data: chunk.text } as IChatChunk);
            }
          });

          if (signal) {
            signal.addEventListener('abort', () => {
              this.acpClient.cancel();
              cleanup();
            }, { once: true });
          }

          const promptText = params.messages.map((m) => m.content).join('\n');
          const promptMsg = params.messages.find(m => m.role === 'user')?.content || promptText;
          await this.acpClient.prompt(promptMsg);

          cleanup();
          controller.close();
        } catch (err: any) {
          if (err?.name !== 'AbortError' && err?.message !== 'Aborted') {
            controller.enqueue({ type: 'error', data: err?.message || 'Unknown error' });
          }
          controller.close();
        }
      },
    });
  }

  async stopChat(): Promise<any> {
    this.acpClient.cancel();
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

  async saveSession(data: { sessionId: string; title?: string; messages?: { role: string; content: string }[]; model?: string; provider?: string }): Promise<void> {
    await this.acpClient.initialize();
    return this.acpClient.saveSession(data);
  }
}

export type { ProviderConfig } from '@/lib/AcpClient';
export const chatRpcClient = new ChatRpcClient();
