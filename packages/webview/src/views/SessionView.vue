<template>
  <div class="conversation-history-container">
    <div class="conversation-history-header">
      <h2 class="conversation-history-title">Sessions</h2>
      <div class="header-icon-group right">
        <el-icon class="header-icon" style="transform: rotate(90deg)" @click="$router.push('/')">
          <Download />
        </el-icon>
        <el-icon class="header-icon" @click="$router.push('/setting')">
          <Setting></Setting>
        </el-icon>
      </div>
    </div>
    <div class="conversation-history-body">
      <div
        v-for="conv in conversations"
        :key="conv.id"
        class="conversation-item"
        :class="{
          'is-active': conv.id === conversationStore.conversationId,
        }"
      >
        <span class="conversation-item-title">{{ conv.title }}</span>
        <div class="vscode-button-group hover-visible">
          <button class="vscode-button" @click="onConversationChange(conv.id)">
            <el-icon>
              <Promotion />
            </el-icon>
          </button>
          <button v-if="conversations.length > 1" class="vscode-button" @click.stop="onDeleteConversation(conv.id)">
            <el-icon class="icon-delete">
              <Delete />
            </el-icon>
          </button>
        </div>
      </div>
    </div>
    <div class="conversation-history-footer">
      <div style="flex: 1">
        <button class="vscode-button" @click="onAddConversation">Add Session</button>
      </div>
      <button class="vscode-button" @click="onClearConversation">Reset</button>
      <button class="vscode-button primary" @click="$router.push('/')">OK</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useConversationStore } from '@/stores/useConversationStore';
import { useMessageStore } from '@/stores/useMessageStore';
import { firstElement } from '@/utils';
import { Delete, Download, Promotion, Setting } from '@element-plus/icons-vue';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const conversationStore = useConversationStore();
const { conversations } = storeToRefs(useConversationStore());
const messageStore = useMessageStore();

const onConversationChange = async (id: string) => {
  conversationStore.setConversationId(id);
  router.push('/');
};

const onAddConversation = async () => {
  const conv = await conversationStore.createConversation();
  conversationStore.setConversationId(conv.id);
};

const onDeleteConversation = async (id: string) => {
  await conversationStore.deleteConversation(id);
  await messageStore.removeMessagesById(id);
  const convs = await conversationStore.getConversations();
  if (convs.length > 0) {
    conversationStore.setConversationId(firstElement(convs).id);
  }
};

const onClearConversation = async () => {
  await conversationStore.clearConversations();
  const convs = await conversationStore.getConversations();
  if (convs.length > 0) {
    conversationStore.setConversationId(firstElement(convs).id);
  }
};

onMounted(async () => {
  await conversationStore.getConversations();
});
</script>

<style lang="scss" scoped>
.conversation-history-container {
  min-width: 400px;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 4px;
  display: flex;
  flex-direction: column;
}

.conversation-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
  margin-bottom: 8px;

  .conversation-history-title {
    font-size: 14px;
    font-weight: 500;
  }
}

.conversation-history-body {
  flex: 1;
  max-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  gap: 8px;
}

.conversation-item {
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--vscode-button-secondaryBackground);
  background-color: transparent;
  color: var(--vscode-button-foreground);

  &.is-active {
    border-color: var(--vscode-button-background);
  }

  .conversation-item-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .icon-delete {
    cursor: pointer;
  }

  .hover-visible {
    visibility: hidden;
  }

  &:hover .hover-visible {
    visibility: visible;
  }
}

.conversation-history-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 8px;
  margin-top: 8px;
}
</style>
