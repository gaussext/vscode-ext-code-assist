<template>
  <div class="app-footer footer-area">
    <div class="prompt-code" v-if="promptCode">
      <div v-html="formatCode(promptCode)"></div>
    </div>
    <div class="prompt-area">
      <textarea type="textarea" ref="inputRef" class="vscode-textarea" id="chat-input"
        placeholder="请输入您的问题，使用 Shift + Enter 换行" v-model="modelValue" @keypress="handleKeyPress" :disabled="loading">
      </textarea>
    </div>

    <div id="chat-tool">
      <div style="display: flex; align-items: center;">
        <el-dropdown @command="handleCommand">
          <span style="display: flex; align-items: center;" class="el-dropdown-link">
            <span class="text"> {{ modelLabel }}</span>
            <el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="item in models" :key="item.value" :command="item.value"
                :class="{ active: item.value === modelId }">{{ item.label }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button style="margin-left: 4px" class="vscode-button-small" id="setting-button" title="配置模型" text type="info"
          :icon="Setting" @click="openDialog">
        </el-button>
      </div>
      <el-button id="chat-button" :icon="loading ? VideoPause : Promotion" type="info" text
        @click="$emit('click')">
      </el-button>
    </div>
  </div>

  <SettingDialog v-if="dialogVisible" @cancel="onDialogCancel" @submit="onDialogSubmit"></SettingDialog>
</template>

<script setup lang="ts">
import { ChatModel, type IModel } from "@/setting";
import { computed, ref, watch } from "vue";
import SettingDialog from "./AppSettingDialog.vue";
import { marked } from "@/utils/marked";
import { VideoPause, Promotion, Setting, ArrowDown } from '@element-plus/icons-vue';

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

const modelLabel = computed(() => {
  return props.models.find(item => item.value === modelId.value)?.label;
});

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

const handleCommand = (value: string) => {
  modelId.value = value;
  console.log(value);

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
