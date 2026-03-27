export type RpcMessageType = 'request' | 'response' | 'stream' | 'error' | 'complete';

export interface RpcMessage<T = unknown> {
  id: string;
  type: RpcMessageType;
  path?: string;
  data?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface RpcRequest<T = unknown> extends RpcMessage<T> {
  type: 'request';
  path: string;
}

export interface RpcResponse<T = unknown> extends RpcMessage<T> {
  type: 'response';
}

export interface RpcStreamChunk<T = unknown> extends RpcMessage<T> {
  type: 'stream';
  chunkIndex: number;
  isLast: boolean;
}

export interface RpcError extends RpcMessage {
  type: 'error';
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface RpcComplete extends RpcMessage {
  type: 'complete';
}

export type StreamCallback<T> = (chunk: T) => void;
export type CompleteCallback = () => void;``
export type ErrorCallback = (error: Error) => void;

export interface RpcHandler<TParams = unknown, TResult = unknown> {
  (params?: TParams): Promise<TResult> | TResult;
}

export interface RpcStreamHandler<TParams = any, TChunk = any> {
  (
    params?: TParams,
    stream?: {
      write: (chunk: TChunk) => void;
      complete: () => void;
      error: (err: Error) => void;
    }
  ): Promise<void> | void;
}


export interface RpcClientOptions {
  timeout?: number;
  debug?: boolean;
}

export interface RpcServerOptions {
  debug?: boolean;
}
