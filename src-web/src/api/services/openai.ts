import OpenAI from 'openai';
import { type ChatParams } from '@/api';
import { useSettingStore } from '@/stores/setting';

class OpenAIService {
  private client: OpenAI | null = null;
  private controller: AbortController | null = null;

  private getClient() {
    const settingStore = useSettingStore();
    const baseURL = settingStore.config.openai;
    const apiKey = settingStore.config.openai_token;
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

  async chat({ content, messages }: ChatParams, callback: any, end: any) {
    const settingStore = useSettingStore();
    const apiKey = settingStore.config.openai_token;
    if (!apiKey) {
      callback('请配置 code-assist.openai_token');
      end('');
      return;
    }
    this.controller = new AbortController();
    try {
      const client = this.getClient();
      const stream = (await client.chat.completions.create(
        {
          model: settingStore.config.openai_model,
          messages: [
            ...messages,
            {
              content: content,
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
          callback && callback(delta);
        }
      }
      end && end();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('OpenAI chat aborted');
      } else {
        console.error('OpenAI chat error:', error);
        callback && callback(`Error: ${error.message}`);
        end && end();
      }
    }
  }
}

export const openaiService = new OpenAIService();
