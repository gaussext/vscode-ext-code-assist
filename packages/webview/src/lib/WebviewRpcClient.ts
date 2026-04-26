import { RpcClient } from 'code-assist-rpc';
import type { IReceiver, ISender, RpcClientOptions } from 'code-assist-rpc';

export class WebviewRpcClient extends RpcClient {
  private sender: ISender;
  private receiver: IReceiver;

  constructor(vscode: ISender, receiver: IReceiver, options: RpcClientOptions = {}) {
    super(options);
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

  log(): void {}

  sendMessage(message: string): void {
    this.sender.postMessage(message);
  }

  dispose(): void {
    super.dispose();
  }
}
