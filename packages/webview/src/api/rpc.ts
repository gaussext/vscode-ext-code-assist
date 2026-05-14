import type { IChatParams, IProviderParams } from 'code-assist-shared';
import { AcpClient, type ProviderConfig } from '@/lib/AcpClient';
import type { IChatChunk } from '@/types';
import { RpcMock } from './rpc-mock';

class ChatRpcClient {
  private acpClient: AcpClient;
  private lastProviderConfig: ProviderConfig | null = null;

  constructor() {
    this.acpClient = new AcpClient();
  }

  private async ensureSession(config: ProviderConfig): Promise<void> {
    await this.acpClient.initialize();
    this.lastProviderConfig = config;
    if (!this.acpClient.sessionId) {
      await this.acpClient.createSession('', config);
    }
  }

  async models(params: IProviderParams): Promise<any> {
    if (typeof (globalThis as any).acquireVsCodeApi === 'undefined') {
      return RpcMock.mockModels();
    }
    await this.acpClient.initialize();
    return this.acpClient.listModels(params.baseURL, params.apiKey);
  }

  async chat(params: IChatParams): Promise<any> {
    await this.ensureSession({
      baseURL: params.baseURL,
      apiKey: params.apiKey,
      model: params.model,
      provider: params.baseURL,
    });

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
        try {
          await this.acpClient.initialize();

          const config: ProviderConfig = {
            baseURL: params.baseURL,
            apiKey: params.apiKey,
            model: params.model,
            provider: params.baseURL,
          };
          this.lastProviderConfig = config;

          const sessionId = await this.acpClient.createSession('', config);

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
}

export const chatRpcClient = new ChatRpcClient();
