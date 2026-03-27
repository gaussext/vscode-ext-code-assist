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

export class RpcClient {
  private pendingRequests: Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  > = new Map();
  private pendingStreams: Map<
    string,
    {
      onChunk: StreamCallback<unknown>;
      onComplete: CompleteCallback;
      onError: ErrorCallback;
    }
  > = new Map();
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
        console.error('RPC Client: Failed to parse message', error);
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
    const pending = this.pendingStreams.get(chunk.id);
    if (!pending) return;

    pending.onChunk(chunk.data);

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

    const pendingStream = this.pendingStreams.get(error.id);
    if (pendingStream) {
      this.pendingStreams.delete(error.id);
      pendingStream.onError(new Error(error.error.message));
    }
  }

  private handleComplete(complete: RpcComplete): void {
    const pending = this.pendingStreams.get(complete.id);
    if (!pending) return;

    this.pendingStreams.delete(complete.id);
    pending.onComplete();
  }

  async call<TParams = unknown, TResult = unknown>(
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
        timeout 
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

  stream<TParams = unknown, TChunk = unknown>(
    path: string,
    params: TParams,
    options: {
      onChunk: StreamCallback<TChunk>;
      onComplete: CompleteCallback;
      onError: ErrorCallback;
    }
  ): void {
    const id = this.generateMessageId();

    this.pendingStreams.set(id, {
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
  }

  dispose(): void {
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Client disposed'));
    });
    this.pendingRequests.clear();

    this.pendingStreams.forEach((pending) => {
      pending.onError(new Error('Client disposed'));
    });
    this.pendingStreams.clear();
  }
}
