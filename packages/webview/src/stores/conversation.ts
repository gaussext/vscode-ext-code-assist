import { defineStore } from 'pinia';
import { ref } from 'vue';
import localforage from 'localforage';
import { ChatConversation } from '@/models/Model';
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
      const conv = new ChatConversation()
      setConversationId(conv.id)
      conversations.value.push(conv);
      setConversations(conversations.value)
    }
    return [...conversations.value];
  };

  const setConversations = (convs: ChatConversation[]) => {
    return storeConversations.setItem('data', JSON.parse(JSON.stringify(convs)));
  };

  const createConversation = async () => {
    const conversation = new ChatConversation();
    conversations.value.push(conversation);
    await setConversations(conversations.value);
    return conversation;
  };

  const deleteConversation = async (id: string) => {
    if (!id) {
      return false
    }
    if (conversations.value.length <= 1) {
      return false
    }
    conversations.value = conversations.value.filter((item) => `${item.id}` !== `${id}`);
    return setConversations(conversations.value);
  };

  const getConversationById = async (id: string) => {
    if (!id) {
      return null;
    }
    const convs = await getConversations();
    return convs.find((item) => item.id === id);
  };

  const clearConversations = () => {
    conversations.value = [];
    return setConversations([]);
  };

  const updateConversationTitle = (conversationId: string, title: string) => {
    conversations.value.forEach((item) => {
      if (item.id === conversationId) {
        item.title = title;
        item.isSummary = true;
      }
    });
    return setConversations(conversations.value);
  };

  const setConversationId = (id: string) => {
    conversationId.value = id;
    localStorage.setItem(EnumStorageKey.ConversationId, id);
  };

  return {
    conversationId,
    conversations,
    // 
    setConversationId,
    // 
    getConversations,
    clearConversations,
    // 
    createConversation,
    deleteConversation,
    getConversationById,
    updateConversationTitle,
  };
});
