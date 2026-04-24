<template>
  <div id="messages" class="app-body messages-area" :class="{ 'has-code': promptCode }">
    <div
      v-for="message in messages"
      :key="message.id"
      :class="['message', message.role === 'assistant' ? 'message-ai' : '']"
    >
      <div v-if="message.role === 'assistant'">
        <div style="margin-bottom: 8px">
          <span>{{ message.model }}</span>
        </div>
        <Markdown :content="message.content" />
        <div style="margin-top: 4px; display: flex; align-items: center">
          <a class="link-copy copy-markdown" @click="copyToClipboard(message.content)">复制 Markdown</a>
          <MessageInfo v-if="message.role === 'assistant'" :message="message" />
        </div>
      </div>
      <div v-else>
        <div style="display: flex; justify-content: flex-end; margin-bottom: 8px">
          <span>You</span>
        </div>
        <div style="display: flex; justify-content: flex-end; width: 100%">
          <div class="message-you">
            <Markdown :content="message.content" />
          </div>
        </div>
      </div>
    </div>
    <div
      v-show="loading && currentMessage.content"
      :key="currentMessage.id"
      :class="['message', currentMessage.role === 'assistant' ? 'message-ai' : 'message-you']"
    >
      <div style="margin-bottom: 8px">
        <span>{{ currentMessage.model }}</span>
      </div>
      <div ref="currentMessageRef"></div>
    </div>
    <div ref="messagesEndRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ChatMessage } from '@/models/Model';
import { copyToClipboard } from '@/utils';
import { onMounted, ref, watch } from 'vue';
import MessageInfo from '@/components/MessageInfo.vue';
import { marked } from '@/utils/marked';
import Markdown from '@/components/Markdown.vue';

const props = defineProps<{
  messages: ChatMessage[];
  currentMessage: ChatMessage;
  loading: boolean;
  promptCode: string;
}>();

const messagesEndRef = ref<HTMLDivElement | null>(null);
const currentMessageRef = ref<HTMLDivElement | null>(null);

// 滚动到底部
const scrollToBottom = () => {
  setTimeout(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' });
  });
};

watch(
  () => props.currentMessage,
  async () => {
    if (currentMessageRef.value && props.currentMessage.content) {
      const result = await marked.parse(props.currentMessage.content);
      currentMessageRef.value.innerHTML = result;
    }
  },
  {
    deep: true,
    immediate: true,
  }
);

watch(
  () => props.messages,
  () => {
    // 每次添加消息，滑动滚动条
    scrollToBottom();
  }
);

onMounted(() => {
  scrollToBottom();
});
</script>
