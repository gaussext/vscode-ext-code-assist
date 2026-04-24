<template>
  <div class="app-footer footer-area">
    <div v-if="promptCode" class="prompt-code">
      <Markdown :content="promptCode" />
    </div>
    <div class="prompt-area">
      <textarea
        id="chat-input"
        ref="inputRef"
        v-model="modelValue"
        type="textarea"
        class="vscode-textarea"
        placeholder="请输入您的问题，使用 Shift + Enter 换行"
        :disabled="loading"
        @keypress="handleKeyPress"
      >
      </textarea>
    </div>
    <div id="chat-tool">
      <div></div>
      <button class="vscode-button-form" @click="$emit('click')">
        <el-icon>
          <component :is="loading ? VideoPause : Promotion" />
        </el-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VideoPause, Promotion } from '@element-plus/icons-vue';
import Markdown from '@/components/Markdown.vue';

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
</script>
