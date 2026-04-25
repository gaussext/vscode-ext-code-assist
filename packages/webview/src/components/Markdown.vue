<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="markdown-render">
    <el-collapse v-if="message.reasoning" class="reasoning-content" expand-icon-position="left">
      <el-collapse-item title="Think">
        {{ message.reasoning }}
      </el-collapse-item>
    </el-collapse>
    <div v-if="renderedContent" class="markdown-content">
      <div v-html="renderedContent"></div>
    </div>
    <div v-if="message.role === 'assistant' && showInfo"
      style="margin-top: 4px; height: 24px; display: flex; align-items: center; gap: 8px;">
      <el-icon v-if="!copied" class="message-icon" @click="copyContent(message.content)">
        <CopyDocument />
      </el-icon>
      <el-icon v-else>
        <Check />
      </el-icon>
      <MessageInfo :message="message" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { copyToClipboard } from '@/utils';
import { renderMarkdown } from '@/utils/markdown';
import { ref, watch, onMounted, computed } from 'vue';
import { CopyDocument, Check } from '@element-plus/icons-vue';
import { ChatMessage } from '@/models/Model';

const props = defineProps({
  message: {
    type: Object,
    default: () => new ChatMessage('assistant', ''),
  },
  showInfo: {
    type: Boolean,
    default: true,
  },
});

const renderedContent = ref('');

const renderContent = async () => {
  if (!props.message.content) {
    renderedContent.value = '';
    return;
  }
  console.log('render', props.message.endTime);

  try {
    renderedContent.value = await renderMarkdown(props.message.content);
  } catch (error) {
    console.error('Markdown rendering error:', error);
    renderedContent.value = await renderMarkdown(props.message.content);
  }
};

const copied = ref(false);
const copyContent = async (content: string) => {
  await copyToClipboard(content);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 1000);
};

watch(
  () => props.message.endTime,
  () => {
    renderContent();
  },
  { immediate: true }
);

onMounted(() => {
  renderContent();
});
</script>

<style scoped>
.reasoning-content {
  margin-bottom: 16px;
}
</style>
