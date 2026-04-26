<template>
  <div class="markdown-body">
    <div v-html="renderedContent"></div>
  </div>
</template>

<script setup lang="ts">
import { cleanHtml, renderMarkdown } from '@/utils/markdown';
import { onMounted, ref, watch } from 'vue';

const props = defineProps({
  content: {
    default: '',
  },
  mode:{
    default: 'thin' as 'thin' | 'full',
  }
});

const renderedContent = ref('');

const renderContent = async () => {
  if (!props.content) {
    renderedContent.value = '';
    return;
  }
  try {
    renderedContent.value = await renderMarkdown(props.content, props.mode);  
  } catch (error) {
    console.error('Markdown rendering error:', error);
    renderedContent.value = cleanHtml(props.content);
  }
};

watch(
  () => props.content,
  () => {
    renderContent();
  },
);

onMounted(() => {
  renderContent();
});
</script>
