import OpenAI from 'openai';
import log from 'loglevel';
import { ChatParams, StreamCallbacks } from '../models';

export class OpenAIService {
  private client: OpenAI | null = null;
  private controller: AbortController | null = null;

  private getClient(apiKey: string, baseURL?: string) {
    if (!baseURL) {
      throw new Error('请配置 baseURL');
    }
    if (!apiKey) {
      throw new Error('请配置 API Key');
    }
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL || undefined,
      dangerouslyAllowBrowser: true,
    });
    return this.client;
  }

  stop() {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  async chat(params: ChatParams, callbacks: StreamCallbacks) {
    const { apiKey, baseURL } = params;

    if (!apiKey) {
      callbacks.onError(new Error('请配置 code-assist.openai_token'));
      callbacks.onComplete();
      return;
    }

    this.controller = new AbortController();
    log.info('chat', params);
    try {
      const client = this.getClient(apiKey, baseURL);
      const stream = (await client.chat.completions.create(
        {
          model: params.model,
          messages: params.messages,
          stream: true,
        },
        {
          signal: this.controller.signal,
        }
      )) as any;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          callbacks.onChunk(delta);
        }
      }
      callbacks.onComplete();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        log.info('OpenAI chat aborted');
      } else {
        log.error('OpenAI chat error:', error);
        callbacks.onError(new Error(`Error: ${error.message}`));
        callbacks.onComplete();
      }
    }
  }
}
