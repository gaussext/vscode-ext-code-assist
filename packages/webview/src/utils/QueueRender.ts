import type { IChatChunkMerge } from '@/types';

type Callback<T> = (result: T) => void;

const CHUNK_TYPES = ['reasoning', 'content', 'error', 'end'] as const;
const FPS_LIMIT = 33; // ~30fps

export class QueueRender {
  private queue: IChatChunkMerge[] = [];
  private callback: Callback<IChatChunkMerge> | null = null;
  private rafId: number | null = null;
  private lastFlushTime = 0;

  queueAsync<T extends IChatChunkMerge>(result: T, callback: Callback<T>) {
    this.queue.push(result);
    this.callback = callback as Callback<IChatChunkMerge>;
    this.schedule();
  }

  private schedule() {
    if (this.rafId !== null) return;
    this.rafId = requestAnimationFrame((timestamp) => {
      this.rafId = null;
      if (timestamp - this.lastFlushTime < FPS_LIMIT) {
        this.schedule();
        return;
      }
      this.lastFlushTime = timestamp;
      this.flush();
    });
  }

  private flush() {
    if (this.queue.length === 0) return;
    const items = this.queue;
    this.queue = [];

    const grouped: Record<string, IChatChunkMerge[]> = {};
    for (const item of items) {
      (grouped[item.type] ??= []).push(item);
    }

    for (const type of CHUNK_TYPES) {
      const list = grouped[type];
      if (list) this.output(list);
    }
  }

  private output(list: IChatChunkMerge[]) {
    if (!this.callback) return;
    let chunk = list[0];
    for (let i = 1; i < list.length; i++) {
      chunk.data! += list[i].data ?? '';
    }
    this.callback(chunk);
  }

  dispose() {
    this.callback = null;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.queue = [];
  }
}
