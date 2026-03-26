import * as vscode from 'vscode';
import { type RpcStreamHandler, type RpcHandler } from 'vscode-webview-rpc';
import { OpenAIService } from '../services';
import { ChatParams } from '../models';

const config = vscode.workspace.getConfiguration('code-assist');
const openaiService = new OpenAIService(
  () => config.get('deepseek_token', ''),
  () => config.get('deepseek', '')
);

export const streamMessageHandler: RpcStreamHandler<ChatParams, any> = async (params: ChatParams, stream: any) => {
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

export const stopChatHandler: RpcHandler = async () => {
  openaiService.stop();
  return { success: true };
};