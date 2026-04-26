export interface JsonRpcRequest<T = unknown> {
  jsonrpc: "2.0";
  method: string;
  params?: T;
  id: string;
  __stream__?: boolean;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  result?: T;
  error?: JsonRpcError;
  id: string;
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

export interface ISender {
  postMessage: (message: string) => void;
}

export interface IReceiver {
  onDidReceiveMessage?: (message: any) => void;
  addEventListener?: (event: string, callback: (message: any) => void) => void;
}

export interface IChannel<T> {
  write: (chunk: T) => void;
  complete: () => void;
  error: (error: Error) => void;
}

export type StreamCallback<T> = (chunk: T) => void;
export type CompleteCallback = () => void;
export type ErrorCallback = (error: Error) => void;

export interface RpcHandler<TParams = unknown, TResult = unknown> {
  (params?: TParams): Promise<TResult> | TResult;
}

export interface RpcStreamHandler<TParams = any, TChunk = any> {
  (
    stream: IChannel<TChunk>,
    params?: TParams,
  ): Promise<void> | void;
}