import * as vscode from 'vscode';
import { RpcServer } from 'code-assist-rpc';
import type { RpcServerOptions } from 'code-assist-rpc';
import { IReceiver, ISender } from 'code-assist-shared';

export class VscodeRpcServer extends RpcServer {
  private sender: ISender;
  private receiver: IReceiver;
  private disposables: vscode.Disposable[] = [];

  constructor(sender: ISender, receiver: IReceiver, options: RpcServerOptions = {}) {
    super(options);
    this.sender = sender;
    this.receiver = receiver;
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    const disposable = this.receiver.onDidReceiveMessage?.(async (message: any) => {
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

  log() {}

  dispose(): void {
    super.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
