import { defineStore } from 'pinia';
import { ref } from 'vue';
import localforage from 'localforage';
import { EnumStorageKey } from './constants';
import { ChatConversation } from '@/models/Conversation';
import { chatService } from '@/api';

const storeConversations = localforage.createInstance({
  name: 'code-assist',
  storeName: 'conversations',
  version: 1,
});

export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<ChatConversation[]>([]);
  const conversationId = ref<string>(localStorage.getItem(EnumStorageKey.ConversationId) || '');
  const conversationTitle = ref<string>('');

  const setConversationTitle = (title: string) => {
    conversationTitle.value = title;
  };

  const syncFromAgent = async () => {
    try {
      const sessions = await chatService.listSessions();
      if (sessions.length === 0) return false;

      const convs = sessions.map((s) => {
        const conv = new ChatConversation();
        (conv as any).id = s.id;
        conv.title = s.title || 'New Session';
        return conv;
      });

      conversations.value = convs;
      await storeConversations.setItem('data', JSON.parse(JSON.stringify(convs)));

      if (!conversationId.value || !convs.find((c) => c.id === conversationId.value)) {
        setConversationId(convs[0].id);
      }
      return true;
    } catch {
      return false;
    }
  };

  const getConversations = async (): Promise<ChatConversation[]> => {
    const synced = await syncFromAgent();
    if (synced) return [...conversations.value];

    const res = await storeConversations.getItem('data');
    if (res) {
      conversations.value = res as ChatConversation[];
    }
    if (conversations.value.length === 0) {
      const conv = new ChatConversation();
      setConversationId(conv.id);
      setConversationTitle(conv.title ?? '');
      conversations.value.push(conv);
      setConversations(conversations.value);
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
    if (!id || conversations.value.length <= 1) return false;

    chatService.deleteSession(id).catch(() => {});

    conversations.value = conversations.value.filter((item) => `${item.id}` !== `${id}`);
    return setConversations(conversations.value);
  };

  const getConversationById = async (id: string) => {
    if (!id) return null;
    const convs = await getConversations();
    return convs.find((item) => item.id === id);
  };

  const clearConversations = async () => {
    conversations.value = [];
    return await setConversations([]);
  };

  const resetConversations = async () => {
    const conv = new ChatConversation();
    setConversationId(conv.id);
    setConversationTitle(conv.title ?? '');
    conversations.value = [conv];
    return await setConversations(conversations.value);
  };

  const updateConversationTitle = async (conversationId: string, title: string) => {
    setConversationTitle(title);
    conversations.value.forEach((item) => {
      if (item.id === conversationId) {
        item.title = title;
        item.isSummary = true;
      }
    });

    chatService.updateSessionTitle(conversationId, title).catch(() => {});

    return await setConversations(conversations.value);
  };

  const setConversationId = (id: string) => {
    conversationId.value = id;
    localStorage.setItem(EnumStorageKey.ConversationId, id);
  };

  return {
    conversations,
    conversationId,
    conversationTitle,
    setConversationId,
    setConversationTitle,
    getConversations,
    clearConversations,
    resetConversations,
    createConversation,
    deleteConversation,
    getConversationById,
    updateConversationTitle,
  };
});
