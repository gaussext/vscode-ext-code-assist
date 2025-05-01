<template>
  <div class="history-area">
    <select
      class="vscode-select"
      id="model-select"
      :value="modelId"
      @change="onModelChange"
    >
      <option 
        v-for="model in models" 
        :key="model.name" 
        :value="model.name"
      >
        {{ model.name }}
      </option>
    </select>

    <select
      class="vscode-select"
      id="history-select"
      :value="conversationId"
      @change="onConversationChange"
    >
      <option 
        v-for="conv in conversations" 
        :key="conv.id" 
        :value="conv.id"
      >
        {{ conv.title }}
      </option>
    </select>

    <button
      class="vscode-button-small"
      id="create-button"
      @click="onCreateConversation"
    >
      +
    </button>

    <button
      class="vscode-button-small"
      id="delete-button"
      @click="onDeleteConversation"
    >
      -
    </button>

    <button
      class="vscode-button-small"
      id="clear-button"
      title="清空消息"
      @click="onClearConversation"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M6 7V18C6 19.1046 6.89543 20 8 20H16C17.1046 20 18 19.1046 18 18V7M4 7H20M10 11V16M14 11V16M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { AIModel, Conversation } from "../models/Model"
import store from '../store'
import { firstElement, lastElement } from '../utils'
import { event } from '../models/Model'

const props = defineProps({
  modelId: {
    default: ''
  },
  conversationId: {
    default: ''
  }
})

const emit = defineEmits<{
  (e: 'update:modelId', value: string): void
  (e: 'update:conversationId', value: string): void
}>()

const models = ref<AIModel[]>([])
const conversations = ref<Conversation[]>([])

// 更新模型列表
const handleModels = (modelsList: AIModel[]) => {
  const sortedModels = [...modelsList].sort((a, b) => a.name.localeCompare(b.name))
  models.value = sortedModels;
  if (!props.modelId) {
    emit('update:modelId', firstElement(sortedModels).model)
  }
}

const handleWindowMessage = (e: MessageEvent) => {
  const { type, text } = e.data
  switch (type) {
    case 'tags-end':
      handleModels(text.models as AIModel[])
      break
  }
}

const getModels = () => {
  event.getModels()
}

const getConversations = async () => {
  const convs = await store.getConversations()
  conversations.value = [...convs]
  if (!props.conversationId && firstElement(convs).id) {
    emit('update:conversationId', firstElement(convs).id)
  }
  return convs
}

const onModelChange = (e: Event) => {
  const model = (e.target as HTMLSelectElement).value;
  emit('update:modelId', model)
}

const onConversationChange = (e: Event) => {
  const id = (e.target as HTMLSelectElement).value;
  emit('update:conversationId', id)
}

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
  window.addEventListener('message', handleWindowMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleWindowMessage)
})
</script>