import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

import { logger } from '../lib/Logger';

interface IProviderParams {
  baseURL: string;
  apiKey: string;
}

interface ChatParams {
  baseURL: string;
  apiKey: string;
  model: string;
  messages: ChatCompletionMessageParam[];
}

export class OpenAIService {
  private client: OpenAI | null = null;

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

  async models(params: IProviderParams) {
    logger.info('OpenAI models request', { baseURL: params.baseURL });
    const { apiKey, baseURL } = params;
    try {
      const client = this.getClient(apiKey, baseURL);
      const resp = await client.models.list();
      logger.info('OpenAI models response', resp);
      return resp;
    } catch (error: any) {
      return {
        message: 'OpenAI api error: ' + error.message,
      };
    }
  }

  async chat(params: ChatParams) {
    logger.info('OpenAI chat request', { model: params.model, messages: params.messages.length });
    const { apiKey, baseURL } = params;
    try {
      const client = this.getClient(apiKey, baseURL);
      const resp = await client.chat.completions.create({
        model: params.model,
        messages: params.messages,
        stream: false,
      });
      logger.info('OpenAI chat response', resp);
      return resp;
    } catch (error: any) {
      return {
        message: 'OpenAI api error: ' + error.message,
      };
    }
  }

  async chatStream(params: ChatParams) {
    const { apiKey, baseURL } = params;
    logger.info('OpenAI stream start', { model: params.model, messages: params.messages.length });
    const client = this.getClient(apiKey, baseURL);
    try {
      const stream = await client.chat.completions.create({
        model: params.model,
        messages: params.messages,
        stream: true,
      });
      return new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            controller.enqueue(chunk);
          }
          controller.close();
        },
      });
    } catch (error: any) {
      return {
        message: 'OpenAI api error: ' + error.message,
      };
    }
  }

  stop() {
    return Promise.resolve({ message: 'Stop not implemented for OpenAI' });
  }
}
