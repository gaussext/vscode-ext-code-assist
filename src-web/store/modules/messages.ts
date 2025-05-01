import localforage from "localforage";
import { ChatMessage } from "../../models/Model";

const storeMessages = localforage.createInstance({
    name: 'code-assist',
    storeName: 'messages',
    version: 1
});

export const getMessagesById = (conversationId: string): Promise<ChatMessage[]> => {
    return storeMessages.getItem(conversationId).then(res => {
        return Promise.resolve(res as ChatMessage[] || []);
    });
};

export const setMessagesById = (conversationId: string, messages: ChatMessage[]) => {
    console.log('[Webview][setMessagesById]', conversationId);
    if (!conversationId) {
        return false;
    }
    return storeMessages.setItem(conversationId, messages);
};

export const removeMessagesById = (conversationId: string) => {
    return storeMessages.removeItem(conversationId);
};