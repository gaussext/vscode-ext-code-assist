import * as vscode from 'vscode';
import { RpcServer } from 'code-assist-rpc';
import { IReceiver, ISender } from 'code-assist-shared';

export class VscodeRpcServer extends RpcServer {
  private sender: ISender;
  private receiver: IReceiver;
  private disposables: vscode.Disposable[] = [];

  constructor(sender: ISender, receiver: IReceiver) {
    super();
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

  log(...params: any): void {
    console.log('[rpc server]', ...params);
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
