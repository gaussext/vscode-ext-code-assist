<template>
  <div class="chat-container">
    <AppHeader :vendorId="vendorId" :modelId="modelId" :conversationId="conversationId"
      @update:vendorId="handleVendorChange" @update:modelId="handleModelChange"
      @update:conversationId="handleConversationChange" />
    <AppBody :messages="messages" :latestMessage="latestMessage" :loading="loading" />
    <AppFooter v-model="prompt" :loading="loading" @click="onButtonClick" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, unref } from "vue";
import AppBody from "./components/AppBody.vue";
import AppFooter from "./components/AppFooter.vue";
import AppHeader from "./components/AppHeader.vue";
import { ChatMessage } from "./models/Model";
import store from "./store/index";
import { chatService, type ChatVendor } from "./api";

const KEY_VENDOR = "code-assist.vendor";
const KEY_MODEL = "code-assist.model";
const KEY_CONV = "code-assist.conversation";

const vendorId = ref(localStorage.getItem(KEY_VENDOR) || "ollama");
const modelId = ref(localStorage.getItem(KEY_MODEL) || "");
const conversationId = ref(localStorage.getItem(KEY_CONV) || "");

const latestMessage = ref(new ChatMessage("assistant"));
const loading = ref(false);
const messages = ref<ChatMessage[]>([]);
const prompt = ref("");
// 加载消息
const loadMessages = async () => {
  const loadedMessages = await store.getMessagesById(conversationId.value);
  messages.value = loadedMessages;
};

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
  try {
    latestMessage.value.content = "...";
    await chatService.chat(
      {
        model: modelId,
        content: content,
        messages: messages,
      },
      (delta: string) => {
        handleChating(delta)
      },
      () => {
        loading.value = false;
        handleChatEnd();      
      }
    );
  } catch (error: any) {
    loading.value = false;
  }
};

const handleChating = (delta: string) => {
  if (latestMessage.value.content === "...") {
    latestMessage.value.content = "";
  }

  latestMessage.value.content += delta;
}
// AI 结束回答
const handleChatEnd = () => {
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
  if (loading.value) {
    chatService.stop();
    return;
  }
  if (!modelId.value) {
    return;
  }
  if (!prompt.value.trim()) {
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

const handleVendorChange = (vendor: ChatVendor) => {
  localStorage.setItem(KEY_VENDOR, vendor);
  vendorId.value = vendor;
  chatService.setVendor(vendor);
};

// 模型变更处理
const handleModelChange = (id: string) => {
  localStorage.setItem(KEY_MODEL, id);
  modelId.value = id;
};

// 会话变更处理
const handleConversationChange = (id: string) => {
  localStorage.setItem(KEY_CONV, id);
  conversationId.value = id;
  messages.value = [];
  loadMessages();
};

onMounted(() => {
  window.addEventListener("message", handleWindowMessage);
  loadMessages();
});

onUnmounted(() => {
  window.removeEventListener("message", handleWindowMessage);
});
</script>
