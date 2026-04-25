import type {
  RpcMessage,
  RpcResponse,
  RpcStreamChunk,
  RpcError,
  RpcComplete,
  RpcClientOptions,
  StreamCallback,
  CompleteCallback,
  ErrorCallback,
} from './types';
import log from 'loglevel';

interface IPromiseChannel {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  onChunk?: StreamCallback<unknown>;
  onComplete?: CompleteCallback;
  onError?: ErrorCallback;
}

export class RpcClient {
  private pendingRequests: Map<string, IPromiseChannel> = new Map();
  private messageId: number = 0;
  private options: RpcClientOptions;

  constructor(options: RpcClientOptions = {}) {
    this.options = { timeout: 30000, debug: false, ...options };
  }

  generateMessageId(): string {
    return `msg_${Date.now()}_${++this.messageId}`;
  }

  sendMessage(message: string): void {
    throw new Error('sendMessage must be implemented by subclass');
  }

  handleMessage(message: string): void {
    try {
      const msg: RpcMessage = JSON.parse(message);
      this.processMessage(msg);
    } catch (error) {
      if (this.options.debug) {
        log.error('RPC Client: Failed to parse message', error);
      }
    }
  }

  private processMessage(msg: RpcMessage): void {
    switch (msg.type) {
      case 'response':
        this.handleResponse(msg as RpcResponse);
        break;
      case 'stream':
        this.handleStreamChunk(msg as RpcStreamChunk);
        break;
      case 'error':
        this.handleError(msg as RpcError);
        break;
      case 'complete':
        this.handleComplete(msg as RpcComplete);
        break;
    }
  }

  private handleResponse(response: RpcResponse): void {
    const pending = this.pendingRequests.get(response.id);
    if (!pending) return;
    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.id);
    pending.resolve(response.data);
  }

  private handleStreamChunk(chunk: RpcStreamChunk): void {
    const pending = this.pendingRequests.get(chunk.id);
    if (!pending) return;

    pending.onChunk?.(chunk.data);

    if (chunk.isLast) {
      this.handleComplete({ id: chunk.id, type: 'complete' });
    }
  }

  private handleError(error: RpcError): void {
    const pendingRequest = this.pendingRequests.get(error.id);
    if (pendingRequest) {
      clearTimeout(pendingRequest.timeout);
      this.pendingRequests.delete(error.id);
      pendingRequest.reject(new Error(error.error.message));
    }

    const pendingStream = this.pendingRequests.get(error.id);
    if (pendingStream) {
      this.pendingRequests.delete(error.id);
      pendingStream.onError?.(new Error(error.error.message));
    }
  }

  private handleComplete(complete: RpcComplete): void {
    const pending = this.pendingRequests.get(complete.id);
    if (!pending) return;

    this.pendingRequests.delete(complete.id);
    pending.onComplete?.();
  }

  /**
   * Call a method on the server.
   * @param path
   * @param params
   * @returns
   */
  async call<TParams = unknown, TResult = unknown>(path: string, params: TParams): Promise<TResult> {
    const id = this.generateMessageId();

    return new Promise<TResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${path}`));
      }, this.options.timeout);

      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout,
      });

      const message = JSON.stringify({
        id,
        type: 'request',
        path,
        data: params,
      });

      this.sendMessage(message);
    });
  }

  /**
   * Call a method on the server that returns a stream of data.
   * @param path
   * @param params
   * @param options
   */
  streamCall<TParams = unknown, TChunk = unknown>(
    path: string,
    params: TParams,
    options: {
      onChunk: StreamCallback<TChunk>;
      onComplete: CompleteCallback;
      onError: ErrorCallback;
    }
  ) {
    const id = this.generateMessageId();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${path}`));
        },
        this.options.timeout ? this.options.timeout * 999 : Infinity
      );

      this.pendingRequests.set(id, {
        resolve,
        reject,
        timeout,
        onChunk: options.onChunk as StreamCallback<unknown>,
        onComplete: options.onComplete,
        onError: options.onError,
      });

      const message = JSON.stringify({
        id,
        type: 'request',
        path,
        data: { ...params, __stream__: true },
      });

      this.sendMessage(message);
    });
  }

  dispose(): void {
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Client disposed'));
    });
    this.pendingRequests.clear();
  }
}
