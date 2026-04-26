<template>
  <div class="chat-message message-stream">
    <div class="message-title">
      <span>Bot</span>
    </div>
    <el-collapse v-if="message.reasoning" class="reasoning-content" expand-icon-position="left" is-active>
      <el-collapse-item title="Think">
        {{ message.reasoning }}
      </el-collapse-item>
    </el-collapse>
    <div v-if="message.content" class="markdown-content">
      <Markdown :content="message.content" />
    </div>
    <div class="footer-content"></div>
  </div>
</template>

<script setup lang="ts">
import Markdown from '@/components/Markdown.vue';
import { ChatMessage } from '@/models/Message';

const props = defineProps({
  message: {
    type: Object,
    default: () => new ChatMessage('assistant', ''),
  },
});
</script>

<style lang="scss" scoped>
.message-title {
  margin-bottom: 8px;
}

.reasoning-content {
  margin-bottom: 16px;
}

.footer-content {
  margin-top: 4px;
  height: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
