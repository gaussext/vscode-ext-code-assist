import { OpenAIService } from '../services';
import { IChatParams, IChunk } from '../models';
import log from 'loglevel';
import { IChannel, RpcHandler } from 'code-assist-rpc';

const openaiService = new OpenAIService();

export const streamMessageHandler = async (stream: IChannel<IChunk>, params: IChatParams) => {
  log.info('streamMessageHandler', params);
  await openaiService.chat(params, {
    onChunk: (chunk: IChunk) => {
      stream.write(chunk);
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

export const summaryHandler: RpcHandler<any> = async (params: IChatParams) => {
  return await openaiService.summary(params);
};
