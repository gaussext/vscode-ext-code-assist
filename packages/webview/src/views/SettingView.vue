<template>
  <div class="setting-container">
    <div class="setting-header">
      <h2 class="setting-title">供应商配置</h2>
      <el-icon class="header-icon" style="transform: rotate(90deg);" @click="$router.push('/')"><Download /></el-icon>
    </div>
    <div class="setting-body">
      <div v-for="provider in providers" :key="provider.id" class="provider-content">
        <el-icon v-if="providers.length > 1" class="delete-icon" @click="handleRemoveProvider(provider.id)"><Delete /></el-icon>
        <div class="form-section">
          <label>Base URL</label>
          <input v-model="provider.baseURL" placeholder="https://api.example.com" />
        </div>
        <div class="form-section">
          <label>API Key</label>
          <input v-model="provider.apiKey" type="password" placeholder="sk-..." />
        </div>
          <div class="form-section">
          <label>Models</label>
          <input v-model="provider.models" placeholder="model1,model2,model3" />
        </div>
      </div>
    </div>
    <div class="setting-footer">
      <div style="flex: 1">
        <button @click="handleAddProvider">Add Provider</button>
      </div>
      <button @click="handleResetClick">Reset</button>
      <button class="primary" @click="onConfirmClick">OK</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Provider, ProviderVo, useSettingStore, type IModel } from '@/stores/setting';
import { useRouter } from 'vue-router';
import { Delete, Upload, Download } from '@element-plus/icons-vue';
import { ref } from 'vue';

const router = useRouter();
const settingStore = useSettingStore();
const providers = ref(Provider.toVo(settingStore.providers));

const handleAddProvider = () => {
  providers.value.push(new ProviderVo());
};
const handleRemoveProvider = (id: string) => {
  providers.value = providers.value.filter((p) => p.id !== id);
};

const handleResetClick = () => {
  settingStore.resetProviders();
  providers.value = Provider.toVo(settingStore.providers);
  console.log(providers.value);
};

const onConfirmClick = () => {
  // save
  // redirect to home page
  if (providers.value.length > 0) {
    settingStore.setProviders(Provider.toDto(providers.value));
    router.push('/');
  }
};
</script>

<style scoped>
.setting-container {
  min-width: 400px;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 4px;
  display: flex;
  flex-direction: column;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 28px;
  margin-bottom: 8px;
}

.setting-title {
  font-size: 14px;
  font-weight: 500;
  padding-left: 8px;
}

.setting-body {
  flex: 1;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  padding: 0 8px;
}

.provider-content {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--vscode-pickerGroup-border);
  margin-bottom: 12px;
  position: relative;
}

.delete-icon {
  position: absolute;
  top: 8px;
  right: 8px;
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

input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #272822;
  color: #fff;
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: #409eff;
}

button {
  padding: 6px 12px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #272822;
  color: #fff;
  cursor: pointer;
}

button:hover {
  background-color: #3a3a32;
}

button.primary {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

button.primary:hover {
  background-color: #66b1ff;
}

button.delete-btn {
  padding: 4px;
  min-width: 28px;
  min-height: 28px;
  font-size: 16px;
  border: none;
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

.model-item {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 4px;
}

.model-name-input {
  width: 150px;
}

.model-id-input {
  flex: 1;
}

.setting-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 8px;
}
</style>