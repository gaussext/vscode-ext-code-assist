<template>
  <div class="app-footer footer-area">
    <div v-if="promptCode" class="prompt-code">
      <Markdown :content="promptCode"></Markdown>
    </div>
    <div class="prompt-area">
      <textarea
        id="chat-input"
        ref="inputRef"
        v-model="modelValue"
        type="textarea"
        class="vscode-textarea"
        placeholder="Enter your question, use Shift + Enter to line break"
        :disabled="loading"
        @keypress="handleKeyPress"
      >
      </textarea>
    </div>
    <div id="chat-tool">
      <div></div>
      <button class="vscode-button" @click="$emit('click')">
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

<style>
.footer-area {
  height: var(--chat-footer-height);
  position: relative;
}

.footer-area .vscode-textarea {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.footer-area #chat-tool {
  position: absolute;
  width: 100%;
  bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.footer-area .prompt-area {
  height: var(--chat-footer-height);
}

.footer-area .prompt-code {
  position: absolute;
  width: calc(100% - 36px);
  bottom: 108px;
  height: 200px;
  overflow-y: auto;
  padding: 4px;
  border-radius: 4px;
}

</style>