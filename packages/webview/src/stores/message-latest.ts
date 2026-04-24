import { defineStore } from 'pinia';
import { ChatMessage } from '@/models/Model';

export const useMessageLatestStore = defineStore('message-latest', () => {
  const messageMap = new Map<string, ChatMessage>();

  const getLatestMessageByConvId = (convId: string) => {
    let message = messageMap.get(convId);
    if (!message) {
      message = new ChatMessage('assistant', convId);
      messageMap.set(convId, message);
    }
    return message;
  };

  const setLatestMessageByConvId = (convId: string, message: ChatMessage) => {
    return messageMap.set(convId, message);
  };

  const deleteLatestMessageByConvId = (convId: string) => {
    return messageMap.delete(convId);
  };

  return {
    getLatestMessageByConvId,
    setLatestMessageByConvId,
    deleteLatestMessageByConvId,
  };
});
