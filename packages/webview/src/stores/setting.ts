import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Model {
  id: string;
  name: string;
}

export interface Provider {
  id: string;
  name: string;
  baseURL: string;
  apiKey: string;
  models: Model[];
}

const setting = (window as any).setting;

function loadFromStorage<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultValue;
    }
  }
  const configValue = setting.get(key);
  return configValue !== undefined ? configValue : defaultValue;
}

const DEFAULT_PROVIDERS: Provider[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: '',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    apiKey: '',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    ],
  },
];

const TEMPERATURE = parseFloat(
  localStorage.getItem('setting.config.temperature') || setting.get('temperature') || '0.0'
);

export const useSettingStore = defineStore('setting', () => {
  const mode = ref('session');
  const temperature = ref(TEMPERATURE);
  const providers = ref<Provider[]>(loadFromStorage('setting.config.providers', DEFAULT_PROVIDERS));
  const currentProviderId = ref<string>(loadFromStorage('setting.config.currentProviderId', 'deepseek'));

  const currentProvider = computed(() => {
    return providers.value.find((p) => p.id === currentProviderId.value) || providers.value[0];
  });

  const currentModel = computed(() => {
    const provider = currentProvider.value;
    if (provider && provider.models.length > 0) {
      return provider.models[0];
    }
    return { id: 'deepseek-chat', name: 'DeepSeek Chat' };
  });

  const setTemperature = (value: number) => {
    temperature.value = value;
    localStorage.setItem('setting.config.temperature', value.toFixed(1));
  };

  const setCurrentProvider = (providerId: string) => {
    currentProviderId.value = providerId;
    localStorage.setItem('setting.config.currentProviderId', providerId);
  };

  const updateProvider = (providerId: string, updates: Partial<Provider>) => {
    const index = providers.value.findIndex((p) => p.id === providerId);
    if (index !== -1) {
      providers.value[index] = { ...providers.value[index], ...updates };
      localStorage.setItem('setting.config.providers', JSON.stringify(providers.value));
    }
  };

  const setProviderApiKey = (providerId: string, apiKey: string) => {
    updateProvider(providerId, { apiKey });
  };

  const setProviderBaseURL = (providerId: string, baseURL: string) => {
    updateProvider(providerId, { baseURL });
  };

  const setProviderModels = (providerId: string, models: Model[]) => {
    updateProvider(providerId, { models });
  };

  const addModelToProvider = (providerId: string, model: Model) => {
    const provider = providers.value.find((p) => p.id === providerId);
    if (provider) {
      provider.models.push(model);
      localStorage.setItem('setting.config.providers', JSON.stringify(providers.value));
    }
  };

  const removeModelFromProvider = (providerId: string, modelId: string) => {
    const provider = providers.value.find((p) => p.id === providerId);
    if (provider) {
      provider.models = provider.models.filter((m) => m.id !== modelId);
      localStorage.setItem('setting.config.providers', JSON.stringify(providers.value));
    }
  };

  return {
    mode,
    temperature,
    providers,
    currentProviderId,
    currentProvider,
    currentModel,
    setTemperature,
    setCurrentProvider,
    updateProvider,
    setProviderApiKey,
    setProviderBaseURL,
    setProviderModels,
    addModelToProvider,
    removeModelFromProvider,
  };
});