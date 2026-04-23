import { RpcClient } from './RpcClient';
import type { IReceiver, ISender, RpcClientOptions } from './types';

export class WebviewRpcClient extends RpcClient {
  private sender: ISender;
  private receiver: IReceiver;

  constructor(vscode: ISender, receiver: IReceiver, options: RpcClientOptions = {}) {
    super(options);
    this.sender = vscode;
    this.receiver = receiver;
    this.setupMessageListener()
  }

  private setupMessageListener(): void {
    this.receiver.addEventListener?.('message', (event: MessageEvent) => {
      if (event.data) {
        this.handleMessage(event.data);
      }
    });
  }

  sendMessage(message: string): void {
    this.sender.postMessage(message);
  }

  dispose(): void {
    super.dispose();
  }
}
