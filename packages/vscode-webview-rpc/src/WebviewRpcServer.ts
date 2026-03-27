import * as vscode from 'vscode';
import { RpcServer } from './RpcServer';
import type { RpcHandler, RpcServerOptions, RpcStreamHandler } from './types';

export class WebviewRpcServer {
  private server: RpcServer;
  private webview: vscode.Webview;
  private disposables: vscode.Disposable[] = [];

  constructor(webview: vscode.Webview, options: RpcServerOptions = {}) {
    this.webview = webview;
    this.server = new RpcServer(webview, options);
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    const disposable = this.webview.onDidReceiveMessage((message) => {
      const response = this.server.handleMessage(message);
      if (response) {
        this.webview.postMessage(response);
      }
    });

    this.disposables.push(disposable);
  }

  registerHandler(path: string, handler:  RpcHandler | RpcStreamHandler): void {
    this.server.registerHandler(path, handler);
  }

  unregisterHandler(path: string): void {
    this.server.unregisterHandler(path);
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
