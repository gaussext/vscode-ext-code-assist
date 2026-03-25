import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ChatVendor } from '@/api';

const setting = (window as any).setting;
const OPENAI = localStorage.getItem('setting.config.openai') || setting.get('openai') || 'https://api.deepseek.com';
const OPENAI_TOKEN = localStorage.getItem('setting.config.openai_token') || setting.get('openai_token') || '';
const OPENAI_MODEL = localStorage.getItem('setting.config.openai_model') || setting.get('openai_model') || 'deepseek-chat';
const TEMPERATURE = parseFloat(localStorage.getItem('setting.config.temperature') || setting.get('temperature') || '0.0');

export const useSettingStore = defineStore('setting', () => {
  const mode = ref('session');
  const temperature = ref(TEMPERATURE);
  const config = ref({
    openai: OPENAI,
    openai_token: OPENAI_TOKEN,
    openai_model: OPENAI_MODEL,
  });
  const setTemperature = (value: number) => {
    temperature.value = value;
    localStorage.setItem('setting.config.temperature', value.toFixed(1));
  };

  const setOpenai = (value: string) => {
    config.value.openai = value;
    localStorage.setItem('setting.config.openai', value);
  };

  const setOpenaiToken = (value: string) => {
    config.value.openai_token = value;
    localStorage.setItem('setting.config.openai_token', value);
  };

  const setOpenaiModel = (value: string) => {
    config.value.openai_model = value;
    localStorage.setItem('setting.config.openai_model', value);
  };

  return {
    mode,
    temperature,
    config,
    setTemperature,
    setOpenai,
    setOpenaiToken,
    setOpenaiModel,
  };
});
