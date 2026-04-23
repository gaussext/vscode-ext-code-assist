import * as vscode from 'vscode';
import { EnumRpcMessage, WebviewRpcServer } from 'vscode-webview-rpc';
import { streamMessageHandler, stopChatHandler, modelsHandler, summaryHandler } from './controllers/ChatController';

export function createRpc(webview: vscode.Webview) {
  const rpcServer = new WebviewRpcServer(webview, webview, { debug: true });
  rpcServer.registerHandler(EnumRpcMessage.Stream, streamMessageHandler);
  rpcServer.registerHandler(EnumRpcMessage.Stop, stopChatHandler);
  rpcServer.registerHandler(EnumRpcMessage.Models, modelsHandler);
  rpcServer.registerHandler(EnumRpcMessage.Summary, summaryHandler);
  return rpcServer;
}
