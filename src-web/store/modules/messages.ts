import localforage from "localforage";
import { ChatMessage } from "../../models/Model";

const storeMessages = localforage.createInstance({
    name: 'code-assist',
    storeName: 'messages',
    version: 1
});

export const getMessagesById = (conversationId: string): Promise<ChatMessage[]> => {
    return storeMessages.getItem(conversationId).then(res => {
        if (!res) {
            return Promise.resolve([]);
        }
        return Promise.resolve(res as ChatMessage[]);
    });
};

export const setMessagesById = (conversationId: string, messages: ChatMessage[]) => {
    return storeMessages.setItem(conversationId, messages);
};