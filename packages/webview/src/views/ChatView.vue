<template>
  <div class="chat-container">
    <ChatHeader :messages="currentMessageList" :loading="loading" @update:conversationId="handleConversationChange" />
    <ChatBody :messages="currentMessageList" :promptCode="promptCode" :currentMessage="currentMessage"
      :loading="loading" />
    <ChatFooter v-model="prompt" :promptCode="promptCode" :loading="loading" @click="onButtonClick" />
  </div>
</template>

<script setup lang="ts">
import { queueAsync } from '@/utils';
import { onMounted, onUnmounted, ref, unref } from 'vue';
import { chatService } from '../api';
import ChatBody from './components/ChatBody.vue';
import ChatFooter from './components/ChatFooter.vue';
import ChatHeader from './components/ChatHeader.vue';
import { EnumTemperature, ChatMessage } from '../models/Model';
import { useSettingStore } from '@/stores/setting';
import { useConversationStore } from '@/stores/conversation';
import { useMessageStore } from '@/stores/message';
import { useMessageLatestStore } from '@/stores/message-latest';
import type { IMessage, IChunk } from '../types';

const settingStore = useSettingStore();
const conversationStore = useConversationStore();
const messageStore = useMessageStore();
const messageLatestStore = useMessageLatestStore();

// 获取最新的消息
const currentMessage = ref<ChatMessage>(messageLatestStore.getLatestMessageByConvId(conversationStore.conversationId));
const currentMessageList = ref<ChatMessage[]>([]);
const loading = ref(false);
const prompt = ref('');
const promptCode = ref('');

// 加载消息
const loadMessages = async () => {
  currentMessage.value = messageLatestStore.getLatestMessageByConvId(conversationStore.conversationId);
  const loadedMessages = await messageStore.getMessagesById(conversationStore.conversationId);
  currentMessageList.value = loadedMessages;
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
      case 'content':
      case 'reasoning':
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
  const currentConversationId = conversationStore.conversationId;
  messageLatestStore.deleteLatestMessageByConvId(currentConversationId);
  currentMessage.value = messageLatestStore.getLatestMessageByConvId(currentConversationId);
  currentMessage.value.model = settingStore.currentModel.id;
  const startTime = Date.now();
  let loadTime = 0;
  try {
    await chatService.chat(
      {
        baseURL: settingStore.currentProvider.baseURL,
        apiKey: settingStore.currentProvider.apiKey,
        model: settingStore.currentModel.id,
        messages: messages.map((item) => ({ role: item.role, content: item.content })),
      },
      (chunk: IChunk) => {
        if (!loadTime) {
          loadTime = Date.now();
        }
        const endTime = Date.now();
        enqueue({ conversationId: currentConversationId, type: chunk.type, data: chunk.data, startTime, loadTime, endTime });
      },
      () => {
        if (!loadTime) {
          loadTime = Date.now();
        }
        const endTime = Date.now();
        enqueue({ conversationId: currentConversationId, type: 'end', startTime, loadTime, endTime });
      }
    );
  } catch (error: any) {
    if (!loadTime) {
      loadTime = Date.now();
    }
    const endTime = Date.now();
    enqueue({
      conversationId: currentConversationId,
      type: 'error',
      data: 'Request failed: ' + error.message,
      startTime,
      loadTime,
      endTime,
    });
    enqueue({ conversationId: currentConversationId, type: 'end', startTime, loadTime, endTime });
  }
};

const handleChating = (result: IMessage) => {
  // 跨页面更新消息
  const botMessage = messageLatestStore.getLatestMessageByConvId(result.conversationId);
  if (result.type === 'reasoning') {
    console.log('reasoning');
    botMessage.reasoning += result.data || '';
  }
  if (result.type === 'content') {
    console.log('content');
    botMessage.content += result.data || '';
  }
  // 当前页面更新消息
  if (currentMessage.value.conversationId === result.conversationId) {
    currentMessage.value.content = botMessage.content;
    currentMessage.value.reasoning = botMessage.reasoning;
  }
};

