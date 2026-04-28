<template>
  <div class="chat-container" :class="{ 'has-code': promptCode }">
    <ChatHeader :messages="currentMessageList" :loading="loading" @update:conversationId="handleConversationChange" />
    <ChatBody :messages="currentMessageList" :promptCode="promptCode" :currentMessage="currentMessage"
      :loading="loading" />
    <ChatFooter v-model="prompt" :promptCode="promptCode" :loading="loading" @code="onCodeButtonCLick"
      @send="onSendButtonClick" />
  </div>
</template>

<script setup lang="ts">
import { useConversationStore } from '@/stores/useConversationStore';
import { useMessageLatestStore } from '@/stores/useMessageLatestStore';
import { useMessageStore } from '@/stores/useMessageStore';
import { onMounted, onUnmounted, ref, unref } from 'vue';
import { chatService } from '../api';
import { ChatMessage } from '../models/Message';
import ChatBody from './components/ChatBody.vue';
import ChatFooter from './components/ChatFooter.vue';
import ChatHeader from './components/ChatHeader.vue';
import { useSettingStore } from '@/stores/useSettingStore';
import { QueueRender } from '@/utils/QueueRender';
import type { IChatChunkMerge } from '@/types';

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
let abortController: AbortController | null = null;

// 加载消息
const loadMessages = async () => {
  currentMessage.value = messageLatestStore.getLatestMessageByConvId(conversationStore.conversationId);
  const loadedMessages = await messageStore.getMessagesById(conversationStore.conversationId);
  currentMessageList.value = loadedMessages;
};

// 处理窗口消息
const handleWindowMessage = (e: MessageEvent) => {
  const { type, text } = e.data;
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
    case 'test':
      handleTest(text);
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
      handleAnalysis(text);
      break;
    }
    case 'translation': {
      handleTranslation(text);
      break;
    }
    case 'appreciation': {
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

let queueRender: QueueRender | null = null;

onUnmounted(() => {
  abortController?.abort();
  queueRender?.dispose();
});

const enqueue = async (value: IChatChunkMerge) => {
  queueRender?.queueAsync(value, (result) => {
    switch (result.type) {
      case 'content':
      case 'reasoning':
        handleChating(result);
        break;
      case 'end':
        {
          handleChatEnd(result);
          queueRender?.dispose();
        }
        break;
      default:
        break;
    }
  });
};

// 等待 AI 回复
const handleChatRequest = async (messages: ChatMessage[]) => {
  loading.value = true;
  abortController = new AbortController();
  queueRender = new QueueRender();
  // 获取当前模型参数
  const { baseURL, apiKey, model } = settingStore.getModelParams(settingStore.currentModelHash);
  // 记录当前对话ID
  const currentConversationId = conversationStore.conversationId;
  messageLatestStore.deleteLatestMessageByConvId(currentConversationId);
  currentMessage.value = messageLatestStore.getLatestMessageByConvId(currentConversationId);
  currentMessage.value.model = model;
  const startTime = Date.now();
  let loadTime = 0;
  try {
    const stream = chatService.chatStream(
      {
        baseURL,
        apiKey,
        model,
        messages: messages.map((item) => ({ role: item.role, content: item.content })),
      },
      abortController.signal
    );
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (!loadTime) {
        loadTime = Date.now();
      }
      if (done) {
        const endTime = Date.now();
        enqueue({ conversationId: currentConversationId, type: 'end', startTime, loadTime, endTime });
        break;
      }
      if (!loadTime) {
        loadTime = Date.now();
      }
      const endTime = Date.now();
      enqueue({
        conversationId: currentConversationId,
        type: value.type,
        data: value.data,
        startTime,
        loadTime,
        endTime,
      });
    }
  } catch (error: any) {
    queueRender?.dispose();
    if (!loadTime) {
      loadTime = Date.now();
    }
    const endTime = Date.now();
    enqueue({ conversationId: currentConversationId, type: 'end', startTime, loadTime, endTime });
    // 如果是主动取消，则不进行错误提示
    if (error.name === 'AbortError') {
      console.log('Chat request aborted');
    } else {
      console.error('Chat request error', error);
    }
  }
};

