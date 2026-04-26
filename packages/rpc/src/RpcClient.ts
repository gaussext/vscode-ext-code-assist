import type {
  RpcClientOptions,
  StreamCallback,
  CompleteCallback,
  ErrorCallback,
  JsonRpcRequest,
  JsonRpcResponse,
} from './types';

interface IPromiseChannel {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
  onChunk?: StreamCallback<unknown>;
  onComplete?: CompleteCallback;
  onError?: ErrorCallback;
}

const JSONRPC_VERSION = "2.0";

const enum RpcInternalType {
  Stream = '__stream__',
  Complete = '__complete__',
  Error = '__error__',
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

  protected abstract log(level: string, message: string, ...args: unknown[]): void;

  handleMessage(message: string): void {
    try {
      const msg = JSON.parse(message);
      if (this.isJsonRpcResponse(msg)) {
        this.processJsonRpcResponse(msg);
      } else if (this.isInternalMessage(msg)) {
        this.processInternalMessage(msg);
      }
    } catch (error) {
      if (this.options.debug) {
        this.log('error', 'RPC Client: Failed to parse message', error);
      }
    }
  }

  private isJsonRpcResponse(msg: unknown): msg is JsonRpcResponse {
    return (
      typeof msg === 'object' &&
      msg !== null &&
      (msg as any).jsonrpc === JSONRPC_VERSION &&
      'id' in msg
    );
  }

  private isInternalMessage(msg: unknown): boolean {
    const type = (msg as any).__type__;
    return (
      type === RpcInternalType.Stream ||
      type === RpcInternalType.Complete ||
      type === RpcInternalType.Error
    );
  }

  private processJsonRpcResponse(msg: JsonRpcResponse): void {
    const pending = this.pendingRequests.get(msg.id);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(msg.id);

    if (msg.error) {
      if (pending.onError) {
        pending.onError(new Error(msg.error.message));
      } else {
        pending.reject(new Error(msg.error.message));
      }
      return;
    }

    pending.resolve(msg.result);
  }

  private processInternalMessage(msg: any): void {
    const id = msg.id;
    const pending = this.pendingRequests.get(id);
    if (!pending) return;

    if (msg.__type__ === RpcInternalType.Stream) {
      pending.onChunk?.(msg.data);
    } else if (msg.__type__ === RpcInternalType.Complete) {
      this.pendingRequests.delete(id);
      pending.onComplete?.();
      pending.resolve(undefined);
    } else if (msg.__type__ === RpcInternalType.Error) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(id);
      if (pending.onError) {
        pending.onError(new Error(msg.error.message));
      } else {
        pending.reject(new Error(msg.error.message));
      }
    }
  }

  call<TParams = unknown, TResult = unknown>(
    method: string,
    params: TParams
  ): Promise<TResult> {
    const id = this.generateMessageId();

    return new Promise<TResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, this.options.timeout);

      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout,
      });

      const request: JsonRpcRequest = {
        jsonrpc: JSONRPC_VERSION,
        method,
        params,
        id,
      };

      this.sendMessage(JSON.stringify(request));
    });
  }

  streamCall<TParams = unknown, TChunk = unknown>(
    method: string,
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
          reject(new Error(`Request timeout: ${method}`));
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

      const request: JsonRpcRequest & { __stream__: boolean } = {
        jsonrpc: JSONRPC_VERSION,
        method,
        params,
        id,
        __stream__: true,
      };

      this.sendMessage(JSON.stringify(request));
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