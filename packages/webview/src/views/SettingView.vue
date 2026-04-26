<template>
  <div class="setting-container">
    <div class="setting-header">
      <h2 class="setting-header-title">Settings</h2>
      <div class="header-icon-group right">
        <el-icon class="header-icon" style="transform: rotate(90deg)" @click="$router.push('/')">
          <Download />
        </el-icon>
      </div>
    </div>
    <div class="setting-body">
      <div class="model-setting-header">
        <h2 class="model-setting-title">Model</h2>
      </div>
      <div class="model-setting-body">
        <div class="model-setting-item form-section">
          <label>Chat Model</label>
          <select v-model="currentModelHash" class="vscode-select">
            <option v-if="currentModels.length === 0" value="" disabled>Select a model</option>
            <optgroup v-for="group in currentModels" :key="group.label">
              <option class="as-title" :value="group.label" disabled>{{ group.label }}</option>
              <option v-for="model in group.options" :key="model.value" :value="model.value">{{ model.label }}</option>
            </optgroup>
          </select>
        </div>
        <div class="model-setting-item form-section">
          <label>Summary Model</label>
          <select v-model="summaryModelHash" class="vscode-select">
            <option v-if="currentModels.length === 0" value="" disabled>Select a model</option>
            <optgroup v-for="group in currentModels" :key="group.label">
              <option class="as-title" :value="group.label" disabled>{{ group.label }}</option>
              <option v-for="model in group.options" :key="model.value" :value="model.value">{{ model.label }}</option>
            </optgroup>
          </select>
        </div>
      </div>
      <div class="provider-setting-header">
        <h2 class="provider-setting-title">Provider</h2>
      </div>
      <div class="provider-setting-body">
        <div v-for="provider in providers" :key="provider.id" class="provider-item">
          <el-icon
            v-if="providers.length > 1"
            class="hover-visible icon-delete"
            @click="handleRemoveProvider(provider.id)"
          >
            <Delete />
          </el-icon>
          <div class="form-container">
            <div class="form-section">
              <label>Base URL</label>
              <input v-model="provider.baseURL" class="vscode-input" placeholder="https://api.example.com" />
            </div>
            <div class="form-section">
              <label>API Key</label>
              <input v-model="provider.apiKey" class="vscode-input" type="password" placeholder="sk-..." />
            </div>
          </div>
          <div class="preview-container">
            <div class="form-section">
              <label style="display: flex; align-items: center; gap: 8px">
                <span>Models</span>
                <el-icon style="cursor: pointer" @click="getModels(provider)">
                  <Refresh></Refresh>
                </el-icon>
              </label>
              <div class="model-container">
                <div v-for="model in provider.models" :key="model.id" class="model-item">{{ model.id }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="setting-footer">
      <div style="flex: 1">
        <button class="vscode-button" @click="handleAddProvider">Add Provider</button>
      </div>
      <button class="vscode-button" @click="handleResetClick">Reset</button>
      <button class="vscode-button primary" @click="onConfirmClick">OK</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { chatService } from '@/api';
import type { IStandardItem } from '@/types';
import { createDefaultProvider, Provider } from '@/models/Provider';
import { useProviderStore } from '@/stores/useProviderStore';
import { useSettingStore } from '@/stores/useSettingStore';
import { sha256 } from '@/utils/hash';
import { Delete, Download, Refresh } from '@element-plus/icons-vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Model } from '@/models/Model';

const router = useRouter();
const providerStore = useProviderStore();
const settingStore = useSettingStore();

const providers = ref(providerStore.providers);
const currentModelHash = ref(settingStore.currentModelHash || '');
const summaryModelHash = ref(settingStore.summaryModelHash || '');

const currentModels = computed(() => {
  const groups: Record<string, IStandardItem<string>[]> = {};
  providers.value.forEach((p) => {
    if (!groups[p.baseURL]) {
      groups[p.baseURL] = [];
    }
    p.models.forEach((m) => {
      let option = {
        label: m.id,
        value: m.hash,
      };
      if (!groups[p.baseURL].find((o) => o.value === option.value)) {
        groups[p.baseURL].push(option);
      }
    });
  });
  return Object.entries(groups).map(([label, options]) => ({
    label,
    options,
  }));
});

const getModels = async (provider: Provider) => {
  try {
    const res = await chatService.models({
      baseURL: provider.baseURL,
      apiKey: provider.apiKey,
    });
    const models = res.body.data || ([] as Model[]);
    const modelsWithHash: Model[] = [];
    for (const model of models) {
      const hash = await sha256(provider.baseURL + provider.apiKey + model.id);
      modelsWithHash.push({
        id: model.id,
        hash,
      });
    }
    provider.models = modelsWithHash;
  } catch (error) {
    console.error(error);
  }
};

const handleAddProvider = async () => {
  providers.value.push(await createDefaultProvider());
};

const handleRemoveProvider = (id: string) => {
  providers.value = providers.value.filter((p) => p.id !== id);
};

const handleResetClick = async () => {
  await providerStore.resetProviders();
  providers.value = providerStore.providers;
  setTimeout(() => {
    const firstModel = currentModels.value[0]?.options[0];
    if (firstModel) {
      currentModelHash.value = firstModel.value;
      summaryModelHash.value = firstModel.value;
      settingStore.setCurrentModelHash(firstModel.value);
      settingStore.setSummaryModelHash(firstModel.value);
    }
  });
};

const onConfirmClick = () => {
  if (providers.value.length > 0) {
    providerStore.setProviders(providers.value);
    settingStore.setCurrentModelHash(currentModelHash.value);
    settingStore.setSummaryModelHash(summaryModelHash.value);
    router.push('/');
  }
};
</script>

<style lang="scss" scoped>
.setting-container {
  min-width: 400px;
  max-width: 960px;
  margin: 0 auto;
  padding: 0 4px;
  display: flex;
  flex-direction: column;
}

.setting-header,
.model-setting-header,
.provider-setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 28px;
  margin-bottom: 8px;

  .setting-header-title {
    font-size: 16px;
    font-weight: 500;
  }

  .model-setting-title,
  .provider-setting-title {
    border-left: 2px solid var(--vscode-pickerGroup-border);
    padding-left: 0.5em;
    font-size: 14px;
    font-weight: 500;
  }
}

.model-setting-body {
  display: flex;
  gap: 8px;
  .model-setting-item {
    flex: 1;
  }
}

.provider-setting-body {
  flex: 1;
  max-height: calc(100vh - 320px);
  overflow-y: auto;
}

.provider-item {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--vscode-pickerGroup-border);
  margin-bottom: 12px;
  position: relative;
  display: flex;
  gap: 8px;

  .form-container {
    width: 320px;
  }

  .preview-container {
    flex: 1;
  }

  .hover-visible {
    visibility: hidden;
  }

  &:hover .hover-visible {
    visibility: visible;
  }
}

.icon-delete {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 16px;
  cursor: pointer;
}

.form-section {
  margin-bottom: 16px;
}

.form-section label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}

.models-section {
  margin-top: 20px;
}

.models-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
}

.models-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.model-item {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #272822;
}

.setting-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
</style>
