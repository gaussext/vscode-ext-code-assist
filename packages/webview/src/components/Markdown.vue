<template>
  <div class="markdown-render">
    <el-collapse v-if="reasoning" expand-icon-position="left">
      <el-collapse-item title="Think">
        {{ reasoning }}
      </el-collapse-item>
    </el-collapse>
    <div v-if="renderedContent" class="markdown-content">
      <div v-html="renderedContent"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { renderMarkdown } from '@/utils/markdown';
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
  reasoning: {
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
  () => props.reasoning,
  () => {
    renderContent();
  },
  { immediate: true }
);

watch(
  () => props.content,
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
