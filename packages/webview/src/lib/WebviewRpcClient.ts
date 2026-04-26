import { RpcClient } from 'code-assist-rpc';
import type { IReceiver, ISender } from 'code-assist-shared';

export class WebviewRpcClient extends RpcClient {
  private sender: ISender;
  private receiver: IReceiver;

  constructor(vscode: ISender, receiver: IReceiver) {
    super();
    this.sender = vscode;
    this.receiver = receiver;
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    this.receiver.addEventListener?.('message', (event: MessageEvent) => {
      if (event.data) {
        this.handleMessage(event.data);
      }
    });
  }

  log(...params: any): void {
    console.log('[rpc client]',...params);
  }

  sendMessage(message: string): void {
    this.sender.postMessage(message);
  }

  dispose(): void {
    super.dispose();
  }
}
