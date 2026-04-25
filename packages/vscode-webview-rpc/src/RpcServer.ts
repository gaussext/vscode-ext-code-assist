import { Webview } from 'vscode';
import log from 'loglevel';
import type {
  RpcMessage,
  RpcRequest,
  RpcResponse,
  RpcStreamChunk,
  RpcError,
  RpcComplete,
  StreamCallback,
  CompleteCallback,
  ErrorCallback,
  RpcServerOptions,
  RpcHandler,
  RpcStreamHandler,
} from './types';

export interface IChannel<T> {
  write: StreamCallback<T>;
  complete: CompleteCallback;
  error: ErrorCallback;
}

export class RpcServer {
  private handlers: Map<string, RpcStreamHandler | RpcHandler> = new Map();
  private pendingRequests: Map<string, IChannel<unknown>> = new Map();
  private options: RpcServerOptions;

  constructor(options: RpcServerOptions = {}) {
    this.options = { debug: false, ...options };
  }

  sendMessage(message: string): void {
    throw new Error('sendMessage must be implemented by subclass');
  }

  registerHandler(path: string, handler: RpcStreamHandler | RpcHandler) {
    log.info('registerHandler', path);
    this.handlers.set(path, handler);
  }

  unregisterHandler(path: string) {
    this.handlers.delete(path);
  }

  handleMessage(message: string): Promise<string | null> {
    try {
      const msg: RpcMessage = JSON.parse(message);
      return this.processMessage(msg);
    } catch (error) {
      if (this.options.debug) {
        log.error('RPC Server: Failed to parse message', error);
      }
      return Promise.resolve(null);
    }
  }

  private processMessage(msg: RpcMessage): Promise<string | null> {
    if (msg.type === 'request') {
      return this.handleRequest(msg as RpcRequest);
    }
    return Promise.resolve(null);
  }

  private handleRequest(request: RpcRequest): Promise<string | null> {
    const { id, path, data } = request;
    log.info('handleRequest', request);
    log.debug('handler');
    const handler = this.handlers.get(path);

    if (!handler) {
      return Promise.resolve(this.createErrorResponse(id, -32601, 'handler not found'));
    }

    if (this.isStreamRequest(data)) {
      const streamHandler = handler as RpcStreamHandler;
      const streamContext: IChannel<unknown> = {
        write: (chunk: unknown) => {
          const message = this.writeStreamChunk(id, chunk, 0, false);
          this.sendMessage(message);
        },
        complete: () => {
          const message = this.completeStream(id);
          this.sendMessage(message);
        },
        error: (err: Error) => {
          const message = this.errorStream(id, err);
          this.sendMessage(message);
        },
      };

      try {
        const result = streamHandler(streamContext, data);
        if (result instanceof Promise) {
          result.catch((err: Error) => {
            const message = this.errorStream(id, err);
            this.sendMessage(message);
          });
        }
      } catch (err) {
        const message = this.errorStream(id, err as Error);
        this.sendMessage(message);
      }
      return Promise.resolve(null);
    }

    return (async () => {
      try {
        const result = await (handler as any)(data);
        const response: RpcResponse = {
          id,
          type: 'response',
          data: result,
        };
        return JSON.stringify(response);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return this.createErrorResponse(id, -32603, errorMessage);
      }
    })();
  }

  private isStreamRequest(params: unknown): boolean {
    return (
      params !== null && typeof params === 'object' && '__stream__' in params && (params as any).__stream__ === true
    );
  }

  createStream(id: string, write: StreamCallback<unknown>, complete: CompleteCallback, error: ErrorCallback) {
    this.pendingRequests.set(id, { write, complete, error });
  }

  writeStreamChunk(id: string, chunk: unknown, chunkIndex: number, isLast: boolean): string {
    const streamChunk: RpcStreamChunk = {
      id,
      type: 'stream',
      data: chunk,
      chunkIndex,
      isLast,
    };
    return JSON.stringify(streamChunk);
  }

  completeStream(id: string): string {
    const complete: RpcComplete = {
      id,
      type: 'complete',
    };
    this.pendingRequests.delete(id);
    return JSON.stringify(complete);
  }

  errorStream(id: string, error: Error): string {
    const errorResponse: RpcError = {
      id,
      type: 'error',
      error: {
        code: -32603,
        message: error.message,
      },
    };
    this.pendingRequests.delete(id);
    return JSON.stringify(errorResponse);
  }

  private createErrorResponse(id: string, code: number, message: string): string {
    const errorResponse: RpcError = {
      id,
      type: 'error',
      error: { code, message },
    };
    return JSON.stringify(errorResponse);
  }

  dispose(): void {
    this.pendingRequests.clear();
  }
}
