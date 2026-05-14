import {
  ClientSideConnection,
  type Client,
  type SessionNotification,
  type TextContent,
} from '@agentclientprotocol/sdk'
import type { RequestPermissionRequest, RequestPermissionResponse } from '@agentclientprotocol/sdk'
import { createWebviewClientStream } from './acp-transport'

export interface ProviderConfig {
  baseURL: string
  apiKey: string
  model: string
  provider: string
}

export type SessionUpdateCallback = (chunk: {
  type: 'user_message_chunk' | 'agent_message_chunk'
  text: string
}) => void

export class AcpClient {
  private connection: ClientSideConnection | null = null
  private _sessionId: string | null = null
  private updateCallbacks: Set<SessionUpdateCallback> = new Set()
  private _initialized = false

  get sessionId(): string | null {
    return this._sessionId
  }

  get initialized(): boolean {
    return this._initialized
  }

  async initialize(): Promise<void> {
    if (this._initialized) return
    if (typeof (globalThis as any).acquireVsCodeApi === 'undefined') {
      return
    }

    const vscodeApi = (globalThis as any).acquireVsCodeApi()
    const stream = createWebviewClientStream(() => vscodeApi)

    this.connection = new ClientSideConnection(() => this.createClientHandler(), stream)

    await this.connection.initialize({
      protocolVersion: 1,
      clientCapabilities: {},
      clientInfo: { name: 'code-assist-webview', version: '1.0.0' },
    })

    this._initialized = true
  }

  private createClientHandler(): Client {
    const self = this
    return {
      sessionUpdate(params: SessionNotification): Promise<void> {
        const update = params.update
        if (update.sessionUpdate === 'agent_message_chunk' || update.sessionUpdate === 'user_message_chunk') {
          const content = update.content as TextContent & { type: 'text' }
          if (content?.text) {
            self.updateCallbacks.forEach((cb) =>
              cb({ type: update.sessionUpdate, text: content.text }),
            )
          }
        }
        return Promise.resolve()
      },

      requestPermission(_params: RequestPermissionRequest): Promise<RequestPermissionResponse> {
        return Promise.resolve({ outcome: 'cancelled' } as any)
      },
    }
  }

  onUpdate(callback: SessionUpdateCallback): () => void {
    this.updateCallbacks.add(callback)
    return () => this.updateCallbacks.delete(callback)
  }

  async createSession(cwd = '', providerConfig?: ProviderConfig): Promise<string> {
    if (!this.connection) throw new Error('ACP Client not initialized')
    const result = await this.connection.newSession({
      cwd,
      mcpServers: [],
      _meta: providerConfig ? { provider: providerConfig } : undefined,
    })
    this._sessionId = result.sessionId
    return result.sessionId
  }

  async loadSession(sessionId: string): Promise<void> {
    if (!this.connection) throw new Error('ACP Client not initialized')
    await this.connection.loadSession({ sessionId, cwd: '', mcpServers: [] })
    this._sessionId = sessionId
  }

  async prompt(text: string): Promise<void> {
    if (!this.connection || !this._sessionId) throw new Error('ACP Client not initialized')
    await this.connection.prompt({
      sessionId: this._sessionId,
      prompt: [{ type: 'text', text }],
    })
  }

  cancel(): void {
    if (!this._sessionId) return
    this.connection?.cancel({ sessionId: this._sessionId }).catch(() => {})
  }

  async listModels(baseURL: string, apiKey: string): Promise<any> {
    if (!this.connection) return { object: 'list', data: [] }
    try {
      return await this.connection.extMethod('code-assist/models', { baseURL, apiKey })
    } catch {
      return { object: 'list', data: [] }
    }
  }

  async listSessions(): Promise<{ id: string; title: string; updatedAt: string }[]> {
    if (!this.connection) return []
    const result = await this.connection.listSessions({})
    return result.sessions.map((s) => ({
      id: s.sessionId,
      title: s.title ?? '',
      updatedAt: s.updatedAt ?? '',
    }))
  }

  dispose(): void {
    this.updateCallbacks.clear()
    this.connection = null
    this._sessionId = null
    this._initialized = false
  }
}
