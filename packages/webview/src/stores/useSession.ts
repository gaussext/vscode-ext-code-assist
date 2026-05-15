import { ref } from 'vue';
import { chatService } from '@/acp';
import { EnumStorageKey } from './constants';

const conversationId = ref<string>(localStorage.getItem(EnumStorageKey.ConversationId) || '');
const conversationTitle = ref<string>('');

function setConversationId(id: string) {
  conversationId.value = id;
  localStorage.setItem(EnumStorageKey.ConversationId, id);
}

function setConversationTitle(title: string) {
  conversationTitle.value = title;
}

/** 用 ACP sessionId 替换当前的本地 conversationId（首次发送消息时调用） */
function linkSessionId(sessionId: string) {
  setConversationId(sessionId);
}

export function useSession() {
  return {
    conversationId,
    conversationTitle,
    setConversationId,
    setConversationTitle,
    linkSessionId,

    async listSessions() {
      return chatService.listSessions();
    },

    async deleteSession(id: string) {
      await chatService.deleteSession(id);
    },

    async updateTitle(sessionId: string, title: string) {
      setConversationTitle(title);
      await chatService.updateSessionTitle(sessionId, title);
    },
  };
}
