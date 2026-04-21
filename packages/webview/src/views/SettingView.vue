<template>
  <div class="setting-container">
    <div class="setting-header">
      <div></div>
      <el-icon class="header-icon" style="transform: rotate(90deg);" @click="$router.push('/')"><Download /></el-icon>
    </div>
    <div class="setting-body">
      <div class="provider-content">
        <div class="form-section">
          <label>Base URL</label>
          <input v-model="currentProvider.baseURL" placeholder="https://api.example.com" />
        </div>
        <div class="form-section">
          <label>API Key</label>
          <input v-model="currentProvider.apiKey" type="password" placeholder="sk-..." />
        </div>

        <div class="models-section">
          <div class="models-header">
            <span>模型列表</span>
            <button @click="handleAddModel(currentProvider.id)">添加模型</button>
          </div>
          <div class="models-list">
            <div
              v-for="(model, index) in currentProvider.models"
              :key="model.id"
              class="model-item"
            >
              <input v-model="model.id" placeholder="模型ID" class="model-id-input" />
              <button class="delete-btn" @click="handleRemoveModel(currentProvider.id, model.id)">
                <Delete />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="setting-footer">
      <button @click="$router.push('/')">取消</button>
      <button class="primary" @click="onConfirmClick">确认</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useSettingStore, type Model } from '@/stores/setting';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Delete, Upload, Download } from '@element-plus/icons-vue';

const router = useRouter();
const settingStore = useSettingStore();
const activeProviderId = ref(settingStore.currentProviderId);
const currentProvider = computed(() => settingStore.providers.find(p => p.id === activeProviderId.value)!);

const handleProviderChange = (providerId: string) => {
  settingStore.setCurrentProvider(providerId);
};

const handleAddModel = (providerId: string) => {
  const newModel: Model = {
    id: `model-${Date.now()}`,
    name: '新模型',
  };
  settingStore.addModelToProvider(providerId, newModel);
};

const handleRemoveModel = (providerId: string, modelId: string) => {
  settingStore.removeModelFromProvider(providerId, modelId);
};

const onConfirmClick = () => {
  router.push('/');
};
</script>

<style scoped>
.setting-container {
  min-width: 400px;
  max-width: 800px;
  margin: 0 auto;
  max-height: 100vh;
  padding: 0 4px;
  display: flex;
  flex-direction: column;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  height: 28px;
}

.setting-body {
  flex: 1;
  max-height: 66vh;
  overflow-y: auto;
  padding: 0 8px;
}

.provider-content {
  padding: 16px 0px;
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
  margin-top: 20px;
}
</style>