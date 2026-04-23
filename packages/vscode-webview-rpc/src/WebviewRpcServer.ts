import * as vscode from 'vscode';
import { RpcServer } from './RpcServer';
import type { IReceiver, ISender, RpcServerOptions } from './types';

export class WebviewRpcServer extends RpcServer {
  private sender: ISender;
  private receiver: IReceiver;
  private disposables: vscode.Disposable[] = [];

  constructor(sender: ISender, receiver: IReceiver, options: RpcServerOptions = {}) {
    super(options)
    this.sender = sender;
    this.receiver = receiver;
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    const disposable = this.receiver.onDidReceiveMessage?.( async (message:any) => {
      const response = await this.handleMessage(message);
      if (response) {
        this.sender.postMessage(response);
      }
    });
    if (disposable) {
      this.disposables.push(disposable);
    }
  }

  sendMessage(message: string): void {
    this.sender.postMessage(message);
  }

  dispose(): void {
    super.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
