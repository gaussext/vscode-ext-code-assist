import localforage from "localforage";
import { ChatMessage } from "../../models/Model";

const storeMessages = localforage.createInstance({
    name: 'code-assist',
    storeName: 'messages',
    version: 2
});

export const getMessagesById = async (conversationId: string): Promise<ChatMessage[]> => {
    try {
        const res = await storeMessages.getItem(conversationId)
        const result = JSON.parse(res as any) as ChatMessage[] || []
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