import { createDefaultProvider, Provider } from '@/models/Provider';
import { defineStore } from 'pinia';
import { onMounted, ref } from 'vue';
import { EnumStorageKey } from './constants';



function loadProvidersFromStorage<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}

export const useProviderStore = defineStore('provider', () => {
  const providers = ref<Provider[]>(loadProvidersFromStorage(EnumStorageKey.Providers, []));

  const setProviders = (value: Provider[]) => {
    providers.value = value;
    localStorage.setItem(EnumStorageKey.Providers, JSON.stringify(value));
  };

  const resetProviders = async () => {
    setProviders([await createDefaultProvider()]);
  };

  onMounted(() => {
    if (providers.value.length === 0) {
      resetProviders();
    }
  });

  return {
    providers,
    setProviders,
    resetProviders,
  };
});
