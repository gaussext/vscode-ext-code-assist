import localforage from 'localforage';
import { ChatMessage } from '@/models/Model';
import { getConversationById } from './conversations';

const storeMessages = localforage.createInstance({
  name: 'code-assist',
  storeName: 'messages',
  version: 2,
});

export const getMessagesById = async (conversationId: string): Promise<ChatMessage[]> => {
  try {
    const res = await storeMessages.getItem(conversationId);
    const result = (JSON.parse(res as any) as ChatMessage[]) || [];
    return Promise.resolve(result);
  } catch (error) {
    return Promise.resolve([]);
  }
};

export const setMessagesById = (conversationId: string, messages: ChatMessage[]) => {
  if (!conversationId) {
    return false;
  }
  return storeMessages.setItem(conversationId, JSON.stringify(messages));
};

export const removeMessagesById = (conversationId: string) => {
  return storeMessages.removeItem(conversationId);
};

export const downloadConversation = async (conversationId: string) => {
  if (!conversationId) {
    return false;
  }
  const conversation = getConversationById(conversationId);
  if (!conversation) {
    return false;
  }
  const messages = await getMessagesById(conversationId);
  if (messages.length === 0) {
    return false;
  }
  const text = messages.filter((item) => item.role === 'assistant').map((item) => `${item.content}`).join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${conversation.title}.md`;
  a.click();
  URL.revokeObjectURL(url);
};
