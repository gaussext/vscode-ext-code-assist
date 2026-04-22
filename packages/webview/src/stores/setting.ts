import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface IModel {
  id: string;
}

class Model {
  static toVo(models: IModel[]) {
    return models.map((m) => m.id).join(',');
  }

  static toDto(models: string) {
    return models.split(',').map((id) => ({ id }));
  }
}

export interface IProvider {
  id: string;
  baseURL: string;
  apiKey: string;
  models: IModel[];
}

export interface IProviderVo {
  id: string;
  baseURL: string;
  apiKey: string;
  models: string;
}

export class Provider {
  id = 'default';
  baseURL = 'http://localhost:11434/v1';
  apiKey = 'ollama';

  static toVo(providers: IProvider[]) {
    return providers.map((p) => ({
      ...p,
      models: Model.toVo(p.models),
    }));
  }

  static toDto(providers: IProviderVo[]) {
    return providers.map((vo) => ({
      ...vo,
      models: Model.toDto(vo.models),
    }));
  }
}

export class ProviderDto extends Provider {
  models: IModel[] = [{ id: 'qwen3:0.6b' }];
}

export class ProviderVo extends Provider {
  models = 'qwen3:0.6b';
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


const TEMPERATURE = parseFloat(
  localStorage.getItem('setting.config.temperature') || setting.get('temperature') || '0.0'
);

export const useSettingStore = defineStore('setting', () => {
  const mode = ref('session');
  const temperature = ref(TEMPERATURE);
  const providers = ref<ProviderDto[]>(loadFromStorage('setting.config.providers', [new ProviderDto()]));
  const currentProviderId = ref<string>(loadFromStorage('setting.config.currentProviderId', 'default'));
  const currentModelId = ref<string>(loadFromStorage('setting.config.currentModelId', 'qwen3:0.6b'));

  const currentProvider = computed(() => {
    return providers.value.find((p) => p.id === currentProviderId.value) || providers.value[0];
  });

  const currentModel = computed(() => {
    const provider = currentProvider.value;
    return provider.models.find((m) => m.id === currentModelId.value);
  });

  const setTemperature = (value: number) => {
    temperature.value = value;
    localStorage.setItem('setting.config.temperature', value.toFixed(1));
  };

  const setProviders = (value: IProvider[]) => {
    providers.value = value;
    localStorage.setItem('setting.config.providers', JSON.stringify(value));
  };

  const resetProviders = () => {
    setProviders([new ProviderDto()]);
  };

  const setCurrentProviderId = (value: string) => {
    currentProviderId.value = value;
    localStorage.setItem('setting.config.currentProviderId', value);
  };

  const setCurrentModelId = (value: string) => {
    currentModel.value.id = value;
  };

  return {
    mode,
    temperature,
    providers,
    currentProviderId,
    currentProvider,
    currentModel,
    setTemperature,
    setProviders,
    resetProviders,
    setCurrentProviderId,
    setCurrentModelId,
  };
});
