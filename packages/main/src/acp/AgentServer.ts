import * as vscode from 'vscode';
import {
  AgentSideConnection,
  type Stream,
  type Agent,
  type InitializeRequest,
  type InitializeResponse,
  type NewSessionRequest,
  type NewSessionResponse,
  type PromptRequest,
  type PromptResponse,
  type CancelNotification,
  type LoadSessionRequest,
  type LoadSessionResponse,
  type ListSessionsRequest,
  type ListSessionsResponse,
  type CloseSessionRequest,
  type CloseSessionResponse,
  type PromptCapabilities,
  type SessionCapabilities,
  type AgentCapabilities,
} from '@agentclientprotocol/sdk';
import { OpenAIService } from '../services/OpenAIService';
import { SessionStore } from './SessionStore';
import { ACPSession, type PromptConfig } from './ACPSession';

export class AgentServer {
  private sessions = new Map<string, ACPSession>();
  private connection: AgentSideConnection | null = null;
  private sessionStore: SessionStore;
  private openaiService: OpenAIService;
  private disposables: vscode.Disposable[] = [];

  constructor(globalState: vscode.Memento) {
    this.sessionStore = new SessionStore(globalState);
    this.openaiService = new OpenAIService();
  }

  connect(stream: Stream): void {
    this.connection = new AgentSideConnection(() => this.createAgentHandler(), stream);

    this.disposables.push({
      dispose: () => {
        stream.writable.close();
      },
    });
  }

  private createAgentHandler(): Agent {
    const self = this;
    return {
      initialize(_params: InitializeRequest): Promise<InitializeResponse> {
        const caps: AgentCapabilities = {
          loadSession: true,
          sessionCapabilities: { list: {}, close: {} } as SessionCapabilities,
          promptCapabilities: {
            image: false,
            audio: false,
            embeddedContext: true,
          } as PromptCapabilities,
          mcpCapabilities: { http: false, sse: false },
        };
        return Promise.resolve({
          protocolVersion: 1,
          agentCapabilities: caps,
          agentInfo: {
            name: 'code-assist-agent',
            version: '1.0.0',
          },
          authMethods: [],
        });
      },

      newSession(params: NewSessionRequest): Promise<NewSessionResponse> {
        const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        let config: PromptConfig | undefined;
        const metaProvider = (params._meta as any)?.provider;
        if (metaProvider) {
          config = {
            baseURL: metaProvider.baseURL || '',
            apiKey: metaProvider.apiKey || '',
            model: metaProvider.model || '',
            provider: metaProvider.provider || '',
          };
        }

        const session = new ACPSession(id, params.cwd, config);
        self.sessions.set(id, session);
        return Promise.resolve({ sessionId: id });
      },

      async prompt(params: PromptRequest): Promise<PromptResponse> {
        const session = self.sessions.get(params.sessionId);
        if (!session) {
          return { stopReason: 'end_turn' };
        }

        const userText = params.prompt
          .filter((b) => b.type === 'text')
          .map((b) => (b as { text: string }).text)
          .join('\n');

        if (!userText) {
          return { stopReason: 'end_turn' };
        }

        session.addMessage({ role: 'user', content: userText });

        const controller = new AbortController();
        session.activeController = controller;

        try {
          const { baseURL, apiKey, model } = session.config;
          if (!baseURL || !apiKey || !model) {
            throw new Error('Provider not configured. Please set up API provider first.');
          }

          const stream = await self.openaiService.chatStream({
            baseURL,
            apiKey,
            model,
            messages: session.data.messages,
          });

          let content = '';
          let reasoning = '';

          if (stream instanceof ReadableStream) {
            const reader = stream.getReader();
            while (!controller.signal.aborted) {
              const { done, value } = await reader.read();
              if (done) {break;}

              const delta = value.choices?.[0]?.delta;
              if (delta) {
                const text = delta.content || '';
                const reason = delta.reasoning || delta.reasoning_content || '';

                if (text) {
                  content += text;
                  await self.sendChunk(params.sessionId, text);
                }
                if (reason) {
                  reasoning += reason;
                  await self.sendChunk(params.sessionId, reason);
                }
              }
            }
          }

          if (controller.signal.aborted) {
            return { stopReason: 'cancelled' };
          }

          const fullContent = reasoning ? `${reasoning}\n\n${content}` : content;
          session.addMessage({ role: 'assistant', content: fullContent });
          await self.sessionStore.save(session.data);

          return { stopReason: 'end_turn' };
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') {
            return { stopReason: 'cancelled' };
          }
          const msg = err instanceof Error ? err.message : 'Unknown error';
          session.addMessage({ role: 'assistant', content: `Error: ${msg}` });
          await self.sessionStore.save(session.data);
          return { stopReason: 'end_turn' };
        } finally {
          session.activeController = null;
        }
      },

      cancel(params: CancelNotification): Promise<void> {
        const session = self.sessions.get(params.sessionId);
        session?.cancel();
        return Promise.resolve();
      },

      async loadSession(params: LoadSessionRequest): Promise<LoadSessionResponse> {
        const stored = self.sessionStore.load(params.sessionId);
        if (!stored) {
          return {};
        }
        const session = ACPSession.fromData(stored);
        self.sessions.set(params.sessionId, session);

        for (const msg of session.data.messages) {
          const updateType = msg.role === 'user'
            ? 'user_message_chunk' as const
            : 'agent_message_chunk' as const;
          await self.sendChunk(params.sessionId, msg.content, updateType);
        }

        return {};
      },

      listSessions(_params: ListSessionsRequest): Promise<ListSessionsResponse> {
        const sessions = self.sessionStore.list();
        return Promise.resolve({
          sessions: sessions.map((s) => ({
            sessionId: s.id,
            cwd: s.cwd,
            title: s.title,
            updatedAt: new Date(s.updatedAt).toISOString(),
          })),
        });
      },

      closeSession(params: CloseSessionRequest): Promise<CloseSessionResponse | void> {
        const session = self.sessions.get(params.sessionId)
        session?.cancel()
        self.sessions.delete(params.sessionId)
        return Promise.resolve({})
      },

      extNotification(method: string, params: Record<string, unknown>): Promise<void> {
        return Promise.resolve()
      },

      extMethod(method: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
        if (method === 'code-assist/models') {
          return self.handleListModels(params as any)
        }
        return Promise.resolve({})
      },
    }
  }

  private async handleListModels(config: { baseURL: string; apiKey: string }): Promise<Record<string, unknown>> {
    try {
      const resp = await this.openaiService.models(config)
      return resp as Record<string, unknown>
    } catch (err: unknown) {
      return { message: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  private async sendChunk(
    sessionId: string,
    text: string,
    type: 'agent_message_chunk' | 'user_message_chunk' = 'agent_message_chunk',
  ): Promise<void> {
    if (!this.connection) {return;}
    try {
      await this.connection.sessionUpdate({
        sessionId,
        update: {
          sessionUpdate: type,
          content: { type: 'text' as const, text },
        },
      });
    } catch {
    }
  }

  dispose(): void {
    for (const session of this.sessions.values()) {
      session.cancel();
    }
    this.sessions.clear();
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
