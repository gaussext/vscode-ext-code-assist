<template>
  <div class="app-header header-area">
    <div class="header-area-tool">
      <div class="info-block" style="display: flex; align-items: center; gap: 4px">
        <ContentInfo :info="info"></ContentInfo>
      </div>
      <div class="icon-block">
        <el-icon class="header-icon" @click="downloadConversation"><Download /></el-icon>
        <el-icon class="header-icon" @click="onCreateConversation"><FolderAdd /></el-icon>
        <div class="history-dropdown" v-if="visible">
          <div class="dropdown-overlay" @click="visible = false"></div>
          <div class="dropdown-content">
            <div class="conversation-head">
              <span class="conversation-head-title">历史记录</span>
              <el-icon class="header-icon" @click="clearConversation"><DeleteFilled /></el-icon>
            </div>
            <div class="conversation-list">
              <div
                class="conversation-item"
                v-for="option in conversations"
                :key="option.id"
                @click="onConversationChange(option.id)"
              >
                <span class="conversation-item-title">{{ option.title }}</span>
                <span class="icon-delete" @click.stop="onDeleteConversation(option.id)"><Delete /></span>
              </div>
            </div>
          </div>
        </div>
        <el-icon class="header-icon" @click="visible = !visible"><FolderOpened /></el-icon>
        <el-icon class="header-icon" width="1em" height="1em" @click="$router.push('/setting')">
          <Setting></Setting>
        </el-icon>
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
import ContentInfo from './AppHeaderContentInfo.vue';
import { MAX_TOKEN_LENGTH } from '@/utils/constants';
import { Delete, Setting, Download, Reading, FolderAdd, FolderOpened } from '@element-plus/icons-vue';
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
  background-color: var(--vscode-charts-blue);
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

.history-dropdown {
  position: relative;
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}

.dropdown-content {
  position: absolute;
  right: 0;
  top: 100%;
  width: 360px;
  background-color: #1d1e1f;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 12px;
  z-index: 100;
}

.dropdown-content .icon-delete {
  cursor: pointer;
  color: #f56c6c;
}
</style>
