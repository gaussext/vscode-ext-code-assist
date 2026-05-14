import type { IChatParams, IProviderParams } from 'code-assist-shared';
import { chatRpcClient, type ProviderConfig } from './rpc';
import type { IChatChunk } from '@/types';

export type { ProviderConfig };

class ChatService {
  models(params: IProviderParams) {
    return chatRpcClient.models(params);
  }

  chat(params: IChatParams) {
    return chatRpcClient.chat(params);
  }

  chatStream(params: IChatParams, signal?: AbortSignal): ReadableStream<IChatChunk> {
    return chatRpcClient.chatStream(params, signal);
  }

  stop() {
    return chatRpcClient.stopChat();
  }

  loadAndReplayHistory(config: ProviderConfig) {
    return chatRpcClient.loadAndReplayHistory(config);
  }

  // ---- Session CRUD ----

  listSessions() {
    return chatRpcClient.listAllSessions();
  }

  updateSessionTitle(sessionId: string, title: string) {
    return chatRpcClient.updateSessionTitle(sessionId, title);
  }

  deleteSession(sessionId: string) {
    return chatRpcClient.deleteSession(sessionId);
  }

  getSessionMessages(sessionId: string) {
    return chatRpcClient.getSessionMessages(sessionId);
  }

  saveSession(data: {
    sessionId: string;
    title?: string;
    messages?: { role: string; content: string }[];
    model?: string;
    provider?: string;
  }) {
    return chatRpcClient.saveSession(data);
  }
}

export const chatService = new ChatService();
