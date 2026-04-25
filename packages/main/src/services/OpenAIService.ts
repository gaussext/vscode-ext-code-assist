import OpenAI from 'openai';
import log from 'loglevel';
import { IChatParams, StreamCallbacks } from '../models';

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
      baseURL: baseURL,
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

  async chat(params: IChatParams, callbacks: StreamCallbacks) {
    this.controller = new AbortController();
    const { apiKey, baseURL } = params;
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
        const reasoning = chunk.choices[0]?.delta?.reasoning || chunk.choices[0]?.delta?.reasoning_content || '';
        if (reasoning) {
          callbacks.onChunk({ type: 'reasoning', data: reasoning });
        }
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          callbacks.onChunk({ type: 'content', data: content });
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

  async summary(params: IChatParams) {
    log.info('summary', params);
    const { apiKey, baseURL } = params;
    try {
      const client = this.getClient(apiKey, baseURL);
      return client.chat.completions.create({
        model: params.model,
        messages: [
          ...params.messages,
          { role: 'user', content: '请用20字以内总结以上对话主题，作为对话标题直接返回，不需要任何标点和修饰' },
        ],
        stream: false,
      });
    } catch (error: any) {
      return 'OpenAI compact error: ' + error.message;
    }
  }

  async models(params: IChatParams) {
    log.info('models', params);
    const { apiKey, baseURL } = params;
    try {
      const client = this.getClient(apiKey, baseURL);
      const list = await client.models.list();
      return JSON.stringify(list);
    } catch (error: any) {
      return 'OpenAI models error: ' + error.message;
    }
  }
}
