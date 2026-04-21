<template>
  <div class="setting-container">
    <div class="setting-header">
      <h2>配置模型</h2>
      <el-button type="primary" @click="$router.push('/')">返回</el-button>
    </div>
    <div class="setting-body">
      <el-form :model="form" :label-width="100" label-position="top">
        <el-form-item label="OpenAI Base URL">
          <el-input v-model="form.openai"></el-input>
        </el-form-item>
        <el-form-item label="OpenAI API Key">
          <el-input v-model="form.openaiToken" type="password" show-password></el-input>
        </el-form-item>
        <el-form-item label="OpenAI Model">
          <el-input v-model="form.openaiModel" ></el-input>
        </el-form-item>
      </el-form>
    </div>
    <div class="setting-footer">
      <el-button @click="$router.push('/')">取消</el-button>
      <el-button type="primary" @click="onConfirmClick"> 确认 </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useSettingStore } from '@/stores/setting';
import { reactive } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const settingStore = useSettingStore();
const form = reactive({
  openai: settingStore.config.openai,
  openaiToken: settingStore.config.openai_token,
  openaiModel: settingStore.config.openai_model,
});

const onConfirmClick = () => {
  settingStore.setOpenai(form.openai);
  settingStore.setOpenaiToken(form.openaiToken);
  settingStore.setOpenaiModel(form.openaiModel);
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

.setting-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.vendor-block {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  border-radius: 4px;
  background-color: #272822;
}
</style>