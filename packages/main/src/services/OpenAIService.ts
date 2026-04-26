import OpenAI from 'openai';
import log from 'loglevel';
import { IChatParams } from 'code-assist-shared';

export class OpenAIService {
  private client: OpenAI | null = null;
  private controller: AbortController | null = null;

  private getClient(apiKey: string, baseURL?: string) {
    if (!baseURL) {
      throw new Error('Please configure baseURL');
    }
    if (!apiKey) {
      throw new Error('Please configure API Key');
    }
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
      dangerouslyAllowBrowser: true,
    });
    return this.client;
  }

  async models(params: IChatParams) {
    log.info('models', params);
    const { apiKey, baseURL } = params;
    try {
      const client = this.getClient(apiKey, baseURL);
      return client.models.list();
    } catch (error: any) {
      return 'OpenAI models error: ' + error.message;
    }
  }

  async chat(params: IChatParams) {
    log.info('chat', params);
    const { apiKey, baseURL } = params;
    try {
      const client = this.getClient(apiKey, baseURL);
      return client.chat.completions.create({
        model: params.model,
        messages: params.messages,
        stream: false,
      });
    } catch (error: any) {
      return 'OpenAI compact error: ' + error.message;
    }
  }

  async chatStream(params: IChatParams) {
    this.controller = new AbortController();
    const { apiKey, baseURL } = params;
    log.info('stream', params);
    const client = this.getClient(apiKey, baseURL);
    return client.chat.completions.create(
      {
        model: params.model,
        messages: params.messages,
        stream: true,
      },
      {
        signal: this.controller.signal,
      }
    );
  }

  stop(params: any) {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }
}
