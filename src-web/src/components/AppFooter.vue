<template>
  <div class="app-footer footer-area">
    <div class="prompt-code" v-if="promptCode">
      <div v-html="formatCode(promptCode)"></div>
    </div>
    <div class="prompt-area">
      <textarea
        type="textarea"
        ref="inputRef"
        class="vscode-textarea"
        id="chat-input"
        placeholder="请输入您的问题，使用 Shift + Enter 换行"
        v-model="modelValue"
        @keypress="handleKeyPress"
        :disabled="loading"
      >
      </textarea>
    </div>

    <div id="chat-tool">
      <div style="display: flex; align-items: center">
        <el-select
          style="width: 300px"
          :model-value="modelId"
          class="chat-select"
          placeholder="请选择模型"
          @change="handleChange"
          :disabled="loading"
        >
          <el-option v-for="item in models" :key="item.value" :label="item.label" :value="item.value"> </el-option>
        </el-select>
        <el-button
          style="margin-left: 4px"
          class="vscode-button-small"
          id="create-button"
          title="配置模型"
          icon="Setting"
          @click="openDialog"
        >
        </el-button>
      </div>
      <el-button id="chat-button" :type="loading ? 'danger' : 'primary'" @click="$emit('click')">
        <el-icon v-if="loading">
          <VideoPause />
        </el-icon>
        <el-icon v-else>
          <Promotion />
        </el-icon>
      </el-button>
    </div>
  </div>

  <SettingDialog v-if="dialogVisible" @cancel="onDialogCancel" @submit="onDialogSubmit"></SettingDialog>
</template>

<script setup lang="ts">
import { ChatModel, type IModel } from "@/setting";
import { ref, watch } from "vue";
import SettingDialog from "./AppSettingDialog.vue";
import { marked } from "@/utils/marked";
import { VideoPause, Promotion } from '@element-plus/icons-vue';

const modelValue = defineModel<string>({ required: true });

const props = defineProps({
  loading: {
    default: false,
  },
  promptCode: {
    default: "",
  },
  model: {
    default: () => new ChatModel(),
  },
  models: {
    default: () => [] as IModel[],
  },
});
const modelId = ref(props.model?.value || "");
const emit = defineEmits(["update:model", "change", "click"]);

watch(
  () => props.model,
  (value) => {
    modelId.value = value.value;
  },
  { deep: true }
);

// 格式化消息内容
const formatCode = (content) => {
  return marked.parse(content);
};

const inputRef = ref<HTMLTextAreaElement | null>(null);

const handleChange = (value: string) => {
  const model = props.models.find((item) => item.value === value);
  emit("update:model", model);
};

const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    emit("click");
  }
};

const dialogVisible = ref(false);

const openDialog = () => {
  dialogVisible.value = true;
};

const onDialogCancel = () => {
  dialogVisible.value = false;
};

const onDialogSubmit = () => {
  emit("change");
  dialogVisible.value = false;
};
</script>
