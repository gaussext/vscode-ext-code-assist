<template>
  <div class="markdown-body">
    <div v-html="renderedContent"></div>
  </div>
</template>

<script setup lang="ts">
import { renderMarkdown } from '@/utils/markdown';
import { onMounted, ref, watch } from 'vue';

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
});

const renderedContent = ref('');

const renderContent = async () => {
  if (!props.content) {
    renderedContent.value = '';
    return;
  }
  try {
    renderedContent.value = await renderMarkdown(props.content);  
  } catch (error) {
    console.error('Markdown rendering error:', error);
    renderedContent.value = await renderMarkdown(props.content);
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
