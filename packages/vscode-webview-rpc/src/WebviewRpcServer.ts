import * as vscode from 'vscode';
import { RpcServer } from './RpcServer';
import type { RpcServerOptions, RpcStreamHandler } from './types';

export class WebviewRpcServer {
  private server: RpcServer;
  private webview: vscode.Webview;
  private disposables: vscode.Disposable[] = [];

  constructor(webview: vscode.Webview, options: RpcServerOptions = {}) {
    this.webview = webview;
    this.server = new RpcServer(options);

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

  registerHandler(namespace: string, handler: RpcStreamHandler): void {
    this.server.registerHandler(namespace, handler);
  }

  unregisterHandler(namespace: string): void {
    this.server.unregisterHandler(namespace);
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
