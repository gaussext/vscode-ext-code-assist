import { shuffleArray, sleep } from '@/utils';
import TEST from './TEST.md?raw';
import type { IChatChunk } from '@/types';
import { sl } from 'element-plus/es/locale/index.mjs';

export class RpcMock {
  static reasoning = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Class euismod maecenas sed ridiculus sociis placerat porttitor. 
Parturient erat luctus vehicula ridiculus arcu conubia tempus. 
Tempus in diam non malesuada penatibus hendrerit ultrices.`;
  static content = TEST;
  static async loadContent() {
    const TEST = await import('./TEST.md?raw');
    this.content = TEST.default;
  }

  static async mockModels() {
    await sleep(1000);
    return Promise.resolve({
      body: {
        object: 'list',
        data: shuffleArray([
          {
            id: 'qwen3:4b',
            object: 'model',
            created: 1776875731,
            owned_by: 'library',
          },
          {
            id: 'qwen3:1.7b',
            object: 'model',
            created: 1776875342,
            owned_by: 'library',
          },
          {
            id: 'qwen3:0.6b',
            object: 'model',
            created: 1775916074,
            owned_by: 'library',
          },

          {
            id: 'deepseek-v4-flash',
            object: 'model',
            owned_by: 'deepseek',
          },
          {
            id: 'deepseek-v4-pro',
            object: 'model',
            owned_by: 'deepseek',
          },
        ]),
      },
    });
  }

  static mockChatStream(signal?: AbortSignal): ReadableStream<IChatChunk> {
    const abortController = signal ? null : new AbortController();
    const effectiveSignal = signal || abortController?.signal;
    return new ReadableStream<IChatChunk>({
      start: async (controller) => {
        await this.mockReasoningStream(controller, effectiveSignal);
        await this.mockContentStream(controller, effectiveSignal);
        controller.close();
      },
    });
  }

  static async mockReasoningStream(controller, signal?: AbortSignal) {
    for (const char of this.reasoning) {
      await sleep(0);
      if (signal?.aborted) {
        controller.close();
        return;
      }
      controller.enqueue({ type: 'reasoning', data: char });
    }
  }

  static async mockContentStream(controller, signal?: AbortSignal) {
    for (const char of this.content) {
      await sleep(0);
      if (signal?.aborted) {
        controller.close();
        return;
      }
      controller.enqueue({ type: 'content', data: char });
    }
  }

  static abort() {
  }
}
