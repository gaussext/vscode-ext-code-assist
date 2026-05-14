import type { IProviderParams } from './types';
import { chatRpcClient, type ProviderConfig } from './rpc';

export type { ProviderConfig };

class ChatService {
  models(params: IProviderParams) {
    return chatRpcClient.models(params);
  }

  chatRaw(params: {
    baseURL: string;
    apiKey: string;
    model: string;
    messages: { role: string; content: string }[];
  }) {
    return chatRpcClient.chatRaw(params);
  }

  /** 发送提示词，onChunk 回调接收流式内容 */
  sendPrompt(
    sessionId: string,
    text: string,
    onChunk?: (chunk: string) => void,
    signal?: AbortSignal,
  ) {
    return chatRpcClient.sendPrompt(sessionId, text, onChunk, signal);
  }

  stop(sessionId?: string) {
    return chatRpcClient.stopChat(sessionId);
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
  }) {
    return chatRpcClient.saveSession(data);
  }

  summarizeSession(sessionId: string, baseURL: string, apiKey: string, model: string) {
    return chatRpcClient.summarizeSession(sessionId, baseURL, apiKey, model);
  }
}

export const chatService = new ChatService();
