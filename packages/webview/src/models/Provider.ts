import * as UUID from 'uuid';
import type { Model } from './Model';
import { sha256 } from '@/utils/hash';

export class Provider {
  id = UUID.v4();
  baseURL = 'http://localhost:11434/v1';
  apiKey = 'ollama';
  models: Model[] = [
    { id: 'qwen3:0.6b', hash: '' },
    { id: 'qwen3:1.7b', hash: '' },
    { id: 'qwen3:4b', hash: '' },
  ];
}

export async function createDefaultProvider() {
  const provider = new Provider();
  const models = provider.models;
  provider.models = [];
  for (const model of models) {
    const hash = await sha256(provider.baseURL + provider.apiKey + model.id);
    provider.models.push({
      id: model.id,
      hash,
    });
  }
  return provider;
}
