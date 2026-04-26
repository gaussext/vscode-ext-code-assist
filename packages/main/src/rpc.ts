import * as vscode from 'vscode';
import { EnumRpcMessage } from 'code-assist-rpc';
import { streamMessageHandler, stopChatHandler, modelsHandler, summaryHandler } from './controllers/ChatController';
import { VscodeRpcServer } from './lib/VscodeRpcServer';

export function createRpc(webview: vscode.Webview) {
  const rpcServer = new VscodeRpcServer(webview, webview, { debug: true });
  rpcServer.registerHandler(EnumRpcMessage.Stream, streamMessageHandler);
  rpcServer.registerHandler(EnumRpcMessage.Stop, stopChatHandler);
  rpcServer.registerHandler(EnumRpcMessage.Models, modelsHandler);
  rpcServer.registerHandler(EnumRpcMessage.Summary, summaryHandler);
  return rpcServer;
}
