import { defineStore } from 'pinia';
import { ref } from 'vue';
import { EnumStorageKey } from './constants';
import { useProviderStore } from './useProviderStore';

export const useSettingStore = defineStore('setting', () => {

  const providerStore = useProviderStore();
  const currentModelHash = ref(localStorage.getItem(EnumStorageKey.CurrentModelHash) ?? '');

  const setCurrentModelHash = (value: string) => {
    currentModelHash.value = value;
    localStorage.setItem(EnumStorageKey.CurrentModelHash, value);
  };

  const getModelParams = () => {
    const modelHash = currentModelHash.value;
    const providers = providerStore.providers;
    let provider = null;
    let model = null;
    providers.forEach(p => {
      p.models.forEach(m => {
        if (m.hash === modelHash) {
          provider = p;
          model = m.id;
        }
      })
    })
    return {
      baseURL: provider?.baseURL || '',
      apiKey: provider?.apiKey || '',
      model,
    }
  }

  return {
    currentModelHash,
    setCurrentModelHash,
    getModelParams
  };
});
