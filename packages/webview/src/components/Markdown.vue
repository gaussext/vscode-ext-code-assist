<template>
  <div v-if="renderedContent" class="markdown-content">
    <div v-html="renderedContent"></div>
  </div>
  <div v-else-if="loading" class="loading">
    渲染中...
  </div>
  <div v-else class="empty">
    无内容
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { marked } from '@/utils/marked';

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
});

const renderedContent = ref('');
const loading = ref(false);

const renderMarkdown = async () => {
  if (!props.content) {
    renderedContent.value = '';
    return;
  }
  
  loading.value = true;
  try {
    const result = await marked.parse(props.content);
    renderedContent.value = result;
  } catch (error) {
    console.error('Markdown rendering error:', error);
    renderedContent.value = props.content;
  } finally {
    loading.value = false;
  }
};

watch(() => props.content, () => {
  renderMarkdown();
}, { immediate: true });

onMounted(() => {
  renderMarkdown();
});
</script>

<style scoped>
.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.empty {
  text-align: center;
  padding: 20px;
  color: #999;
}
</style>