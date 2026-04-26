import type { RpcClientOptions, JsonRpcRequest, JsonRpcResponse } from './types';

interface IPromiseChannel {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
  streamController?: ReadableStreamDefaultController<unknown>;
}

const JSONRPC_VERSION = '2.0';

const enum RpcInternalType {
  Stream = '__stream__',
  Complete = '__complete__',
  Error = '__error__',
  Cancel = '__cancel__',
}

export abstract class RpcClient {
  private pendingRequests: Map<string, IPromiseChannel> = new Map();
  private messageId: number = 0;
  private options: RpcClientOptions;

  constructor(options: RpcClientOptions = {}) {
    this.options = {
      timeout: 30 * 1000,
      streamTimeout: 10 * 60 * 1000,
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
    this.log('info', 'Received message', message);
    try {
      const msg = JSON.parse(message);
      if (this.isJsonRpcResponse(msg)) {
        this.processJsonRpcResponse(msg);
      } else if (this.isInternalMessage(msg)) {
        this.processInternalMessage(msg);
      }
    } catch (error) {
      this.log('error', 'RPC Client: Failed to parse message', error);
    }
  }

  private isJsonRpcResponse(msg: unknown): msg is JsonRpcResponse {
    return typeof msg === 'object' && msg !== null && (msg as any).jsonrpc === JSONRPC_VERSION && 'id' in msg;
  }

  private isInternalMessage(msg: unknown): boolean {
    const type = (msg as Record<string, string>)?.__type__;
    return type === RpcInternalType.Stream || type === RpcInternalType.Complete || type === RpcInternalType.Error;
  }

  private processJsonRpcResponse(msg: JsonRpcResponse): void {
    const pending = this.pendingRequests.get(msg.id);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(msg.id);

    if (msg.error) {
      pending.reject(new Error(msg.error.message));
      return;
    }

    pending.resolve(msg.result);
  }

  private processInternalMessage(msg: any): void {
    const id = msg.id;
    const pending = this.pendingRequests.get(id);
    if (!pending) return;

    if (msg.__type__ === RpcInternalType.Stream) {
      pending.streamController?.enqueue(msg.data);
    } else if (msg.__type__ === RpcInternalType.Complete) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(id);
      pending.streamController?.close();
    } else if (msg.__type__ === RpcInternalType.Error) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(id);
      pending.streamController?.error(new Error(msg.error.message));
    }
  }

  private sendCancelMessage(id: string): void {
    const cancelMsg = { id, __type__: RpcInternalType.Cancel };
    this.sendMessage(JSON.stringify(cancelMsg));
  }

  call<TParams = unknown, TResult = unknown>(method: string, params: TParams, stream?: false, signal?: AbortSignal): Promise<TResult>;
  call<TParams = unknown, TChunk = unknown>(method: string, params: TParams, stream: true, signal?: AbortSignal): ReadableStream<TChunk>;
  call<TParams = unknown, TResult = unknown>(
    method: string,
    params: TParams,
    stream?: boolean,
    signal?: AbortSignal
  ): Promise<TResult> | ReadableStream<TResult> {
    const id = this.generateMessageId();

    if (stream) {
      return new ReadableStream<TResult>({
        start: (controller) => {
          if (signal?.aborted) {
            controller.error(new DOMException('Aborted', 'AbortError'));
            return;
          }

          const timeout = setTimeout(() => {
            this.pendingRequests.delete(id);
            controller.error(new Error(`Request timeout: ${method}`));
          }, this.options.streamTimeout);

          this.pendingRequests.set(id, {
            resolve: () => {},
            reject: (error) => controller.error(error),
            timeout,
            streamController: controller as ReadableStreamDefaultController<unknown>,
          });

          const request: JsonRpcRequest & { __stream__: boolean } = {
            jsonrpc: JSONRPC_VERSION,
            method,
            params,
            id,
            __stream__: true,
          };

          this.sendMessage(JSON.stringify(request));

          if (signal) {
            signal.addEventListener('abort', () => {
              const pending = this.pendingRequests.get(id);
              if (pending) {
                clearTimeout(pending.timeout);
                this.pendingRequests.delete(id);
                controller.close();
                controller.error(new DOMException('Aborted', 'AbortError'));
                this.sendCancelMessage(id);
              }
            }, { once: true });
          }
        },
        cancel: () => {
          this.pendingRequests.delete(id);
          this.sendCancelMessage(id);
        },
      });
    }

    return new Promise<TResult>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }

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

      if (signal) {
        signal.addEventListener('abort', () => {
          const pending = this.pendingRequests.get(id);
          if (pending) {
            clearTimeout(pending.timeout);
            this.pendingRequests.delete(id);
            reject(new DOMException('Aborted', 'AbortError'));
            this.sendCancelMessage(id);
          }
        }, { once: true });
      }
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
