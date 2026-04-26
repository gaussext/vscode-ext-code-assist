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

interface IPromiseChannel {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  onChunk?: StreamCallback<unknown>;
  onComplete?: CompleteCallback;
  onError?: ErrorCallback;
}

export abstract class RpcClient {
  private pendingRequests: Map<string, IPromiseChannel> = new Map();
  private messageId: number = 0;
  private options: RpcClientOptions;

  constructor(options: RpcClientOptions = {}) {
    this.options = {
      timeout: 30 * 1000,
      streamTimeout: 10 * 60 * 1000,
      debug: false,
      ...options,
    };
  }

  generateMessageId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    } else {
      return `msg-${Date.now()}-${this.messageId++}`;
    }
  }

  protected abstract sendMessage(message: string): void;

  /**
   * 抽象日志方法，子类需实现具体的日志记录逻辑
   * @param level 日志级别（如 'error', 'warn', 'info', 'debug'）
   * @param message 日志信息
   * @param args 附加参数
   */
  protected abstract log(level: string, message: string, ...args: unknown[]): void;

  handleMessage(message: string): void {
    try {
      const msg: RpcMessage = JSON.parse(message);
      this.processMessage(msg);
    } catch (error) {
      if (this.options.debug) {
        this.log('error', 'RPC Client: Failed to parse message', error);
      }
      this.handleError({
        id: 'unknown',
        type: 'error',
        error: { code: 400, message: 'Invalid message format' },
      });
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
    const pending = this.pendingRequests.get(error.id);
    if (!pending) return;
    clearTimeout(pending.timeout);
    this.pendingRequests.delete(error.id);
    if (pending.onError) {
      pending.onError(new Error(error.error.message));
    } else {
      pending.reject(new Error(error.error.message));
    }
  }

  private handleComplete(complete: RpcComplete): void {
    const pending = this.pendingRequests.get(complete.id);
    if (!pending) return;

    this.pendingRequests.delete(complete.id);
    pending.onComplete?.();
    pending.resolve(undefined);
  }

  /**
   * Call a method on the server.
   * @param path
   * @param params
   * @returns
   */
  call<TParams = unknown, TResult = unknown>(
    path: string,
    params: TParams
  ): Promise<TResult> {
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
        this.options.streamTimeout ? this.options.streamTimeout : Infinity
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