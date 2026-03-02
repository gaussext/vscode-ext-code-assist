<template>
  <div class="chat-container">
    <AppHeader
      :messages="messages"
      :conversations="conversations"
      :conversationId="conversationId"
      @update:conversationId="handleConversationChange"
      @create="getConversations"
      @delete="getConversations"
    />
    <AppBody :messages="messages" :promptCode="promptCode" :latestMessage="latestMessage" :loading="loading" />
    <AppFooter
      v-model="prompt"
      :promptCode="promptCode"
      :loading="loading"
      :models="models"
      :model="model"
      @update:model="onModelChange"
      @change="onSettingChange"
      @click="onButtonClick"
    />
  </div>
</template>

<script setup lang="ts">
import { firstElement, getJsonSafe, queueAsync } from '@/utils';
import { onMounted, onUnmounted, ref, unref } from 'vue';
import { chatService, type ChatVendor } from './api';
import AppBody from './components/AppBody.vue';
import AppFooter from './components/AppFooter.vue';
import AppHeader from './components/AppHeader.vue';
import { ChatConversation, ChatMessage } from './models/Model';
import setting, { ChatModel, type IModel } from './setting';
import store from './store/index';
import type { IMessage } from './types';
import { EnumTemperature } from './models/Temperature';

const STORE_KEY_MODEL = 'code-assist.model';
const STORE_KEY_CONV = 'code-assist.conversation';

const conversationId = ref(localStorage.getItem(STORE_KEY_CONV) || '');
const latestMessage = ref(new ChatMessage('assistant'));
const messages = ref<ChatMessage[]>([]);
const loading = ref(false);
const prompt = ref('');
const promptCode = ref('');
const conversations = ref<ChatConversation[]>([]);
const models = ref<IModel[]>([]);
const model = ref<IModel>(new ChatModel());

const onSettingChange = async () => {
  getModels();
};

const getModels = async () => {
  const res = await chatService.getModels();
  models.value = res;
  // check current model in models
  if (!res.find((item) => item.value === model.value.value)) {
    model.value = firstElement(res);
  }
  return res;
};

const onModelChange = (value: IModel) => {
  model.value = value;
};

