<template>
  <div class="app-header header-area">
    <div class="header-area-tool">
      <div class="info-block" style="display: flex; align-items: center; gap: 4px">
        <ContentInfo :info="info"></ContentInfo>
        <ChatDownload class="header-icon" @click="downloadConversation"></ChatDownload>
      </div>
      <div class="icon-block">
        <ChatAdd class="header-icon" @click="onCreateConversation"> </ChatAdd>
        <el-popover class="box-item" width="360px" trigger="click" placement="left-start" v-model:visible="visible">
          <div class="conversation-head">
            <span class="conversation-head-title">历史记录</span>
            <ChatClear class="header-icon" @click="clearConversation"></ChatClear>
          </div>
          <div class="conversation-list">
            <div
              class="conversation-item"
              v-for="option in conversations"
              :key="option.id"
              @click="onConversationChange(option.id)"
            >
              <span class="conversation-item-title">{{ option.title }}</span>
              <el-icon class="icon-delete" @click.stop="onDeleteConversation(option.id)"><Delete /></el-icon>
            </div>
          </div>
          <template #reference>
            <ChatHistory class="header-icon"></ChatHistory>
          </template>
        </el-popover>
      </div>
    </div>
    <div class="header-area-bar">
      <div class="header-area-bar__inner" :style="barStyle"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConversationStore } from '@/stores/conversation';
import { useMessageStore } from '@/stores/message';
import { firstElement, getTokenCount, lastElement } from '@/utils';
import { computed, ref } from 'vue';
import type { ChatMessage } from '@/models/Model';
import { ChatAdd, ChatClear, ChatHistory, ChatDownload } from '@/icons';
import ContentInfo from './AppHeaderContentInfo.vue';
import { MAX_TOKEN_LENGTH } from '@/utils/constants';
import { Delete } from '@element-plus/icons-vue';
import { storeToRefs } from 'pinia';

const conversationStore = useConversationStore();
const { conversations, conversationId } = storeToRefs(useConversationStore());
const messageStore = useMessageStore();

const props = defineProps({
  conversationId: {
    default: '',
  },
  messages: {
    default: () => [] as ChatMessage[],
  },
});

const info = computed(() => {
  const result = {
    temp: 0,
    user: 0,
    assistant: 0,
    upload: 0,
    window: 0,
    width: 0,
  };
  props.messages?.forEach((message) => {
    const tokens = getTokenCount(message.content);
    if (message.role === 'user' || message.role === 'system') {
      result.user = result.user + tokens;
      const upload = result.user + result.assistant;
      result.upload = result.upload + upload;
    } else {
      result.assistant = result.assistant + tokens;
    }
  });
  result.window = result.user + result.assistant;
  result.width = (result.window * 100) / MAX_TOKEN_LENGTH;
  return result;
});

const barStyle = computed(() => {
  return {
    '--width': `${info.value.width}%`,
  };
});

const emit = defineEmits<{
  (e: 'create'): void;
  (e: 'delete'): void;
  (e: 'update:conversationId', value: string): void;
  (e: 'download'): void;
}>();

const downloadConversation = async () => {
  const conversation = conversationStore.getConversationById(conversationId.value);
  if (!conversation) return;
  await messageStore.downloadConversation(conversationId.value, conversation.title);
};

// 按钮操作
const visible = ref(false);
const onConversationChange = (id: string) => {
  emit('update:conversationId', id);
  visible.value = false;
};

const onCreateConversation = async () => {
  await conversationStore.createConversation();
  const convs = await conversationStore.getConversations();
  emit('create');
  emit('update:conversationId', lastElement(convs).id);
};

const onDeleteConversation = async (id: string) => {
  await conversationStore.deleteConversation(id);
  await messageStore.removeMessagesById(id);
  const convs = await conversationStore.getConversations();
  emit('delete');
  emit('update:conversationId', firstElement(convs).id);
};

const clearConversation = async () => {
  await conversationStore.clearConversation();
  const convs = await conversationStore.getConversations();
  emit('update:conversationId', firstElement(convs).id);
};
</script>

<style>
.header-icon {
  cursor: pointer;
  font-size: 16px;
}

.header-area-bar {
  margin-top: 2px;
  margin-bottom: 2px;
  width: 100%;
  height: 2px;
  background-color: #777;
}

.header-area-bar__inner {
  height: 2px;
  width: var(--width);
  background-color: #409eff;
}

.conversation-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
}

.conversation-head .conversation-head-title {
  font-size: 16px;
}

.conversation-head .conversation-head-button {
  font-size: 14px;
  cursor: pointer;
}

.conversation-head .conversation-head-button:hover {
  color: #f56c6c;
}

.conversation-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 480px;
  overflow-y: auto;
}

.conversation-item {
  cursor: pointer;
  padding: 6px;
  background-color: #1d1e1f;
  border-radius: 4px;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conversation-item:hover {
  background-color: #484c58;
}

.conversation-item-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-item .icon-delete {
  visibility: hidden;
  color: #f56c6c;
}

.conversation-item:hover .icon-delete {
  visibility: visible;
}
</style>
