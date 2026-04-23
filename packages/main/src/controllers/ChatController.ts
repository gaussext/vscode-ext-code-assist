import { OpenAIService } from '../services';
import { IChatParams } from '../models';
import log from 'loglevel';
import { RpcHandler } from 'vscode-webview-rpc';

const openaiService = new OpenAIService();

export const streamMessageHandler = async (params: IChatParams, stream: any) => {
  log.info('streamMessageHandler', params);
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

export const modelsHandler: RpcHandler<any> = async (params: IChatParams) => {
  return await openaiService.models(params);
};
