import OpenAI from 'openai';
import { ChatParams, StreamCallbacks } from '../models';

export class OpenAIService {
  private client: OpenAI | null = null;
  private controller: AbortController | null = null;

  private getClient(apiKey: string, baseURL?: string) {
    if (!apiKey) {
      throw new Error('请配置 code-assist.openai_token');
    }
    
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: apiKey,
        baseURL: baseURL || undefined,
        dangerouslyAllowBrowser: true,
      });
    }
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
    try {
      const client = this.getClient(apiKey, baseURL);
      const stream = (await client.chat.completions.create(
        {
          model: params.model,
          messages: [
            ...params.messages,
            {
              content: params.content,
              role: 'user',
            },
          ],
          stream: true
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
        console.log('OpenAI chat aborted');
      } else {
        console.error('OpenAI chat error:', error);
        callbacks.onError(new Error(`Error: ${error.message}`));
        callbacks.onComplete();
      }
    }
  }
}