const handleChating = (result: IChatChunkMerge) => {
  // 跨页面更新消息
  const botMessage = messageLatestStore.getLatestMessageByConvId(result.conversationId);
  if (result.type === 'reasoning') {
    console.log('reasoning', result.data);
    botMessage.reasoning += result.data || '';
  }
  if (result.type === 'content') {
    console.log('content', result.data);
    botMessage.content += result.data || '';
  }
  // 当前页面更新消息
  if (currentMessage.value.conversationId === result.conversationId) {
    currentMessage.value = structuredClone(botMessage);
  }
};

// AI 结束回答
const handleChatEnd = async (result: IChatChunkMerge) => {
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
    currentMessageList.value = [...currentMessageList.value, botMessage];
  }
  // 确保同步更新 UI
  loading.value = false;
  // 生成摘要
  const conversation = await conversationStore.getConversationById(result.conversationId);
  if (conversation && !conversation.isSummary) {
    await handleSummary(result.conversationId, messages);
  }
  // 删除消息
  messageLatestStore.deleteLatestMessageByConvId(result.conversationId);
};

const handleSummary = (conversationId: string, messages: ChatMessage[]) => {
  // 获取当前模型参数
  const { baseURL, apiKey, model } = settingStore.getModelParams(settingStore.summaryModelHash);
  return chatService
    .chat({
      baseURL,
      apiKey,
      model,
      messages: [
        ...messages.map((item) => ({ role: item.role, content: item.content })),
        { role: 'user', content: '请用20字以内总结以上对话主题，作为对话标题直接返回，不需要任何标点和修饰' },
      ],
    })
    .then((result) => {
      const summary = result?.choices?.[0]?.message?.content || '';
      if (summary) {
        // 更新会话标题
        conversationStore.updateConversationTitle(conversationId, summary.slice(0, 20));
      }
    });
};

const handleOptimization = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = `完善或优化一下这段代码，可以是性能优化、代码简化、功能完善等方面的优化。请确保优化后的代码能够正常运行，并且在功能上与原代码保持一致。只要回答代码部分，不要有多余的文字，代码如下：`;

  promptCode.value = `
\`\`\`
${code}
\`\`\``;
  onSendButtonClick();
};

const handleExplanation = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = `解释一下这段代码的作用`;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
  onSendButtonClick();
};

const handleComment = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = `给下面这段代码补充注释`;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
  onSendButtonClick();
};

const handleTest = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = `给下面这段代码生成对应的测试用例，测试用例要覆盖主要的逻辑分支，并且符合常见的测试框架规范`;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
  onSendButtonClick();
};

const handleUpgradeClass = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = `将以下代码转换为 ES6 Class 语法，请确保转换后的代码符合 ES6 语法规范，并且能够正常运行。只要回答代码部分，不要有多余的文字，代码如下：`;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
  onSendButtonClick();
};

const handleUpgradeVue = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = `将以下代码转换为 Vue 3 的 Composition API 组件，请确保转换后的代码符合 Vue 3 的 Composition API 规范，并且能够正常运行。只要回答js/ts代码部分，不要有多余的文字，代码如下：`;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
  onSendButtonClick();
};

const handleUpgradeReact = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = `将以下代码转换为 React.FC 组件，请确保转换后的代码符合 ES6 语法规范，并且能够正常运行。只要回答代码部分，不要有多余的文字，代码如下：`;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
  onSendButtonClick();
};

const handleAnalysis = (code: string) => {
  if (!code) {
    return;
  }
  prompt.value = `分析一下这段数据`;
  promptCode.value = `
\`\`\`
${code}
\`\`\``;
  onSendButtonClick();
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
  onSendButtonClick();
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
  onSendButtonClick();
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

const onCodeButtonCLick = async () => {
  promptCode.value = prompt.value
    ? `\`\`\`
${prompt.value} 
\`\`\``
    : '';
  prompt.value = '';
};

// 发送消息
const onSendButtonClick = async () => {
  const currentConversationId = conversationStore.conversationId;
  const content = `${prompt.value}
${promptCode.value}
`;
  if (loading.value) {
    abortController?.abort();
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

<style>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 400px;
  max-width: 960px;
  margin: 0 auto;
  max-height: 100vh;
  padding: 0 4px;
}
</style>
