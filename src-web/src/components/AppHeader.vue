<template>
  <div class="header-area">
    <el-select style="max-width: 300px" class="el-select--vscode" :model-value="conversationId"
      @change="onConversationChange">
      <el-option v-for="option in conversations" :key="option.id" :value="option.id" :label="option.title">
      </el-option>
    </el-select>
    <el-button class="vscode-button-small" id="create-button" title="配置模型" icon="Setting" @click="openDialog">
    </el-button>
    <el-button class="vscode-button-small" id="create-button" title="新增会话" icon="Plus" @click="onCreateConversation">
    </el-button>
    <el-button class="vscode-button-small" id="delete-button" title="删除会话" icon="Minus" @click="onDeleteConversation">
    </el-button>
    <el-button class="vscode-button-small" id="clear-button" title="清空消息" icon="Delete" @click="onClearConversation">
    </el-button>
  </div>
  <SettingDialog v-if="dialogVisible" :vendor-id="vendorId" :model-id="modelId" @cancel="onDialogCancel"
    @submit="onDialogSubmit"></SettingDialog>
</template>

<script setup lang="ts">
import { chatService, type ChatVendor } from "@/api";
import store from "@/store";
import { firstElement, lastElement } from "@/utils";
import { ref } from "vue";
import SettingDialog from "./AppSettingDialog.vue";

const props = defineProps({
  vendorId: {
    default: "",
  },
  modelId: {
    default: "",
  },
  conversationId: {
    default: "",
  },
  conversations: {
    default: () => []
  }
});

const emit = defineEmits<{
  (e: "create"): void;
  (e: "delete"): void;
  (e: "update:vendorId", value: ChatVendor): void;
  (e: "update:modelId", value: string): void;
  (e: "update:conversationId", value: string): void;
}>();

const onConversationChange = (id: string) => {
  emit("update:conversationId", id);
};

// 按钮操作
const onCreateConversation = async () => {
  await store.createConversation();
  const convs = await store.getConversations();
  emit('create')
  emit("update:conversationId", lastElement(convs).id);
};

const onDeleteConversation = async () => {
  await store.deleteConversation(props.conversationId);
  await store.removeMessagesById(props.conversationId);
  const convs = await store.getConversations();
  emit('delete')
  emit("update:conversationId", firstElement(convs).id);
};

const onClearConversation = async () => {
  await store.setMessagesById(props.conversationId, []);
  emit("update:conversationId", props.conversationId);
};

const dialogVisible = ref(false);

const openDialog = () => {
  dialogVisible.value = true;
};

const onDialogCancel = () => {
  dialogVisible.value = false;
  if (props.vendorId) {
    chatService.setVendor(props.vendorId as ChatVendor);
  }
};

const onDialogSubmit = ({ vendorId, modelId }) => {
  dialogVisible.value = false;
  chatService.setVendor(vendorId);
  emit("update:vendorId", vendorId);
  emit("update:modelId", modelId);
};
</script>
