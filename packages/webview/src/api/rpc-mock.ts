import { shuffleArray, sleep } from '@/utils';
import type { IChatChunk } from '@/types';
import TEST from './data/TEST.md?raw';
import { models } from './data/models';

export class RpcMock {
  static reasoning = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Class euismod maecenas sed ridiculus sociis placerat porttitor. 
Parturient erat luctus vehicula ridiculus arcu conubia tempus. 
Tempus in diam non malesuada penatibus hendrerit ultrices.`;
  static content = TEST;

  static async mockModels() {
    await sleep(1000);
    return Promise.resolve({
      body: {
        object: 'list',
        data: shuffleArray(models),
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

  static abort() {}
}
