import { ChatMessage } from '@/models/Model';
import type { IMessage } from '@/types';
import { groupBy } from 'lodash';

type Callback<T> = (result: T) => void;

export class QueueRender {
  queue: IMessage[] = [];
  timer: number = 0;
  callback: Callback<IMessage> = null;
  constructor() {
    this.loop();
  }

  loop() {
    this.timer = setInterval(() => {
      this.task();
    }, 33);
  }

  dispose() {
    clearInterval(this.timer);
  }
  // 执行队列中的任务
  async task() {
    const grouped = await groupBy(this.queue, 'type');
    if (grouped['reasoning']) {
      this.output(grouped['reasoning']);
    }
    if (grouped['content']) {
      this.output(grouped['content']);
    }
    if (grouped['error']) {
      this.output(grouped['error']);
    }
    if (grouped['end']) {
      this.output(grouped['end']);
    }
    this.queue = [];
  }

  output(list: IMessage[]) {
    let chunk = list[0];
    list.forEach((item, index) => {
      if (index > 0) {
        chunk.data += item.data;
      }
    });
    this.callback(chunk);
  }

  queueAsync<T extends IMessage>(result: T, callback: Callback<T>) {
    this.queue.push(result);
    this.callback = callback;
  }
}
