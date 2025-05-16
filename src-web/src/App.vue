<template>
  <div class="chat-container">
    <AppHeader
      :conversations="conversations"
      :vendorId="vendorId" :modelId="modelId" :conversationId="conversationId"
      @update:vendorId="handleVendorChange" @update:modelId="handleModelChange"
      @update:conversationId="handleConversationChange"
      @create="getConversations"
      @delete="getConversations" />
    <AppBody :messages="messages" :latestMessage="latestMessage" :loading="loading" />
    <AppFooter v-model="prompt" :loading="loading" @click="onButtonClick" />
  </div>
</template>

<script setup lang="ts">
import { firstElement } from "@/utils";
import { onMounted, onUnmounted, ref, unref } from "vue";
import { chatService, type ChatVendor } from "./api";
import AppBody from "./components/AppBody.vue";
import AppFooter from "./components/AppFooter.vue";
import AppHeader from "./components/AppHeader.vue";
import { ChatConversation, ChatMessage } from "./models/Model";
import store from "./store/index";

const KEY_VENDOR = "code-assist.vendor";
const KEY_MODEL = "code-assist.model";
const KEY_CONV = "code-assist.conversation";

const vendorId = ref(localStorage.getItem(KEY_VENDOR) as ChatVendor);
const modelId = ref(localStorage.getItem(KEY_MODEL) || "");
const conversationId = ref(localStorage.getItem(KEY_CONV) || "");

chatService.setVendor(vendorId.value);

const latestMessage = ref(new ChatMessage("assistant"));
const messages = ref<ChatMessage[]>([]);
const loading = ref(false);
const prompt = ref("");
const conversations = ref<ChatConversation[]>([]);

const getConversations = async () => {
  const convs = await store.getConversations();
  conversations.value = [...convs];
  if (!conversationId.value && firstElement(convs).id) {
    conversationId.value = firstElement(convs).id
  }
  return convs;
};

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
    case "comment":
      handleComment(text);
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
  const startTime = Date.now();
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
        handleChatEnd(startTime);
      }
    );
  } catch (error: any) {
    loading.value = false;
    handleChating('请求失败: ' + error.message)
    handleChatEnd(startTime);
  }
};

const handleChating = (delta: string) => {
  if (latestMessage.value.content === "...") {
    latestMessage.value.content = "";
  }

  latestMessage.value.content += delta;
}
// AI 结束回答
const handleChatEnd = (startTime: number) => {
  const message = new ChatMessage("assistant");
  message.content = latestMessage.value.content;
  message.startTime = startTime;
  messages.value = [...messages.value, message];
  store.setMessagesById(conversationId.value, unref(messages));
};

const handleOptimization = (code: string) => {
  if (!code) return;
  prompt.value = `优化一下这段代码
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleExplanation = (code: string) => {
  if (!code) return;
  prompt.value = `解释一下这段代码
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleComment = (code: string) => {
  if (!code) return;
  prompt.value = `给下面这段代码补充注释
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

// 发送消息
const onButtonClick = async () => {
  const content = prompt.value;
  if (loading.value) {
    chatService.stop();
    loading.value = false;
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
  await getConversations();
  const message = new ChatMessage("user");
  message.content = content;
  messages.value = [...messages.value, message];
  store.setMessagesById(conversationId.value, unref(messages));
  handleChatRequest(modelId.value, content, messages.value);
};

const handleVendorChange = (vendor: ChatVendor) => {
  localStorage.setItem(KEY_VENDOR, vendor);
  vendorId.value = vendor;
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

onMounted(async () => {
  window.addEventListener("message", handleWindowMessage);
  await getConversations()
  loadMessages();
});

onUnmounted(() => {
  window.removeEventListener("message", handleWindowMessage);
});
</script>
