import { RpcClient } from './RpcClient';
import type { RpcClientOptions } from './types';

export class WebviewRpcClient extends RpcClient {
  private vscode: any;

  constructor(vscode: any, options: RpcClientOptions = {}) {
    super(options);
    this.vscode = vscode;
  }

  sendMessage(message: string): void {
    this.vscode.postMessage(message);
  }

  setupMessageListener(): void {
    (globalThis as any).addEventListener('message', (event: MessageEvent) => {
      if (event.data) {
        this.handleMessage(event.data);
      }
    });
  }

  dispose(): void {
    super.dispose();
  }
}
