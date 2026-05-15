import { createDefaultProvider, Provider } from '@/models/Provider';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { EnumStorageKey } from './constants';

function loadProviders(): Provider[] {
  const raw = localStorage.getItem(EnumStorageKey.Providers);
  if (raw) {
    try { return JSON.parse(raw); } catch { }
  }
  return [];
}

function saveProviders(providers: Provider[]) {
  localStorage.setItem(EnumStorageKey.Providers, JSON.stringify(providers));
}

export const useProviderStore = defineStore('provider', () => {
  const providers = ref<Provider[]>(loadProviders());

  const setProviders = (value: Provider[]) => {
    providers.value = value;
    saveProviders(value);
  };

  const resetProviders = async () => {
    setProviders([await createDefaultProvider()]);
  };

  const init = async () => {
    if (providers.value.length === 0) {
      await resetProviders();
    }
  };

  return {
    providers,
    setProviders,
    resetProviders,
    init,
  };
});
