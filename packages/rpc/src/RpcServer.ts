import type {
  RpcServerOptions,
  RpcHandler,
  RpcStreamHandler,
  JsonRpcRequest,
  JsonRpcResponse,
  IChannel,
} from './types';

const JSONRPC_VERSION = "2.0";

const enum RpcInternalType {
  Stream = '__stream__',
  Complete = '__complete__',
  Error = '__error__',
}

export abstract class RpcServer {
  private handlers: Map<string, RpcStreamHandler | RpcHandler> = new Map();
  private pendingRequests: Map<string, IChannel<unknown>> = new Map();
  private options: RpcServerOptions;

  constructor(options: RpcServerOptions = {}) {
    this.options = { debug: false, ...options };
  }

  abstract sendMessage(message: string): void;

  abstract log(level: string, ...args: unknown[]): void;

  registerHandler(method: string, handler: RpcStreamHandler | RpcHandler) {
    this.log('info', 'registerHandler', method);
    this.handlers.set(method, handler);
  }

  unregisterHandler(method: string) {
    this.handlers.delete(method);
  }

  handleMessage(message: string): Promise<string | null> {
    try {
      const msg = JSON.parse(message);
      return this.handleJsonRpcRequest(msg);
    } catch (error) {
      if (this.options.debug) {
        this.log('error', 'RPC Server: Failed to parse message', error);
      }
      return Promise.resolve(null);
    }
  }

  private isJsonRpcRequest(msg: unknown): msg is JsonRpcRequest {
    return (
      typeof msg === 'object' &&
      msg !== null &&
      (msg as any).jsonrpc === JSONRPC_VERSION &&
      'method' in msg &&
      'id' in msg
    );
  }

  private handleJsonRpcRequest(msg: unknown): Promise<string | null> {
    if (!this.isJsonRpcRequest(msg)) {
      return Promise.resolve(null);
    }

    const { method, params, id, __stream__ } = msg;
    this.log('info', 'handleJsonRpcRequest', msg);

    const handler = this.handlers.get(method);
    if (!handler) {
      return Promise.resolve(
        this.createJsonRpcErrorResponse(id, -32601, 'Method not found')
      );
    }

    if (__stream__) {
      return this.handleStreamRequest(id, handler, params);
    }

    return (async () => {
      try {
        const result = await (handler as any)(params);
        const response: JsonRpcResponse = {
          jsonrpc: JSONRPC_VERSION,
          result,
          id,
        };
        return JSON.stringify(response);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return this.createJsonRpcErrorResponse(id, -32603, errorMessage);
      }
    })();
  }

  private handleStreamRequest(
    id: string,
    handler: RpcStreamHandler | RpcHandler,
    params: unknown
  ): Promise<string | null> {
    const streamHandler = handler as RpcStreamHandler;
    const streamContext: IChannel<unknown> = {
      write: (chunk: unknown) => {
        const message = this.writeStreamChunk(id, chunk);
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
      const result = streamHandler(streamContext, params);
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

  writeStreamChunk(id: string, chunk: unknown): string {
    const streamChunk = {
      id,
      __type__: RpcInternalType.Stream,
      data: chunk,
    };
    return JSON.stringify(streamChunk);
  }

  completeStream(id: string): string {
    const complete = {
      id,
      __type__: RpcInternalType.Complete,
    };
    this.pendingRequests.delete(id);
    return JSON.stringify(complete);
  }

  errorStream(id: string, error: Error): string {
    const errorResponse = {
      id,
      __type__: RpcInternalType.Error,
      error: {
        code: -32603,
        message: error.message,
      },
    };
    this.pendingRequests.delete(id);
    return JSON.stringify(errorResponse);
  }

  private createJsonRpcErrorResponse(id: string, code: number, message: string): string {
    const response: JsonRpcResponse = {
      jsonrpc: JSONRPC_VERSION,
      error: { code, message },
      id,
    };
    return JSON.stringify(response);
  }

  dispose(): void {
    this.pendingRequests.clear();
  }
}