<template>
  <div class="chat-message messgae-user">
    <div class="message-title">
      <span>You</span>
    </div>
    <div class="message-content">
      <div class="markdown-content">
        <Markdown :content="message.content" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatMessage } from '@/models/Model';
import Markdown from '@/components/Markdown.vue';

const props = defineProps({
  message: {
    type: Object,
    default: () => new ChatMessage('user', ''),
  },
});
</script>

<style scoped>


.message-title {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px
}

.message-content {
  display: flex;
  justify-content: flex-end;
}

.markdown-content {
  max-width: 100%;
}
</style>