<template>
  <div class="chat-container">
    <AppHeader :messages="messages" @update:conversationId="handleConversationChange" />
    <AppBody :messages="messages" :promptCode="promptCode" :latestMessage="latestMessage" :loading="loading" />
    <AppFooter v-model="prompt" :promptCode="promptCode" :loading="loading" @click="onButtonClick" />
  </div>
</template>

<script setup lang="ts">
import { queueAsync } from '@/utils';
import { onMounted, onUnmounted, ref, unref } from 'vue';
import { chatService } from '../api';
import AppBody from '../components/AppBody.vue';
import AppFooter from '../components/AppFooter.vue';
import AppHeader from '../components/AppHeader.vue';
import { EnumTemperature, ChatMessage } from '../models/Model';
import { useSettingStore } from '../stores/setting';
import { useConversationStore } from '../stores/conversation';
import { useMessageStore } from '../stores/message';
import type { IMessage } from '../types';

const settingStore = useSettingStore();
const conversationStore = useConversationStore();
const messageStore = useMessageStore();

const STORE_KEY_CONV = 'code-assist.conversation';
const conversationId = ref(conversationStore.conversationId || '');
const latestMessage = ref(new ChatMessage('assistant', conversationId.value));
const messages = ref<ChatMessage[]>([]);
const loading = ref(false);
const prompt = ref('');
const promptCode = ref('');

// 加载消息
const loadMessages = async () => {
  const loadedMessages = await messageStore.getMessagesById(conversationId.value);
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
        handleChating(result);
        break;
      case 'end':
        handleChatEnd(result);
        break;
      default:
        break;
    }
  });
};

// 等待 AI 回复
const handleChatRequest = async (messages: ChatMessage[]) => {
  loading.value = true;
  // 记录当前对话ID
  const currentConversationId = conversationId.value;
  const startTime = Date.now();
  try {
    latestMessage.value = new ChatMessage('assistant', currentConversationId);
    latestMessage.value.model = settingStore.currentModel.id;
    latestMessage.value.content = '...';
    await chatService.chat(
      {
        baseURL: settingStore.currentProvider.baseURL,
        apiKey: settingStore.currentProvider.apiKey,
        model: settingStore.currentModel.id,
        messages: messages.map(item => ({ role: item.role, content: item.content })),
      },
      (delta: string) => {
        enqueue({ conversationId: currentConversationId, type: 'delta', delta });
      },
      () => {
        const endTime = Date.now();
        enqueue({ conversationId: currentConversationId, type: 'end', startTime, endTime });
      }
    );
  } catch (error: any) {
    enqueue({ conversationId: currentConversationId, type: 'delta', delta: '请求失败: ' + error.message });
    const endTime = Date.now();
    enqueue({ conversationId: currentConversationId, type: 'end', startTime, endTime });
  }
};

const handleChating = (result: IMessage) => {
  if (latestMessage.value.content === '...') {
    latestMessage.value.content = '';
  }
  if (result.conversationId === latestMessage.value.conversationId) {
    latestMessage.value.content += result.delta;
  }
};

// AI 结束回答
const handleChatEnd = (result: IMessage) => {
  loading.value = false;
  const message = new ChatMessage('assistant', conversationId.value);
  message.model = latestMessage.value.model;
  message.content = latestMessage.value.content;
  message.startTime = result.startTime;
  message.timestamp = result.endTime;
  messages.value = [...messages.value, message];
  // 保存消息
  messageStore.setMessagesById(result.conversationId, unref(messages));
  const conversation = conversationStore.getConversationById(result.conversationId);
  if (conversation && !conversation.isSummary) {
    handleSummary(result.conversationId, messages.value);
  }
};

const handleSummary = (conversationId: string, messages: ChatMessage[]) => {
  chatService.summary({
    baseURL: settingStore.currentProvider.baseURL,
    apiKey: settingStore.currentProvider.apiKey,
    model: settingStore.currentModel.id,
    messages: messages.map(item => ({ role: item.role, content: item.content })),
  }).then((result) => {
    const summary = result?.choices?.[0]?.message?.content || '';
    if (summary) {
      conversationStore.updateConversationTitle(conversationId, summary);
    }
  });
};

const handleOptimization = (code: string) => {
  if (!code) { return; }
  prompt.value = `完善或优化一下这段代码`;

  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleExplanation = (code: string) => {
  if (!code) { return; }
  prompt.value = `解释一下这段代码的作用`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleComment = (code: string) => {
  if (!code) { return; }
  prompt.value = `给下面这段代码补充注释`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleUpgradeClass = (code: string) => {
  if (!code) { return; }
  prompt.value = `将以下代码转换为 ES6 Class 语法，请确保转换后的代码符合 ES6 语法规范，并且能够正常运行。只要回答代码部分，不要有多余的文字，代码如下：`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleUpgradeVue = (code: string) => {
  if (!code) { return; }
  prompt.value = `将以下代码转换为 Vue 3 的 Composition API 组件，请确保转换后的代码符合 Vue 3 的 Composition API 规范，并且能够正常运行。只要回答js/ts代码部分，不要有多余的文字，代码如下：`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleUpgradeReact = (code: string) => {
  if (!code) { return; }
  prompt.value = `将以下代码转换为 React.FC 组件，请确保转换后的代码符合 ES6 语法规范，并且能够正常运行。只要回答代码部分，不要有多余的文字，代码如下：`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleAnalysis = (code: string) => {
  if (!code) { return; }
  settingStore.setTemperature(EnumTemperature.DataAnalysis);
  prompt.value = `分析一下这段数据`;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
  onButtonClick();
};

const handleTranslation = (code: string) => {
  if (!code) { return; }
  prompt.value = `对以下文本进行翻译，如果是中文则翻译成英文，如果是其他语言则翻译成中文`;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
  onButtonClick();
};

const handleAppreciation = (code: string) => {
  if (!code) { return; }
  prompt.value = `鉴赏或者评价一下这段文字`;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
  onButtonClick();
};

const handleAddToChat = (code: string) => {
  if (!code) { return; }
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
  const message = new ChatMessage('user', conversationId.value);
  message.content = content;
  messages.value = [...messages.value, message];
  const requestMessages = [...messages.value, message];
  messageStore.setMessagesById(conversationId.value, unref(messages));
  handleChatRequest(requestMessages);
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
  await conversationStore.getConversations();
  loadMessages();
});

onUnmounted(() => {
  window.removeEventListener('message', handleWindowMessage);
});
</script>