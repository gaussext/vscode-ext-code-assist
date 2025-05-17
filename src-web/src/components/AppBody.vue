<template>
    <div class="messages-area" id="messages">
        <div v-for="message in messages" :key="message.uuid"
            :class="['message', message.role === 'assistant' ? 'message-ai' : '']">
            <div v-if="message.role === 'assistant'">
                <div style=" margin-bottom: 8px;">
                    <span>{{ message.model }}</span>
                </div>
                <div v-html="formatMessage(message)"></div>
                <div style="margin-top: 4px; display: flex; align-items: center;">
                    <a class="link-copy copy-markdown" @click="copyToClipboard(message.content)">复制 Markdown</a>
                    <MessageInfo v-if="message.role === 'assistant'" :message="message"></MessageInfo>
                </div>
            </div>
            <div v-else>
                <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
                    <span>You</span>
                </div>
                <div style="display: flex; justify-content: flex-end; width: 100%;">
                    <div class="message-you" v-html="formatMessage(message)"></div>
                </div>
            </div>
        </div>
        <div v-show="loading" :key="latestMessage.uuid"
            :class="['message', latestMessage.role === 'assistant' ? 'message-ai' : 'message-you']">
            <div style=" margin-bottom: 8px;">
                <span>{{ latestMessage.model }}</span>
            </div>
            <div ref="latestMessageRef"></div>
        </div>
        <div ref="messagesEndRef"></div>
    </div>
</template>

<script setup lang="ts">
import { ChatMessage } from '@/models/Model';
import { copyToClipboard } from '@/utils';
import hljs from 'highlight.js';
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { onMounted, ref, watch } from 'vue';
import MessageInfo from './MessageInfo.vue';

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
    return marked.parse(message.content)
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
