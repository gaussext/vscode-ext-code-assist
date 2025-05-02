  <template>
    <div class="header-area">
      <el-select class="el-select--vscode" :model-value="vendorId" @change="onVendorChange">
        <el-option v-for="option in vendors" :key="option.value" :value="option.value" :label="option.label">
        </el-option>
      </el-select>
      <el-select class="el-select--vscode" :model-value="modelId" @change="onModelChange">
        <el-option v-for="option in models" :key="option.value" :value="option.value" :label="option.label">
        </el-option>
      </el-select>
      <el-select class="el-select--vscode" :model-value="conversationId" @change="onConversationChange">
        <el-option v-for="option in conversations" :key="option.id" :value="option.id" :label="option.title">
        </el-option>
      </el-select>
      <el-button class="vscode-button-small" id="create-button" @click="onCreateConversation">
        +
      </el-button>
      <el-button class="vscode-button-small" id="delete-button" @click="onDeleteConversation">
        -
      </el-button>
      <el-button class="vscode-button-small" id="clear-button" title="清空消息" @click="onClearConversation">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6 7V18C6 19.1046 6.89543 20 8 20H16C17.1046 20 18 19.1046 18 18V7M4 7H20M10 11V16M14 11V16M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </el-button>
    </div>
  </template>


<script setup lang="ts">
import { chatService, type ChatVendor } from '@/api';
import { Conversation } from "@/models/Model";
import store from '@/store';
import { type StandardItem } from '@/types';
import { firstElement, lastElement } from '@/utils';
import { onMounted, ref } from 'vue';

const props = defineProps({
  vendorId: {
    default: ''
  },
  modelId: {
    default: ''
  },
  conversationId: {
    default: ''
  }
})
const emit = defineEmits<{
  (e: 'update:vendorId', value: ChatVendor): void
  (e: 'update:modelId', value: string): void
  (e: 'update:conversationId', value: string): void
}>()

const vendors: StandardItem<ChatVendor>[] = [
  {
    value: 'ollama',
    label: 'ollama',
  },
  {
    value: 'deepseek',
    label: 'deepseek',
  },
];
const onVendorChange = (vendor: ChatVendor) => {
  emit('update:vendorId', vendor)
  chatService.setVendor(vendor);
  setTimeout(() => {
    getModels();
  });
}

const models = ref<StandardItem<string>[]>([])
const getModels = async () => {
  const res = await chatService.getModels();
  const modelsList = res.data.models || [];
  const sortedModels = [...modelsList].sort((a, b) => a.label.localeCompare(b.label))
  models.value = sortedModels;
  if (!props.modelId || !sortedModels.find(model => model.value === props.modelId)) {
    emit('update:modelId', firstElement(sortedModels).value)
  }
}

const onModelChange = (model: string) => {
  emit('update:modelId', model)
}

const conversations = ref<Conversation[]>([])
const getConversations = async () => {
  const convs = await store.getConversations()
  conversations.value = [...convs]
  if (!props.conversationId && firstElement(convs).id) {
    emit('update:conversationId', firstElement(convs).id)
  }
  return convs
}

const onConversationChange = (id: string) => {
  emit('update:conversationId', id)
}

// 按钮操作
const onCreateConversation = async () => {
  await store.createConversation()
  const convs = await getConversations()
  emit('update:conversationId', lastElement(convs).id)
}

const onDeleteConversation = async () => {
  await store.deleteConversation(props.conversationId)
  await store.removeMessagesById(props.conversationId)
  const convs = await getConversations()
  emit('update:conversationId', firstElement(convs).id)
}

const onClearConversation = async () => {
  await store.setMessagesById(props.conversationId, [])
  emit('update:conversationId', props.conversationId)
}

onMounted(() => {
  getModels();
  getConversations()
})
</script>