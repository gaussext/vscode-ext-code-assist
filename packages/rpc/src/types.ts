export interface JsonRpcRequest<T = unknown> {
  id: string;
  jsonrpc: '2.0';
  method: string;
  params?: T;
  __stream__?: boolean;
}

export interface JsonRpcResponse<T = unknown> {
  id: string;
  jsonrpc: '2.0';
  __type__?: string;
  data?: T;
  result?: T;
  error?: JsonRpcError;
}

export interface JsonRpcInternal<T = unknown> {
  id: string;
  __type__?: string;
  data?: T;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface RpcClientOptions {
  timeout?: number;
  streamTimeout?: number;
}

export interface RpcHandler {
  (params?: any): Promise<ReadableStream<unknown>> | Promise<unknown>;
}
