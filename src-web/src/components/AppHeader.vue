<template>
  <div class="header-area">
    <div class="header-area-tool">
      <div class="info-block">
        <ContentInfo :info="info"></ContentInfo>
      </div>
      <div class="icon-block">
        <ChatAddOn @click="onCreateConversation"> </ChatAddOn>
        <el-popover class="box-item" title="历史记录" width="360px" trigger="click" placement="left-start" v-model:visible="visible">
            <div class="conversation-list">
              <div class="conversation-item" v-for="option in conversations" :key="option.id" @click="onConversationChange(option.id)">
                <span>{{ option.title }}</span>
                <el-icon class="icon-delete" @click.stop="onDeleteConversation(option.id)"><Delete /></el-icon>
              </div>
            </div>
          <template #reference>
            <ChatAppsScript ></ChatAppsScript>
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
import store from "@/store";
import { firstElement, getTokenCount, lastElement } from "@/utils";
import { computed, ref } from "vue";
import type { ChatMessage } from "@/models/Model";
import ChatAppsScript from "@/icons/chat-apps-script.vue";
import ChatAddOn from "@/icons/chat-add-on.vue";
import ContentInfo from "./ContentInfo.vue";
import { MAX_TOKEN_LENGTH } from "@/utils/constants";

const props = defineProps({
  conversationId: {
    default: "",
  },
  conversations: {
    default: () => []
  },
  messages: {
    default: () => [] as ChatMessage[]
  }
});

const info = computed(() => {
  const result = {
    temp: 0,
    user: 0,
    upload: 0,
    upload_cost: 0,
    assistant: 0,
    window: 0,
    width: 0
  }
  props.messages.forEach(message => {
    const tokens = getTokenCount(message.content)
    if (message.role === 'user' || message.role === 'system') {
      result.upload = result.upload + result.user + result.assistant + tokens;
      result.upload_cost = result.upload_cost + result.upload;
      result.user = result.user + tokens;
    } else {
      result.assistant = result.assistant + tokens
    }
  })
  result.window = result.user + result.assistant
  result.width = result.window * 100 / MAX_TOKEN_LENGTH;
  return result;
})

const barStyle = computed(() => {
  return {
    '--width': `${info.value.width}%`
  }
})

const emit = defineEmits<{
  (e: "create"): void;
  (e: "delete"): void;
  (e: "update:conversationId", value: string): void;
}>();

// 按钮操作
const visible = ref(false);
const onConversationChange = (id: string) => {
  emit("update:conversationId", id);
  visible.value = false;
};

const onCreateConversation = async () => {
  await store.createConversation();
  const convs = await store.getConversations();
  emit('create')
  emit("update:conversationId", lastElement(convs).id);
};

const onDeleteConversation = async (id: string) => {
  await store.deleteConversation(id);
  await store.removeMessagesById(id);
  const convs = await store.getConversations();
  emit('delete')
  emit("update:conversationId", firstElement(convs).id);
};

const onClearConversation = async () => {
  await store.setMessagesById(props.conversationId, []);
  emit("update:conversationId", props.conversationId);
};
</script>

<style>
.header-area-bar {
  margin-top: 2px;
  margin-bottom: 2px;
  width: 100%;
  height: 4px;
  background-color: #777;
}

.header-area-bar__inner {
  height: 4px;
  width: var(--width);
  background-color: #409eff;
}

.conversation-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.conversation-item .icon-delete {
  visibility: hidden;
  color: #f56c6c;
}

.conversation-item:hover .icon-delete {
  visibility: visible;
}
</style>
