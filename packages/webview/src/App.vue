<template>
  <div class="chat-container">
    <AppHeader
      :messages="messages"
      :conversations="conversations"
      :conversationId="conversationId"
      @update:conversationId="handleConversationChange"
      @create="getConversations"
      @delete="getConversations"
      @download="downloadConversation"
    />
    <AppBody :messages="messages" :promptCode="promptCode" :latestMessage="latestMessage" :loading="loading" />
    <AppFooter v-model="prompt" :promptCode="promptCode" :loading="loading" @click="onButtonClick" />
  </div>
</template>

<script setup lang="ts">
import { firstElement, queueAsync } from '@/utils';
import { onMounted, onUnmounted, ref, unref } from 'vue';
import { chatService } from './api';
import AppBody from './components/AppBody.vue';
import AppFooter from './components/AppFooter.vue';
import AppHeader from './components/AppHeader.vue';
import { ChatConversation, ChatMessage } from './models/Model';
import { useSettingStore } from './stores/setting';
import store from './store/index';
import type { IMessage } from './types';
import { EnumTemperature } from './models/Temperature';

const settingStore = useSettingStore();

const STORE_KEY_CONV = 'code-assist.conversation';
const conversationId = ref(localStorage.getItem(STORE_KEY_CONV) || '');
const latestMessage = ref(new ChatMessage('assistant'));
const messages = ref<ChatMessage[]>([]);
const loading = ref(false);
const prompt = ref('');
const promptCode = ref('');
const conversations = ref<ChatConversation[]>([]);

const getConversations = async () => {
  const convs = await store.getConversations();
  conversations.value = [...convs];
  if (!conversationId.value && firstElement(convs).id) {
    conversationId.value = firstElement(convs).id;
  }
  return convs;
};

const downloadConversation = async () => {
  await store.downloadConversation(conversationId.value);
};

// 加载消息
const loadMessages = async () => {
  const loadedMessages = await store.getMessagesById(conversationId.value);
  messages.value = loadedMessages;
};

// 处理窗口消息
const handleWindowMessage = (e: MessageEvent) => {
  const { type, text } = e.data;
  settingStore.setTemperature(EnumTemperature.CodeAndMath);
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
    case 'analysis': {
      settingStore.setTemperature(EnumTemperature.DataAnalysis);
      handleAnalysis(text);
      break;
    }
    case 'translation': {
      settingStore.setTemperature(EnumTemperature.Translation);
      handleTranslation(text);
      break;
    }
    case 'appreciation': {
      settingStore.setTemperature(EnumTemperature.CreativeWriting);
      handleAppreciation(text);
      break;
    }
    case 'add-to-chat': {
      handleAddToChat(text);
    }
    default:
      break;
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
      default:
        break;
    }
  });
};

// 等待 AI 回复
const handleChatRequest = async (content: string, messages: ChatMessage[]) => {
  loading.value = true;
  const startTime = Date.now();
  try {
    latestMessage.value.model = settingStore.config.openai_model;
    latestMessage.value.content = '...';
    await chatService.chat(
      {
        baseURL: settingStore.config.openai,
        apiKey: settingStore.config.openai_token,
        model: settingStore.config.openai_model,
        messages: messages.map(item => ({ role: item.role, content: item.content})),
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
  message.model = latestMessage.value.model;
  message.content = latestMessage.value.content;
  message.startTime = startTime;
  message.timestamp = endTime;
  messages.value = [...messages.value, message];
  // 保存消息
  store.setMessagesById(conversationId.value, unref(messages));
  // 使用最新消息更新会话标题
  store.updateConversationTitle(conversationId.value, message.content);
};

const handleOptimization = (code: string) => {
  if (!code) return;
  prompt.value = `完善或优化一下这段代码`;

  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleExplanation = (code: string) => {
  if (!code) return;
  prompt.value = `解释一下这段代码的作用`;
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
  settingStore.setTemperature(EnumTemperature.DataAnalysis);
  prompt.value = `分析一下这段数据`;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
  onButtonClick();
};

const handleTranslation = (code: string) => {
  if (!code) return;
  prompt.value = `对以下文本进行翻译，如果是中文则翻译成英文，如果是其他语言则翻译成中文`;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
  onButtonClick();
};

const handleAppreciation = (code: string) => {
  if (!code) return;
  prompt.value = `鉴赏或者评价一下这段文字`;
  promptCode.value = `
\`\`\`
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
    await chatService.stop();
    loading.value = false;
    return;
  }
  if (!prompt.value.trim()) {
    return;
  }
  prompt.value = '';
  promptCode.value = '';
  // 使用用户输入更新会话标题
  await store.updateConversationTitle(conversationId.value, content);
  await getConversations();
  const message = new ChatMessage('user');
  message.content = content;
  messages.value = [...messages.value, message];
  const requestMessages = [...messages.value, message];
  store.setMessagesById(conversationId.value, unref(messages));
  handleChatRequest(content, requestMessages);
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
  await getConversations();
  loadMessages();
});

onUnmounted(() => {
  window.removeEventListener('message', handleWindowMessage);
});
</script>
