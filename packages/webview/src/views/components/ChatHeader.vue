<template>
  <div class="app-header chat-header header-area">
    <div class="header-area-tool">
      <div class="header-title">
        {{ conversationStore.conversationTitle.slice(0, 20) || 'New Session' }}
      </div>
      <div class="header-icon-group right">
        <el-icon class="header-icon" :class="{ disabled: loading }" @click="downloadConversation">
          <Download />
        </el-icon>
        <el-icon class="header-icon" :class="{ disabled: loading }" @click="onCreateConversation">
          <FolderAdd />
        </el-icon>
        <el-icon class="header-icon" :class="{ disabled: loading }" @click="gotoHistory">
          <FolderOpened />
        </el-icon>
        <el-icon class="header-icon" :class="{ disabled: loading }" @click="gotoSetting">
          <Setting></Setting>
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '@/models/Message';
import { useConversationStore } from '@/stores/useConversationStore';
import { useMessageStore } from '@/stores/useMessageStore';
import { Download, FolderAdd, FolderOpened, Setting } from '@element-plus/icons-vue';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const conversationStore = useConversationStore();
const messageStore = useMessageStore();

const props = defineProps({
  messages: {
    default: () => [] as ChatMessage[],
  },
  loading: {
    default: false,
  },
});

onMounted(async () => {
  const conversation = await conversationStore.getConversationById(conversationStore.conversationId);
  if (conversation) {
    conversationStore.setConversationTitle(conversation.title);
  }
});

const emit = defineEmits<{
  (e: 'create'): void;
  (e: 'delete'): void;
  (e: 'update:conversationId', value: string): void;
  (e: 'download'): void;
}>();

const downloadConversation = async () => {
  if (props.loading) {
    return;
  }
  const conversation = await conversationStore.getConversationById(conversationStore.conversationId);
  if (!conversation) {
    return;
  }
  await messageStore.downloadConversation(conversationStore.conversationId, conversation.title);
};

const onCreateConversation = async () => {
  if (props.loading) {
    return;
  }
  if (props.messages.length === 0) {
    return;
  }
  const conv = await conversationStore.createConversation();
  conversationStore.setConversationId(conv.id);
  conversationStore.setConversationTitle(conv.title);
  emit('create');
  emit('update:conversationId', conv.id);
};

const gotoHistory = () => {
  if (props.loading) {
    return;
  }
  router.push('/session');
};

const gotoSetting = () => {
  if (props.loading) {
    return;
  }
  router.push('/setting');
};
</script>

<style lang="scss">
.app-header .header-area-tool {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: var(--app-header-height);
  padding-top: 2px;
}

.header-title {
  font-size: 12px;
  color: var(--vscode-panelTitle-activeForeground);
}
</style>
