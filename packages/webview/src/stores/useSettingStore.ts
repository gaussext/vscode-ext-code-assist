import { defineStore } from 'pinia';
import { ref } from 'vue';
import { EnumStorageKey } from './constants';
import { useProviderStore } from './useProviderStore';

export const useSettingStore = defineStore('setting', () => {
  const providerStore = useProviderStore();
  const currentModelHash = ref(localStorage.getItem(EnumStorageKey.CurrentModelHash) ?? '');
  const summaryModelHash = ref(localStorage.getItem(EnumStorageKey.SummaryModelHash) ?? '');

  const setCurrentModelHash = (value: string) => {
    currentModelHash.value = value;
    localStorage.setItem(EnumStorageKey.CurrentModelHash, value);
  };

  const setSummaryModelHash = (value: string) => {
    summaryModelHash.value = value;
    localStorage.setItem(EnumStorageKey.SummaryModelHash, value);
  };

  const getModelParams = (modelHash: string) => {
    const providers = providerStore.providers;
    let provider = null;
    let model = null;
    providers.forEach((p) => {
      if (!p.enabled) return;
      p.models.forEach((m) => {
        if (m.hash === modelHash) {
          provider = p;
          model = m.id;
        }
      });
    });
    return {
      baseURL: provider?.baseURL || '',
      apiKey: provider?.apiKey || '',
      model,
      provider: provider?.baseURL || '',
    };
  };

  return {
    currentModelHash,
    setCurrentModelHash,
    summaryModelHash,
    setSummaryModelHash,
    getModelParams,
  };
});
