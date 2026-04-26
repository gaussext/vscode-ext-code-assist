import type { RpcHandler, JsonRpcRequest, JsonRpcResponse, JsonRpcInternal } from './types';

const JSONRPC_VERSION = '2.0';

const enum RpcInternalType {
  Stream = '__stream__',
  Complete = '__complete__',
  Error = '__error__',
}

export abstract class RpcServer {
  private handlers: Map<string, RpcHandler> = new Map();

  abstract sendMessage(message: string): void;

  abstract log(level: string, ...args: unknown[]): void;

  registerHandler(method: string, handler: RpcHandler) {
    this.log('info', 'registerHandler', method);
    this.handlers.set(method, handler);
  }

  unregisterHandler(method: string) {
    this.handlers.delete(method);
  }

  async handleMessage(message: string): Promise<string | null> {
    try {
      const params = JSON.parse(message);
      const resp = await this.handleJsonRpcRequest(params);
      return JSON.stringify(resp);
    } catch (error) {
      this.log('error', 'RPC Server: Failed to parse message', error);
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

  private handleJsonRpcRequest(msg: unknown): Promise<JsonRpcResponse | null> {
    if (!this.isJsonRpcRequest(msg)) {
      return Promise.resolve(null);
    }

    const { method, params, id, __stream__ } = msg;
    this.log('info', 'handleJsonRpcRequest', msg);

    const handler = this.handlers.get(method);

    if (!handler) {
      return Promise.resolve(this.createJsonRpcErrorResponse(id, -32601, 'Method not found'));
    }

    if (__stream__) {
      return this.handleStreamRequest(id, handler, params);
    } else {
      return this.handleNormalRequest(id, handler, params);
    }
  }

  private async handleNormalRequest(id: string, handler: RpcHandler, params: unknown): Promise<JsonRpcResponse | null> {
    try {
      const result = await handler(params);
      this.log('info', 'handleJsonRpcRequest result', result);
      return {
        jsonrpc: JSONRPC_VERSION,
        result,
        id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createJsonRpcErrorResponse(id, -32603, errorMessage);
    }
  }

  private async handleStreamRequest(id: string, handler: RpcHandler, params: unknown): Promise<JsonRpcResponse | null> {
    try {
      let stream = await handler(params);
      this.log('info', 'handleStreamRequest stream created', stream);
      if (stream instanceof ReadableStream) {
        const reader = (stream as ReadableStream).getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            this.log('info', 'Stream end', value);
            const completeMessage = this.completeStream(id);
            this.sendMessage(JSON.stringify(completeMessage));
            break;
          }
          this.log('info', 'Stream chunk', value);
          const message = this.writeStreamChunk(id, value);
          this.sendMessage(JSON.stringify(message));
        }
      } else {
        this.log('error', 'Stream does not have getReader method');
      }
    } catch (err) {
      this.log('error', 'Stream request error', err);
      const message = this.errorStream(id, err as Error);
      this.sendMessage(JSON.stringify(message));
    }
    return Promise.resolve(null);
  }

  writeStreamChunk(id: string, chunk: unknown): JsonRpcInternal {
    return {
      id,
      __type__: RpcInternalType.Stream,
      data: chunk,
    };
  }

  completeStream(id: string): JsonRpcInternal {
    return {
      id,
      __type__: RpcInternalType.Complete,
    };
  }

  errorStream(id: string, error: Error): JsonRpcInternal {
    return {
      id,
      __type__: RpcInternalType.Error,
      error: {
        code: -32603,
        message: error.message,
      },
    };
  }

  private createJsonRpcErrorResponse(id: string, code: number, message: string): JsonRpcResponse {
    return {
      jsonrpc: JSONRPC_VERSION,
      error: { code, message },
      id,
    };
  }
}