// AI 结束回答
const handleChatEnd = async (result: IMessage) => {
  loading.value = false;
  // 跨页面更新最新消息
  const botMessage = messageLatestStore.getLatestMessageByConvId(result.conversationId);
  botMessage.startTime = result.startTime;
  botMessage.loadTime = result.loadTime;
  botMessage.endTime = result.endTime;
  // 跨页面更新会话
  let messages = await messageStore.getMessagesById(result.conversationId);
  messages = [...messages, botMessage];
  // 跨页面保存消息列表
  messageStore.setMessagesById(result.conversationId, messages);
  // 更新当前页面消息列表
  if (conversationStore.conversationId === result.conversationId) {
    currentMessageList.value = messages;
  }
  // 
  currentMessage.value = messageLatestStore.getLatestMessageByConvId(conversationStore.conversationId);
  if (currentMessage.value.conversationId === result.conversationId) {
    currentMessage.value.content = botMessage.content;
    currentMessage.value.reasoning = botMessage.reasoning;
  }
  // 生成摘要
  const conversation = await conversationStore.getConversationById(result.conversationId);
  if (conversation && !conversation.isSummary) {
    await handleSummary(result.conversationId, messages);
  }
  // 删除消息
  messageLatestStore.deleteLatestMessageByConvId(result.conversationId);
};

const handleSummary = (conversationId: string, messages: ChatMessage[]) => {
  return chatService
    .summary({
      baseURL: settingStore.currentProvider.baseURL,
      apiKey: settingStore.currentProvider.apiKey,
      model: settingStore.currentModel.id,
      messages: messages.map((item) => ({ role: item.role, content: item.content })),
    })
    .then((result) => {
      const summary = result?.choices?.[0]?.message?.content || '';
      if (summary) {
        // 更新会话标题
        conversationStore.updateConversationTitle(conversationId, summary);
      }
    });
};

const handleOptimization = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = `完善或优化一下这段代码`;

  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleExplanation = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = `解释一下这段代码的作用`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleComment = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = `给下面这段代码补充注释`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleUpgradeClass = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = `将以下代码转换为 ES6 Class 语法，请确保转换后的代码符合 ES6 语法规范，并且能够正常运行。只要回答代码部分，不要有多余的文字，代码如下：`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleUpgradeVue = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = `将以下代码转换为 Vue 3 的 Composition API 组件，请确保转换后的代码符合 Vue 3 的 Composition API 规范，并且能够正常运行。只要回答js/ts代码部分，不要有多余的文字，代码如下：`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleUpgradeReact = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = `将以下代码转换为 React.FC 组件，请确保转换后的代码符合 ES6 语法规范，并且能够正常运行。只要回答代码部分，不要有多余的文字，代码如下：`;
  promptCode.value = `
\`\`\`typescript
${code}
\`\`\``;
  onButtonClick();
};

const handleAnalysis = (code: string) => {
  if (!code) {
    return;
  }
  settingStore.setTemperature(EnumTemperature.DataAnalysis);
  prompt.value = `分析一下这段数据`;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
  onButtonClick();
};

const handleTranslation = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = `对以下文本进行翻译，如果是中文则翻译成英文，如果是其他语言则翻译成中文`;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
  onButtonClick();
};

const handleAppreciation = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = `鉴赏或者评价一下这段文字`;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
  onButtonClick();
};

const handleAddToChat = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = ``;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
};

// 发送消息
const onButtonClick = async () => {
  const currentConversationId = conversationStore.conversationId;
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
  const userMessage = new ChatMessage('user', currentConversationId);
  userMessage.content = content;
  currentMessageList.value = [...currentMessageList.value, userMessage];
  const requestMessages = [...currentMessageList.value, userMessage];
  messageStore.setMessagesById(currentConversationId, unref(currentMessageList));
  handleChatRequest(requestMessages);
};

// 会话变更处理
const handleConversationChange = () => {
  currentMessageList.value = [];
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
