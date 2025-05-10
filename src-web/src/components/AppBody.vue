<template>
    <div class="messages-area" id="messages">
        <div v-for="message in messages" :key="message.uuid"
            :class="['message', message.role === 'assistant' ? 'message-ai' : 'message-you']">
            <div v-html="formatMessage(message)"></div>
            <div style="margin-top: 4px;">
                <a class="link-copy copy-markdown" @click="copyToClipboard(message.content)">复制 Markdown</a>
                <span v-if="message.role === 'assistant'">{{ getSpeedFromMessage(message) }}</span>
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
import { ChatMessage } from '@/models/Model';
import { copyToClipboard, getTokenCount } from '@/utils';
import hljs from 'highlight.js';
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { onMounted, ref, watch } from 'vue';

const marked = new Marked(
    markedHighlight({
        emptyLangClass: 'hljs',
        langPrefix: 'hljs language-',
        highlight(code, lang, info) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    })
)
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

const getSpeedFromMessage = (message: ChatMessage) => {
    const duration = message.timestamp - message.startTime || 1000;
    const second = (duration / 1000).toFixed(2)
    const tokens = getTokenCount(message.content);
    const speed = (tokens * 1000 / duration).toFixed(2);
    return  `${tokens} tokens in ${second} second = ${speed} token/s`;
}

// 滚动到底部
const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' });
    })
}

watch(() => props.latestMessage.content, async () => {
    if (latestMessageRef.value) {
        latestMessageRef.value.innerHTML = await formatMessage(props.latestMessage);
    }
    scrollToBottom();
});

watch(() => props.messages, () => {
    scrollToBottom();
});

onMounted(() => {
    scrollToBottom();
})
</script>