const getConversations = async () => {
  const convs = await store.getConversations();
  conversations.value = [...convs];
  if (!conversationId.value && firstElement(convs).id) {
    conversationId.value = firstElement(convs).id;
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
  setting.temperature = EnumTemperature.CodeAndMath;
  switch (type) {
    case 'optimization':
      handleOptimization(text);
      break;
    case 'explanation':
      handleExplanation(text);
      break;
    case 'comment':
      handleComment(text);
      break;
    case 'upgrade-class':
      handleUpgradeClass(text);
      break;
    case 'upgrade-vue':
      handleUpgradeVue(text);
      break;
    case 'upgrade-react':
      handleUpgradeReact(text);
      break;
    case 'analysis':
      setting.temperature = EnumTemperature.DataAnalysis;
      handleAnalysis(text);
      break;
    case 'translation':
      setting.temperature = EnumTemperature.Translation;
      handleTranslation(text);
      break;
    case 'appreciation':
      setting.temperature = EnumTemperature.CreativeWriting;
      handleAppreciation(text);
      break;
    case 'add-to-chat': {
      handleAddToChat(text);
    }
  }
};

const enqueue = async (value: IMessage) => {
  queueAsync(value, (result) => {
    switch (result.type) {
      case 'delta':
        handleChating(result.delta);
        break;
      case 'end':
        handleChatEnd(result.startTime, result.endTime);
        break;
    }
  });
};

// 等待 AI 回复
const handleChatRequest = async (vendorId: ChatVendor, modelId: string, content: string, messages: ChatMessage[]) => {
  loading.value = true;
  const startTime = Date.now();
  try {
    latestMessage.value.vendor = vendorId;
    latestMessage.value.model = modelId;
    latestMessage.value.content = '...';
    await chatService.chat(
      {
        vendor: vendorId,
        model: modelId,
        content: content,
        messages: messages,
      },
      (delta: string) => {
        enqueue({ type: 'delta', delta });
      },
      () => {
        const endTime = Date.now();
        enqueue({ type: 'end', startTime, endTime });
      }
    );
  } catch (error: any) {
    enqueue({ type: 'delta', delta: '请求失败: ' + error.message });
    const endTime = Date.now();
    enqueue({ type: 'end', startTime, endTime });
  }
};

const handleChating = (delta: string) => {
  if (latestMessage.value.content === '...') {
    latestMessage.value.content = '';
  }
  latestMessage.value.content += delta;
};

// AI 结束回答
const handleChatEnd = (startTime: number, endTime) => {
  loading.value = false;
  const message = new ChatMessage('assistant');
  message.vendor = latestMessage.value.vendor;
  message.model = latestMessage.value.model;
  message.content = latestMessage.value.content;
  message.startTime = startTime;
  message.timestamp = endTime;
  messages.value = [...messages.value, message];
  store.setMessagesById(conversationId.value, unref(messages));
};

const handleOptimization = (code: string) => {
  if (!code) return;
  prompt.value = `优化一下这段代码`;

  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleExplanation = (code: string) => {
  if (!code) return;
  prompt.value = `解释一下这段代码`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleComment = (code: string) => {
  if (!code) return;
  prompt.value = `给下面这段代码补充注释`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleUpgradeClass = (code: string) => {
  if (!code) return;
  prompt.value = `将以下代码转换为 ES6 Class 语法，请确保转换后的代码符合 ES6 语法规范，并且能够正常运行。只要回答代码部分，不要有多余的文字，代码如下：`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleUpgradeVue = (code: string) => {
  if (!code) return;
  prompt.value = `将以下代码转换为 Vue 3 的 Composition API 组件，请确保转换后的代码符合 Vue 3 的 Composition API 规范，并且能够正常运行。只要回答js/ts代码部分，不要有多余的文字，代码如下：`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleUpgradeReact = (code: string) => {
  if (!code) return;
  prompt.value = `将以下代码转换为 React.FC 组件，请确保转换后的代码符合 ES6 语法规范，并且能够正常运行。只要回答代码部分，不要有多余的文字，代码如下：`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleAnalysis = (code: string) => {
  if (!code) return;
  setting.temperature = EnumTemperature.DataAnalysis;
  prompt.value = `分析一下这段数据`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleTranslation = (code: string) => {
  if (!code) return;
  prompt.value = `将以下代码翻译成中文`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleAppreciation = (code: string) => {
  if (!code) return;
  prompt.value = `鉴赏或者评价一下这段文字`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleAddToChat = (code: string) => {
  if (!code) return;
  prompt.value = ``;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
};

// 发送消息
const onButtonClick = async () => {
  const content = prompt.value + promptCode.value;
  if (loading.value) {
    await chatService.stop(model.value.vendor);
    loading.value = false;
    return;
  }
  if (!model.value) {
    return;
  }
  if (!prompt.value.trim()) {
    return;
  }
  prompt.value = '';
  promptCode.value = '';
  await store.updateConversationTitle(conversationId.value, content);
  await getConversations();
  const message = new ChatMessage('user');
  message.content = content;
  messages.value = [...messages.value, message];
  let requestMessages = [] as ChatMessage[];
  if (setting.mode === 'session') {
    requestMessages = [...messages.value, message];
  } else {
    requestMessages = [message];
  }
  store.setMessagesById(conversationId.value, unref(messages));
  handleChatRequest(model.value.vendor, model.value.value, content, requestMessages);
};

// 会话变更处理
const handleConversationChange = (id: string) => {
  localStorage.setItem(STORE_KEY_CONV, id);
  conversationId.value = id;
  messages.value = [];
  loadMessages();
};

onMounted(async () => {
  window.addEventListener('message', handleWindowMessage);
  getModels();
  await getConversations();
  loadMessages();
});

onUnmounted(() => {
  window.removeEventListener('message', handleWindowMessage);
});
</script>
