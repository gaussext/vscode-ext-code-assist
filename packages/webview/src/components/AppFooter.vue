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
      <div></div>
      <button id="chat-button" @click="$emit('click')">
        <component :is="loading ? VideoPause : Promotion" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from '@/utils/marked';
import { VideoPause, Promotion, Setting } from '@element-plus/icons-vue';

const modelValue = defineModel<string>({ required: true });

const props = defineProps({
  loading: {
    default: false,
  },
  promptCode: {
    default: '',
  }
});
const emit = defineEmits(['update:model', 'change', 'click']);

// 处理键盘事件
const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    emit('click');
  }
};

// 格式化消息内容
const formatCode = (content) => {
  return marked.parse(content);
};
</script>
