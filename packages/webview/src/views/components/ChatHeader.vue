<template>
  <div class="app-header header-area">
    <div class="header-area-tool">
      <div class="header-icon-group" style="display: flex; align-items: center; gap: 4px">
        <UsageInfo :info="info" />
      </div>
      <div class="header-icon-group right">
        <el-icon class="header-icon" :class="{'disabled': loading}" @click="downloadConversation">
          <Download />
        </el-icon>
        <el-icon class="header-icon" :class="{'disabled': loading}" @click="onCreateConversation">
          <FolderAdd />
        </el-icon>
        <el-icon class="header-icon" :class="{'disabled': loading}" @click="gotoHistory">
          <FolderOpened />
        </el-icon>
        <el-icon class="header-icon" :class="{'disabled': loading}" @click="gotoSetting">
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
import { getTokenCount } from '@/utils';
import { computed } from 'vue';
import type { ChatMessage } from '@/models/Model';
import UsageInfo from '@/components/UsageInfo.vue';
import { MAX_TOKEN_LENGTH } from '@/stores/constants';
import { Setting, Download, FolderAdd, FolderOpened } from '@element-plus/icons-vue';
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
    const tokens = getTokenCount(message?.content ?? '');
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
  if (props.loading) { return; }
  const conversation = conversationStore.getConversationById(conversationStore.conversationId);
  if (!conversation) { return; }
  await messageStore.downloadConversation(conversationStore.conversationId, conversation.title);
};

const onCreateConversation = async () => {
  if (props.loading) { return; }
  if (props.messages.length === 0) {
    return;
  }
  const conv = await conversationStore.createConversation();
  conversationStore.setConversationId(conv.id);
  emit('create');
  emit('update:conversationId', conv.id);
};

const gotoHistory = () => {
  if (props.loading) { return; }
  router.push('/history');
};

const gotoSetting = () => {
  if (props.loading) { return; }
  router.push('/setting');
};

</script>

<style lang="scss">
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
</style>
