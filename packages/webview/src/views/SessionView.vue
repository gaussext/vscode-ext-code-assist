<template>
  <div class="conversation-history-container">
    <div class="conversation-history-header">
      <h2 class="conversation-history-title">Sessions</h2>
      <div class="header-icon-group right">
        <el-icon class="header-icon" style="transform: rotate(90deg)" @click="$router.push('/')">
          <Download />
        </el-icon>
      </div>
    </div>
    <div class="conversation-history-body">
      <div
        v-for="conv in conversations"
        :key="conv.id"
        class="conversation-item"
        :class="{
          'is-active': conv.id === session.conversationId.value,
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
      <button class="vscode-button" @click="onClearClick">Reset</button>
      <button class="vscode-button primary" @click="$router.push('/')">OK</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useSession } from '@/stores/useSession';
import { Delete, Promotion } from '@element-plus/icons-vue';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

interface ConvItem { id: string; title: string }

const router = useRouter();
const session = useSession();
const conversations = ref<ConvItem[]>([]);

const loadSessions = async () => {
  const list = await session.listSessions();
  conversations.value = list.map((s: any) => ({ id: s.id, title: s.title || 'New Session' }));
};

const onConversationChange = (id: string) => {
  session.setConversationId(id);
  router.push('/');
};

const onAddConversation = () => {
  const id = crypto.randomUUID();
  session.setConversationId(id);
  session.setConversationTitle('');
};

const onClearClick = () => {
  const id = crypto.randomUUID();
  session.setConversationId(id);
  conversations.value = [{ id, title: 'New Session' }];
};

const onDeleteConversation = async (id: string) => {
  await session.deleteSession(id);
  await loadSessions();
  if (conversations.value.length > 0) {
    session.setConversationId(conversations.value[0].id);
  }
};

onMounted(async () => {
  await loadSessions();
});
</script>

<style lang="scss" scoped>
.conversation-history-container {
  min-width: 400px;
  max-width: 960px;
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
    font-size: 16px;
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
  gap: 8px;
  margin-top: 12px;
}
</style>
