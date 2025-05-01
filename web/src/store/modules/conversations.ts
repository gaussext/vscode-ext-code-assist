import localforage from "localforage";
import { Conversation } from "../../models/Model";

const storeConversations = localforage.createInstance({
    name: 'code-assist',
    storeName: 'conversations',
    version: 1
});

let conversations: Conversation[] = [];

export const getConversations = (): Promise<Conversation[]> => {
    return storeConversations.getItem('data').then(res => {
        if (res) {
            conversations = res as Conversation[];
        }
        if (conversations.length === 0) {
            conversations.push(new Conversation());
        }
        return Promise.resolve([...conversations]);
    });
};

const setConversations = (conversations: Conversation[]) => {
    return storeConversations.setItem('data', conversations);
};

// 创建会话
export function createConversation() {
    const ids = conversations.map((item) => Number(item.id));
    const nextId = (Math.max(...ids) || 0) + 1;
    const conversationId = `${nextId}`;
    conversations.push({
        id: conversationId,
        title: "新建对话",
    });
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

// 更新会话标题
export function updateConversationTitle(conversationId: string, message: string) {
    conversations.forEach((item) => {
        if (item.id === conversationId) {
            item.title = message.slice(0, 10) + "...";
        }
    });
    return setConversations(conversations);
}