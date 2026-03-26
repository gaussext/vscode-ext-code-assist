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
  RpcHandlers,
  RpcServerOptions,
} from './types';

export class RpcServer {
  private handlers: Map<string, RpcHandlers> = new Map();
  private pendingStreams: Map<string, { write: StreamCallback<unknown>; complete: CompleteCallback; error: ErrorCallback }> = new Map();
  private options: RpcServerOptions;
  private webview: any;

  constructor(webview: any, options: RpcServerOptions = {}) {
    this.webview = webview;
    this.options = { debug: false, ...options };
  }

  registerHandlers(namespace: string, handlers: RpcHandlers) {
    this.handlers.set(namespace, handlers);
  }

  unregisterHandlers(namespace: string) {
    this.handlers.delete(namespace);
  }

  handleMessage(message: string): Promise<string | null> {
    try {
      const msg: RpcMessage = JSON.parse(message);
      return this.processMessage(msg);
    } catch (error) {
      if (this.options.debug) {
        console.error('RPC Server: Failed to parse message', error);
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
    const { id, method, data } = request;
    const [namespace, methodName] = method.split('.');

    if (!namespace || !methodName) {
      return Promise.resolve(this.createErrorResponse(id, -32601, 'Method not found'));
    }

    const handlers = this.handlers.get(namespace);
    if (!handlers) {
      return Promise.resolve(this.createErrorResponse(id, -32601, 'Namespace not found'));
    }

    const handler = handlers[methodName];
    if (!handler) {
      return Promise.resolve(this.createErrorResponse(id, -32601, 'Method not found'));
    }

    if (this.isStreamRequest(data)) {
      const streamHandler = handler as any;
      const streamContext = {
        write: (chunk: unknown) => {
          const message = this.writeStreamChunk(id, chunk, 0, false);
          this.webview?.postMessage(message);
        },
        complete: () => {
          const message = this.completeStream(id);
          this.webview?.postMessage(message);
        },
        error: (err: Error) => {
          const message = this.errorStream(id, err);
          this.webview?.postMessage(message);
        }
      };
      
      try {
        const result = streamHandler(data, streamContext);
        if (result instanceof Promise) {
          result.catch((err: Error) => {
            const message = this.errorStream(id, err);
            this.webview?.postMessage(message);
          });
        }
      } catch (err) {
        const message = this.errorStream(id, err as Error);
        this.webview?.postMessage(message);
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
    return params !== null && typeof params === 'object' && '__stream__' in params && (params as any).__stream__ === true;
  }

  createStream(id: string, write: StreamCallback<unknown>, complete: CompleteCallback, error: ErrorCallback) {
    this.pendingStreams.set(id, { write, complete, error });
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
    this.pendingStreams.delete(id);
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
    this.pendingStreams.delete(id);
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
}
