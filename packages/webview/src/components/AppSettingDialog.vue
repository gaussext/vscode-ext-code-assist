<template>
  <el-dialog v-model="visible" title="配置模型" width="500" @closed="onClosed">
    <div class="dialog-body">
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
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="onCancelClick">取消</el-button>
        <el-button type="primary" @click="onConfirmClick"> 确认 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { useSettingStore } from '@/stores/setting';
import { reactive, ref } from 'vue';

const settingStore = useSettingStore();
const visible = ref(true);
const form = reactive({
  openai: settingStore.config.openai,
  openaiToken: settingStore.config.openai_token,
  openaiModel: settingStore.config.openai_model,
});

let operation: 'submit' | 'cancel' = 'submit';
const onCancelClick = () => {
  operation = 'cancel';
  visible.value = false;
};

const onConfirmClick = () => {
  settingStore.setOpenai(form.openai);
  settingStore.setOpenaiToken(form.openaiToken);
  settingStore.setOpenaiModel(form.openaiModel);
  visible.value = false;
};

const emit = defineEmits(['cancel', 'submit']);

const onClosed = () => {
  emit(operation);
};
</script>

<style>
.dialog-body {
  max-height: 66vh;
  overflow-y: auto;
  padding: 0 8px;
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
