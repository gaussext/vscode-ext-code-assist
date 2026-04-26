import * as vscode from 'vscode';
import { EnumRpcMessage } from 'code-assist-shared';
import { VscodeRpcServer } from './lib/VscodeRpcServer';
import { OpenAIService } from './services/OpenAIService';

export function createRpc(webview: vscode.Webview) {
  const rpcServer = new VscodeRpcServer(webview, webview, { debug: true });
  const openaiService = new OpenAIService();
  rpcServer.registerHandler(EnumRpcMessage.Models, openaiService.models);
  rpcServer.registerHandler(EnumRpcMessage.Chat, openaiService.chat);
  rpcServer.registerHandler(EnumRpcMessage.ChatStream, openaiService.chatStream);
  rpcServer.registerHandler(EnumRpcMessage.Stop, openaiService.stop);
  return rpcServer;
}