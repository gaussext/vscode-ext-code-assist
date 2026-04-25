import { sleep } from '@/utils';
import type { StreamCallbacks } from './rpc';
import TEST from './TEST.md?raw';

export class RpcMock {
  static reasoning = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Class euismod maecenas sed ridiculus sociis placerat porttitor. Parturient erat luctus vehicula ridiculus arcu conubia tempus. Tempus in diam non malesuada penatibus hendrerit ultrices.
Etiam tempus cum sem turpis ligula sociosqu pellentesque. Ante vulputate pellentesque nullam faucibus primis habitasse ac. Et vestibulum justo quis cum magnis suscipit interdum. Per natoque aptent habitant gravida vel vivamus rutrum.
Potenti gravida nulla porttitor egestas class fusce ornare. Nullam condimentum eget suscipit congue sociosqu ornare dictumst. Amet pulvinar sit scelerisque risus a sagittis pretium. Etiam congue neque class leo eget luctus diam.
`;
  static content = `# RPC client not initialized. This is Mock Response.
${TEST}`;
  static abortController = new AbortController();

  static async mockStream(callbacks: StreamCallbacks) {
    this.abortController = new AbortController();
    for (const char of this.reasoning) {
      await sleep(0);
      if (this.abortController.signal.aborted) {
        callbacks.onComplete();
        return;
      }
      callbacks.onChunk({ type: 'reasoning', data: char });
    }
    for (const char of this.content) {
      await sleep(0);
      if (this.abortController.signal.aborted) {
        callbacks.onComplete();
        return;
      }
      callbacks.onChunk({ type: 'content', data: char });
    }
    callbacks.onComplete();
  }

  static async mock() {
    await sleep(3000);
    return this.content;
  }

  static abort() {
    this.abortController.abort();
  }
}
