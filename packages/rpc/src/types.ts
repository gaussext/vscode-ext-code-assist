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

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface RpcClientOptions {
  timeout?: number;
  streamTimeout?: number;
  debug?: boolean;
}

export interface RpcServerOptions {
  debug?: boolean;
}

export interface RpcHandler<TParams = any, TResult = any> {
  (params?: TParams): Promise<TResult> | TResult | void;
}

export interface RpcStreamHandler<TParams = any, TChunk = any> {
  (params?: TParams): Promise<ReadableStream<TChunk>> | ReadableStream<TChunk> | void;
}
