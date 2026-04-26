<template>
  <div ref="messagesAreaRef" class="chat-body messages-area" :class="{ 'has-code': promptCode }">
    <template v-for="message in messages" :key="message.id">
      <MessageUser v-if="message.role === 'user'" :message="message" />
      <MessageBot v-if="message.role === 'assistant'" :message="message" />
    </template>
    <MessageStream v-show="loading" :message="currentMessage" />
    <div ref="footerRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ChatMessage } from '@/models/Model';
import { onMounted, ref, watch } from 'vue';
import MessageUser from './MessageUser.vue';
import MessageBot from './MessageBot.vue';
import MessageStream from './MessageStream.vue';

const props = defineProps<{
  messages: ChatMessage[];
  currentMessage: ChatMessage;
  loading: boolean;
  promptCode: string;
}>();

const messagesAreaRef = ref<HTMLDivElement | null>(null);
const footerRef = ref<HTMLDivElement | null>(null);

// 滚动到底部
const scrollToBottom = () => {
  setTimeout(() => {
    footerRef.value?.scrollIntoView({ behavior: 'auto' });
  });
};

const tryScrollToBottom = () => {
  const scrollTop = messagesAreaRef.value?.scrollTop || 0;
  const scrollHeight = messagesAreaRef.value?.scrollHeight || 0;
  const clientHeight = messagesAreaRef.value?.clientHeight || 0;
  const isBottom = Math.abs((scrollTop + clientHeight) - scrollHeight) < 100;
  if (isBottom) {
    footerRef.value?.scrollIntoView({ behavior: 'smooth' });
  }
};

watch(
  () => props.messages,
  (newVal) => {
    const latestMessage = newVal[newVal.length - 1];
    if (latestMessage && latestMessage.role === 'user') {
      scrollToBottom();
    } else {
      tryScrollToBottom();
    }
  }
);

watch(
  () => props.currentMessage,
  () => {
    tryScrollToBottom();
  }
);

onMounted(() => {
  scrollToBottom();
});
</script>

<style lang="scss">
.messages-area {
  margin-top: 8px;
  margin-bottom: 8px;
  padding: 4px 8px 8px 0;
  border-radius: 4px;
  height: var(--chat-body-height);
  overflow-y: auto;

  .chat-message {
    margin-bottom: 16px;
  }

  &.has-code {
    height: calc(var(--chat-body-height) - var(--chat-prompt-height));
  }
}

.messages-area  .messgae-user .markdown-content {
  background-color: var(--vscode-editor-background);
  padding: 8px;
  border-radius: 8px;
}
</style>