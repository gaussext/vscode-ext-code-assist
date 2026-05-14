import { defineStore } from 'pinia';
import localforage from 'localforage';
import type { ChatMessage } from '@/models/Message';
import { chatService } from '@/api';

const storeMessages = localforage.createInstance({
  name: 'code-assist',
  storeName: 'messages',
  version: 2,
});

export const useMessageStore = defineStore('message', () => {
  const getMessagesById = async (conversationId: string): Promise<ChatMessage[]> => {
    try {
      const res = await storeMessages.getItem(conversationId);
      return (res as ChatMessage[]) || [];
    } catch {
      return [];
    }
  };

  const setMessagesById = (conversationId: string, messages: ChatMessage[]) => {
    if (!conversationId) return false;

    chatService.saveSession({
      sessionId: conversationId,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      model: messages[messages.length - 1]?.model || '',
      provider: messages[messages.length - 1]?.provider || '',
    }).catch(() => {});

    return storeMessages.setItem(conversationId, JSON.parse(JSON.stringify(messages)));
  };

  const removeMessagesById = (conversationId: string) => {
    chatService.deleteSession(conversationId).catch(() => {});
    return storeMessages.removeItem(conversationId);
  };

  const downloadConversation = async (conversationId: string, conversationTitle: string) => {
    if (!conversationId) return false;
    const messages = await getMessagesById(conversationId);
    if (messages.length === 0) return false;
    const text = messages
      .filter((item) => item.role === 'assistant')
      .map((item) => `${item.content}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversationTitle}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    getMessagesById,
    setMessagesById,
    removeMessagesById,
    downloadConversation,
  };
});
