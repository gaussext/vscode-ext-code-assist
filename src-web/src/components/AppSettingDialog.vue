<template>
  <el-dialog v-model="visible" title="配置模型" width="500" @closed="onClosed">
    <el-form :model="form" :label-width="100" label-position="top">
      <h3>模型</h3>
      <el-form-item v-for="vendor in form.models" :key="vendor.value" :label="vendor.label">
        <div class="vendor-block">
          <div class="model-block" v-for="(model, index) in vendor.children" :key="model.value">
            <label>{{ model.label }}</label>
            <el-form-item label-position="left">
              <el-checkbox v-model="model.checked"></el-checkbox>
            </el-form-item>
          </div>
        </div>
      </el-form-item>
      <h3>供应商</h3>
      <el-form-item label="Ollama">
        <el-input v-model="form.ollama" placeholder="http://127.0.0.1:11434"></el-input>
      </el-form-item>
      <el-form-item label="DeepSeek">
        <el-input v-model="form.deepseek" placeholder="https://api.deepseek.com"></el-input>
      </el-form-item>
      <el-form-item label="DeepSeek Token">
        <el-input v-model="form.deepseekToken" type="password" show-password></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="onCancelClick">取消</el-button>
        <el-button type="primary" @click="onConfirmClick"> 确认 </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import setting, { type IModel } from "@/setting";
import { reactive, ref } from "vue";

const visible = ref(true);
const form = reactive({
  ollama: setting.ollama,
  deepseek: setting.deepseek,
  deepseekToken: setting.deepseekToken,
  models: setting.models,
});

let operation: "submit" | "cancel" = "submit";
const onCancelClick = () => {
  operation = "cancel";
  visible.value = false;
};

const onConfirmClick = () => {
  const selectedModels: IModel[] = []
  form.models.forEach((vendor) => {
    vendor.children.forEach((model) => {
      if (model.checked) {
        selectedModels.push({
          vendor: model.vendor,
          label: model.label,
          value: model.value,
          checked: model.checked,
        });
      }
    });
  })
  setting.ollama = form.ollama;
  setting.deepseek = form.deepseek;
  setting.deepseekToken = form.deepseekToken;
  setting.selectedModels = selectedModels;
  visible.value = false;
};

const emit = defineEmits(["cancel", "submit"]);

const onClosed = () => {
  emit(operation);
};
</script>

<style>
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
  background-color: #414339;
}
</style>
