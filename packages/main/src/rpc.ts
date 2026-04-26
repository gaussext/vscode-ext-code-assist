import * as vscode from 'vscode';
import { EnumRpcMessage } from 'code-assist-shared';
import { chatStreamHandler, stopChatHandler, modelsHandler, chatHandler } from './controllers/ChatController';
import { VscodeRpcServer } from './lib/VscodeRpcServer';
import { OpenAIService } from './services';

export function createRpc(webview: vscode.Webview) {
  const openaiService = new OpenAIService();

  const rpcServer = new VscodeRpcServer(webview, webview, { debug: true });
  rpcServer.registerHandler(EnumRpcMessage.Models, openaiService.models);
  rpcServer.registerHandler(EnumRpcMessage.Chat, openaiService.chat);
  rpcServer.registerHandler(EnumRpcMessage.ChatStream, openaiService.chatStream);
  rpcServer.registerHandler(EnumRpcMessage.Stop, openaiService.stop);
  return rpcServer;
}