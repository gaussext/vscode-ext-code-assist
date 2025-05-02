<template>
    <div class="messages-area" id="messages">
        <div v-for="message in messages" :key="message.uuid"
            :class="['message', message.role === 'assistant' ? 'message-ai' : 'message-you']">
            <div v-html="formatMessage(message)"></div>
            <div style="margin-top: 4px;">
                <a class="link-copy copy-markdown" @click="copyToClipboard(message.content)">复制 Markdown</a>
            </div>
        </div>
        <div v-show="loading" :key="latestMessage.uuid"
            :class="['message', latestMessage.role === 'assistant' ? 'message-ai' : 'message-you']">
            <div ref="latestMessageRef"></div>
        </div>
        <div ref="messagesEndRef"></div>
    </div>
</template>

<script setup lang="ts">
import { ChatMessage } from '@/models/Model'
import { copyToClipboard } from '@/utils'
import { nextTick, onMounted, ref, watch } from 'vue'

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
    latestMessage: ChatMessage
    loading: boolean
}>()

const messagesEndRef = ref<HTMLDivElement | null>(null)
const latestMessageRef = ref<HTMLDivElement | null>(null)

// 格式化消息内容
const formatMessage = (message: ChatMessage) => {
    const prefix = message.role === 'assistant' ? 'AI: ' : 'You: '
    return marked.parse(`${prefix}${message.content}`)
}

const highlightCodeBlocks = () => {
    nextTick(() => {
        if (!props.loading) {
            hljs.highlightAll();
        }
    });
};

// 滚动到底部
const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' });
    })
}

watch(() => props.latestMessage.content, () => {
    if (latestMessageRef.value) {
        latestMessageRef.value.innerHTML = formatMessage(props.latestMessage);
    }
    scrollToBottom();
    hljs.highlightAll();
});

watch(() => props.messages, () => {
    scrollToBottom();
    highlightCodeBlocks();
});

onMounted(() => {
    scrollToBottom();
})
</script>
