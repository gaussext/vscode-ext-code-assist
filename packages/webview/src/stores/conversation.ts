import { defineStore } from 'pinia';
import { ref, unref } from 'vue';
import localforage from 'localforage';
import { ChatConversation } from '@/models/Model';
import { firstElement } from '@/utils';
import { EnumStorageKey } from './constants';

const storeConversations = localforage.createInstance({
  name: 'code-assist',
  storeName: 'conversations',
  version: 1,
});

export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<ChatConversation[]>([]);
  const conversationId = ref<string>(localStorage.getItem(EnumStorageKey.ConversationId) || '');

  const getConversations = async (): Promise<ChatConversation[]> => {
    const res = await storeConversations.getItem('data');
    if (res) {
      conversations.value = res as ChatConversation[];
    }
    if (conversations.value.length === 0) {
      conversations.value.push(new ChatConversation());
    }
    if (!conversationId.value && firstElement(conversations.value).id) {
      conversationId.value = firstElement(conversations.value).id;
    }
    return [...conversations.value];
  };

  const setConversations = (convs: ChatConversation[]) => {
    return storeConversations.setItem('data', JSON.parse(JSON.stringify(convs)));
  };

  const createConversation = async () => {
    const ids = conversations.value.map((item) => Number(item.id));
    const nextId = (Math.max(...ids) || 0) + 1;
    const conversationId = `${nextId}`;
    const conversation = new ChatConversation();
    conversation.id = conversationId;
    conversations.value.push(conversation);
    return setConversations(conversations.value);
  };

  const deleteConversation = async (id: string) => {
    if (!id) {
      return [...conversations.value];
    }
    if (conversations.value.length <= 1) {
      return [...conversations.value];
    }
    conversations.value = conversations.value.filter((item) => `${item.id}` !== `${id}`);
    return setConversations(conversations.value);
  };

  const getConversationById = (id: string) => {
    if (!id) {
      return null;
    }
    return conversations.value.find((item) => item.id === id);
  };

  const clearConversation = async () => {
    conversations.value = [];
    return setConversations([]);
  };

  const updateConversationTitle = async (conversationId: string, message: string) => {
    conversations.value.forEach((item) => {
      if (item.id === conversationId) {
        item.title = message.slice(0, 50) + '...';
      }
    });
    return setConversations(conversations.value);
  };

  const setCurrentConversationId = (id: string) => {
    conversationId.value = id;
  };

  return {
    conversationId,
    conversations,
    getConversations,
    createConversation,
    deleteConversation,
    getConversationById,
    clearConversation,
    updateConversationTitle,
    setCurrentConversationId,
  };
});
