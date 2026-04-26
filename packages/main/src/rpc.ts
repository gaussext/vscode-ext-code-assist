import * as vscode from 'vscode';
import { EnumRpcMessage } from 'code-assist-shared';
import { VscodeRpcServer } from './lib/VscodeRpcServer';
import { OpenAIService } from './services/OpenAIService';

export function createRpc(webview: vscode.Webview) {
  const rpcServer = new VscodeRpcServer(webview, webview);
  const openaiService = new OpenAIService();
  rpcServer.registerHandler(EnumRpcMessage.Models, openaiService.models.bind(openaiService));
  rpcServer.registerHandler(EnumRpcMessage.Chat, openaiService.chat.bind(openaiService));
  rpcServer.registerHandler(EnumRpcMessage.ChatStream, openaiService.chatStream.bind(openaiService));
  rpcServer.registerHandler(EnumRpcMessage.Stop, openaiService.stop.bind(openaiService));
  return rpcServer;
}