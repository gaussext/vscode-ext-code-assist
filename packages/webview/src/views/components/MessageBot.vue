<template>
  <div class="chat-message message-bot">
    <div class="message-title">
      <span>{{ message.model }}</span>
    </div>
    <el-collapse v-if="message.reasoning" class="reasoning-content" expand-icon-position="left">
      <el-collapse-item title="Think">
        {{ message.reasoning }}
      </el-collapse-item>
    </el-collapse>
    <div v-if="message.content" class="markdown-content">
      <Markdown :content="message.content"></Markdown>
    </div>
    <div class="footer-content">
      <el-icon v-if="!copied" class="message-icon" @click="copyContent(message.content)">
        <CopyDocument />
      </el-icon>
      <el-icon v-else>
        <Check />
      </el-icon>
      <MessageInfo :message="message" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatMessage } from '@/models/Model';
import { copyToClipboard } from '@/utils';
import { Check, CopyDocument } from '@element-plus/icons-vue';
import { ref } from 'vue';
import Markdown from '@/components/Markdown.vue';

const props = defineProps({
  message: {
    type: Object,
    default: () => new ChatMessage('assistant', ''),
  },
});

const copied = ref(false);
const copyContent = async (content: string) => {
  await copyToClipboard(content);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 1000);
};
</script>

<style scoped>
.message-title {
  margin-bottom: 8px;
}

.reasoning-content {
  margin-bottom: 16px;
}

.footer-content {
  margin-top: 4px;
  height: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
