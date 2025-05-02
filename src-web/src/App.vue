<template>
  <div class="chat-container">
    <AppHeader
      :modelId="modelId"
      :conversation-id="conversationId"
      @update:modelId="handleModelChange"
      @update:conversationId="handleConversationChange"
    />
    <AppBody
      :messages="messages"
      :latestMessage="latestMessage"
      :loading="loading"
    />
    <AppFooter v-model="prompt" :loading="loading" @click="onButtonClick" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, unref } from "vue";
import AppBody from "./components/AppBody.vue";
import AppFooter from "./components/AppFooter.vue";
import AppHeader from "./components/AppHeader.vue";
import { ChatMessage, event } from "./models/Model";
import store from "./store/index";
import { ollamaService } from "./api";

const modelId = ref(localStorage.getItem("code-assist.modelId") || "");
const conversationId = ref(
  localStorage.getItem("code-assist.conversationId") || ""
);
const latestMessage = ref(new ChatMessage("assistant"));
const loading = ref(false);
const messages = ref<ChatMessage[]>([]);
const prompt = ref("");
// 加载消息
const loadMessages = async () => {
  const loadedMessages = await store.getMessagesById(conversationId.value);
  messages.value = loadedMessages;
};

// 监听会话ID变化
watch(conversationId, () => {
  loadMessages();
});

// 处理窗口消息
const handleWindowMessage = (e: MessageEvent) => {
  const { type, text } = e.data;
  switch (type) {
    case "optimization":
      handleOptimization(text);
      break;
    case "explanation":
      handleExplanation(text);
      break;
  }
};

// 等待 AI 回复
const handleChatRequest = async (
  modelId: string,
  content: string,
  messages: ChatMessage[]
) => {
  loading.value = true;
  latestMessage.value.content = "...";
  await ollamaService.chat(
    {
      model: modelId,
      content: content,
      messages: messages,
    },
    (text: string) => {
      if (latestMessage.value.content === "...") {
        latestMessage.value.content = "";
      }
      const json = JSON.parse(text);
      const delta = json.message.content;
      latestMessage.value.content += delta;
    }
  );
  handleChatEnd();
};

// AI 结束回答
const handleChatEnd = () => {
  loading.value = false;
  const message = new ChatMessage("assistant");
  message.content = latestMessage.value.content;
  messages.value = [...messages.value, message];
  store.setMessagesById(conversationId.value, unref(messages));
};

const handleOptimization = (code: string) => {
  if (!code) return;
  prompt.value = `优化一下这段代码
\`\`\`
${code}
\`\`\``;
  onButtonClick();
};

const handleExplanation = (code: string) => {
  if (!code) return;
  prompt.value = `解释一下这段代码
\`\`\`
${code}
\`\`\``;
  onButtonClick();
};

// 发送消息
const onButtonClick = async () => {
  const content = prompt.value;
  if (!prompt.value.trim()) {
    return;
  }
  if (loading.value) {
    event.stop();
    return;
  }
  prompt.value = "";
  await store.updateConversationTitle(conversationId.value, content);
  const message = new ChatMessage("user");
  message.content = content;
  messages.value = [...messages.value, message];
  store.setMessagesById(conversationId.value, unref(messages));
  handleChatRequest(modelId.value, content, messages.value);
};

// 模型变更处理
const handleModelChange = (id: string) => {
  localStorage.setItem("code-assist.modelId", id);
  modelId.value = id;
};

// 会话变更处理
const handleConversationChange = (id: string) => {
  conversationId.value = id;
  messages.value = [];
  localStorage.setItem("code-assist.conversationId", id);
};

onMounted(() => {
  window.addEventListener("message", handleWindowMessage);
  loadMessages();
});

onUnmounted(() => {
  window.removeEventListener("message", handleWindowMessage);
});
</script>
