import type { ChatMessage } from "@/models/Model";
import { getTokenCount } from ".";
import { MAX_TOKEN_LENGTH } from "@/stores/constants";

export const getMessageInfoFromMessage = (message: ChatMessage) => {
  const loadDuration = ((message.loadTime - message.startTime || 1000) / 1000).toFixed(2);
  const evalDuration = ((message.endTime - message.loadTime || 1000) / 1000).toFixed(2);
  const totalDuration = ((message.endTime - message.startTime || 1000) / 1000).toFixed(2);
  const content = (message.reasoning ?? '') + (message.content ?? '');
  const tokens = getTokenCount(content);
  const tokensSpeed = (tokens / parseFloat(evalDuration)).toFixed(2);
  const chars = content.length;
  const charsSpeed = (chars / parseFloat(evalDuration)).toFixed(2);
  return {
    loadDuration,
    evalDuration,
    totalDuration,
    tokens,
    tokensSpeed,
    chars,
    charsSpeed,
  };
};

export const getUsageInfoFromMessages = (messages: ChatMessage[]) => {
  const result = {
    temp: 0,
    user: 0,
    assistant: 0,
    upload: 0,
    window: 0,
    width: 0,
  };
  messages?.forEach((message) => {
    const tokens = getTokenCount((message?.reasoning ?? '') + (message?.content ?? ''));
    if (message.role === 'user' || message.role === 'system') {
      result.user = result.user + tokens;
      const upload = result.user + result.assistant;
      result.upload = result.upload + upload;
    } else {
      result.assistant = result.assistant + tokens;
    }
  });
  result.window = result.user + result.assistant;
  result.width = (result.window * 100) / MAX_TOKEN_LENGTH;
  return result;
}