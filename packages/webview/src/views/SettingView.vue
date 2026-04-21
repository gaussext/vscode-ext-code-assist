<template>
  <div class="setting-container">
    <div class="setting-header">
      <h2>配置模型</h2>
      <el-button type="primary" @click="$router.push('/')">返回</el-button>
    </div>
    <div class="setting-body">
      <el-tabs v-model="activeProviderId" type="border-card" @tab-change="handleProviderChange">
        <el-tab-pane
          v-for="provider in settingStore.providers"
          :key="provider.id"
          :label="provider.name"
          :name="provider.id"
        >
          <div class="provider-content">
            <el-form :label-width="100" label-position="top">
              <el-form-item label="Base URL">
                <el-input v-model="provider.baseURL" placeholder="https://api.example.com"></el-input>
              </el-form-item>
              <el-form-item label="API Key">
                <el-input v-model="provider.apiKey" type="password" show-password placeholder="sk-..."></el-input>
              </el-form-item>
            </el-form>

            <div class="models-section">
              <div class="models-header">
                <span>模型列表</span>
                <el-button size="small" @click="handleAddModel(provider.id)">添加模型</el-button>
              </div>
              <div class="models-list">
                <div
                  v-for="(model, index) in provider.models"
                  :key="model.id"
                  class="model-item"
                >
                  <el-input v-model="model.name" placeholder="模型显示名称" class="model-name-input"></el-input>
                  <el-input v-model="model.id" placeholder="模型ID" class="model-id-input"></el-input>
                  <el-button
                    type="danger"
                    size="small"
                    :icon="Delete"
                    circle
                    @click="handleRemoveModel(provider.id, model.id)"
                  ></el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <div class="setting-footer">
      <el-button @click="$router.push('/')">取消</el-button>
      <el-button type="primary" @click="onConfirmClick">确认</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useSettingStore, type Model } from '@/stores/setting';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Delete } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const settingStore = useSettingStore();
const activeProviderId = ref(settingStore.currentProviderId);

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
  ElMessage.success('配置已保存');
  router.push('/');
};
</script>

<style scoped>
.setting-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.setting-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.setting-body {
  flex: 1;
  max-height: 66vh;
  overflow-y: auto;
  padding: 0 8px;
}

.provider-content {
  padding: 16px 8px;
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
  padding: 8px;
  border-radius: 4px;
  background-color: #272822;
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