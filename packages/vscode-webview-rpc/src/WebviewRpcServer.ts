import * as vscode from 'vscode';
import { RpcServer } from './RpcServer';
import type { RpcHandlers, RpcServerOptions } from './types';

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

  registerHandlers(namespace: string, handlers: RpcHandlers): void {
    this.server.registerHandlers(namespace, handlers);
  }

  unregisterHandlers(namespace: string): void {
    this.server.unregisterHandlers(namespace);
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
