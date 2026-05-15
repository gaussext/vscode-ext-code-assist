<template>
  <div class="app-header chat-header header-area">
    <div class="header-area-tool">
      <div class="header-title">
        {{ session.conversationTitle.value.slice(0, 20) || 'New Session' }}
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
import { chatService } from '@/acp';
import { useSession } from '@/stores/useSession';
import { Download, FolderAdd, FolderOpened, Setting } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const session = useSession();

const props = defineProps({
  messages: {
    default: () => [] as ChatMessage[],
  },
  loading: {
    default: false,
  },
});

const downloadConversation = async () => {
  const id = session.conversationId.value;
  if (!id) return;
  const title = session.conversationTitle.value || 'chat';
  const data = await chatService.getSessionMessages(id);
  const text = data.messages
    .filter((m: any) => m.role === 'agent')
    .map((m: any) => m.content)
    .join('\n');
  if (!text) return;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.md`;
  a.click();
  URL.revokeObjectURL(url);
};

const onCreateConversation = () => {
  session.setConversationId(crypto.randomUUID());
  session.setConversationTitle('');
};

const gotoSetting = () => {
  router.push('/setting');
};

const gotoHistory = () => {
  router.push('/session');
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
