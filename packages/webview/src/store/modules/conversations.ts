import localforage from 'localforage';
import { ChatConversation } from '@/models/Model';

const storeConversations = localforage.createInstance({
  name: 'code-assist',
  storeName: 'conversations',
  version: 1,
});

let conversations: ChatConversation[] = [];

export const getConversations = (): Promise<ChatConversation[]> => {
  return storeConversations.getItem('data').then((res) => {
    if (res) {
      conversations = res as ChatConversation[];
    }
    if (conversations.length === 0) {
      conversations.push(new ChatConversation());
    }
    return Promise.resolve([...conversations]);
  });
};

const setConversations = (conversations: ChatConversation[]) => {
  return storeConversations.setItem('data', conversations);
};

// 创建会话
export function createConversation() {
  const ids = conversations.map((item) => Number(item.id));
  const nextId = (Math.max(...ids) || 0) + 1;
  const conversationId = `${nextId}`;
  const conversation = new ChatConversation();
  conversation.id = conversationId;
  conversations.push(conversation);
  return setConversations(conversations);
}

// 删除会话
export function deleteConversation(id: string) {
  if (!id) {
    return [...conversations];
  }
  if (conversations.length <= 1) {
    return [...conversations];
  }
  conversations = conversations.filter((item) => `${item.id}` !== `${id}`);
  return setConversations(conversations);
}

export function getConversationById(id: string) {
  if (!id) {
    return null;
  }
  return conversations.find((item) => item.id === id);
}

/**
 * 清空会话列表
 * @returns
 */
export function clearConversation() {
  return setConversations([]);
}

// 更新会话标题
export function updateConversationTitle(conversationId: string, message: string) {
  conversations.forEach((item) => {
    if (item.id === conversationId) {
      item.title = message.slice(0, 50) + '...';
    }
  });
  return setConversations(conversations);
}
