<template>
    <div class="messages-area" id="messages">
        <div v-for="message in displayedMessages" :key="message.uuid"
            :class="['message', message.role === 'assistant' ? 'message-ai' : 'message-you']">
            <div v-html="formatMessage(message)"></div>
            <div></div>
        </div>
        <div ref="messagesEndRef"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick, computed } from 'vue'
import type { ChatMessage } from '../models/Model'

// 声明全局 marked 和 hljs
declare const marked: any
declare const hljs: any

// 配置 marked
marked.setOptions({
    highlight: function (code: string, language: string) {
        const validLanguage = hljs.getLanguage(language) ? language : 'plaintext'
        return hljs.highlight(validLanguage, code).value
    },
    pedantic: false,
    gfm: true,
    breaks: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    xhtml: false
})

const props = defineProps<{
    messages: ChatMessage[]
    tempMessage: ChatMessage
    loading: boolean
}>()

const messagesEndRef = ref<HTMLDivElement | null>(null)

// 计算显示的完整消息列表
const displayedMessages = computed(() => {
    return props.loading
        ? [...props.messages, props.tempMessage]
        : props.messages
})

// 格式化消息内容
const formatMessage = (message: ChatMessage) => {
    const prefix = message.role === 'assistant' ? 'AI: ' : 'You: '
    return marked.parse(`${prefix}${message.content}`)
}

// 滚动到底部
const scrollToBottom = () => {
    nextTick(() => {
        messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
    })
}

// 高亮代码块
const highlightCodeBlocks = () => {
    nextTick(() => {
        hljs.highlightAll()
    })
}

// 监听消息列表变化
watch(() => props.tempMessage.content, () => {
    scrollToBottom()
    highlightCodeBlocks()
})

watch(() => displayedMessages, () => {
    scrollToBottom()
    highlightCodeBlocks()
})

// 初始化时执行一次
onMounted(() => {
    scrollToBottom()
    highlightCodeBlocks()
})
</script>
