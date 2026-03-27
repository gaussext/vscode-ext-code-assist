import { OpenAIService } from '../services';
import { ChatParams } from '../models';

const openaiService = new OpenAIService();

export const streamMessageHandler = async (params: ChatParams, stream: any) => {
  console.log('streamMessageHandler', params)
  await openaiService.chat(params, {
    onChunk: (delta: string) => {
      stream.write({ delta });
    },
    onComplete: () => {
      stream.complete();
    },
    onError: (error: Error) => {
      stream.error(error);
    }
  });
};

export const stopChatHandler = async () => {
  openaiService.stop();
  return { success: true };
};