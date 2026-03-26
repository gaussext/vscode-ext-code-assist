import type { RpcStreamHandler, StreamCallback, CompleteCallback, ErrorCallback } from './types';

export class StreamController<TChunk = unknown> {
  private writeCallback: StreamCallback<TChunk>;
  private completeCallback: CompleteCallback;
  private errorCallback: ErrorCallback;
  private isClosed: boolean = false;

  constructor(
    write: StreamCallback<TChunk>,
    complete: CompleteCallback,
    error: ErrorCallback
  ) {
    this.writeCallback = write;
    this.completeCallback = complete;
    this.errorCallback = error;
  }

  write(chunk: TChunk): void {
    if (this.isClosed) {
      throw new Error('Stream is closed');
    }
    this.writeCallback(chunk);
  }

  complete(): void {
    if (this.isClosed) return;
    this.isClosed = true;
    this.completeCallback();
  }

  error(err: Error): void {
    if (this.isClosed) return;
    this.isClosed = true;
    this.errorCallback(err);
  }

  get closed(): boolean {
    return this.isClosed;
  }
}

export function createStreamHandler<TParams = unknown, TChunk = unknown>(
  handler: (params: TParams, stream: StreamController<TChunk>) => Promise<void> | void
): RpcStreamHandler<TParams, TChunk> {
  return (params: TParams, streamContext: { write: StreamCallback<TChunk>; complete: CompleteCallback; error: ErrorCallback }) => {
    const controller = new StreamController<TChunk>(
      streamContext.write,
      streamContext.complete,
      streamContext.error
    );
    return handler(params, controller);
  };
}

export async function* asyncToStream<T>(
  asyncIterable: AsyncIterable<T>
): AsyncGenerator<T, void, unknown> {
  for await (const item of asyncIterable) {
    yield item;
  }
}

export function streamToAsync<T>(
  stream: AsyncGenerator<T, void, unknown>
): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      return stream;
    },
  };
}
