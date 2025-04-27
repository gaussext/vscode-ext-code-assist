<template>
    <div class="chat-container">
        <div class="history-area">
            <select class="vscode-select" id="model-select" :value="chatState.model"
                @change="(e) => updateModel((e.target as HTMLSelectElement).value)">
                <option v-for="model in models" :key="model.name" :value="model.name">
                    {{ model.name }}
                </option>
            </select>

            <select class="vscode-select" id="history-select" :value="props.model.conversationId"
                @change="(e) => props.model.updateConversationId((e.target as HTMLSelectElement).value)">
                <option v-for="conv in props.model.conversations" :key="conv.id" :value="conv.id">
                    {{ conv.title }}
                </option>
            </select>

            <button class="vscode-button-small" id="create-button" @click="props.model.createConversation">
                +
            </button>

            <button class="vscode-button-small" id="delete-button"
                @click="() => props.model.deleteConversation(props.model.conversationId)">
                -
            </button>
        </div>

        <div class="messages-area" id="messages">
            <div v-for="(message, index) in messages" :key="index"
                :class="['message', message.role === 'assistant' ? 'message-ai' : 'message-you']"
                v-html="renderMarkdown(message)" />
            <div ref="messagesEndRef" />
        </div>

        <div class="chat-area">
            <textarea ref="inputRef" class="vscode-textarea" id="chat-input" placeholder="请输入您的问题" :value="inputValue"
                @input="(e) => (inputValue = (e.target as HTMLTextAreaElement).value)"
                @keypress.enter.exact.prevent="sendMessage" :disabled="chatState.isLoading" />

            <button class="vscode-button-full" id="chat-button" @click="sendMessage" :disabled="!inputValue.trim()">
                {{ chatState.isLoading ? '停止' : '发送' }}
            </button>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, watch, PropType } from 'vue'
import { AIModel, Info, Message } from "../Model"
import { createMarkdownInfo } from '../vanilla/Utils'

declare const marked: any
declare const hljs: any

interface ChatState {
    content: string
    isLoading: boolean
    model: string
    tokens: number
    startTime: number
    endTime: number
    duration: number
}

interface ChatModel {
    getModels: () => void
    getConversations: () => void
    getMessages: () => Promise<Message[]>
    addAIMessage: (content: string, info?: any) => void
    chat: (model: string, message: string, history: Message[]) => void
    updateConversationId: (id: string) => void
    createConversation: () => void
    deleteConversation: (id: string) => void
    updateConversationTitle: (title: string) => void
    stop: () => void
    messages: Message[]
    conversations: any[]
    conversationId: string
    state: {
        model: string
    }
}

export default defineComponent({
    name: 'ChatComponent',
    props: {
        model: {
            type: Object as PropType<ChatModel>,
            required: true
        }
    },
    setup(props) {
        // Refs
        const messagesEndRef = ref<HTMLDivElement | null>(null)
        const inputRef = ref<HTMLTextAreaElement | null>(null)

        // State
        const chatState = ref<ChatState>({
            content: '',
            isLoading: false,
            model: props.model.state.model,
            tokens: 0,
            startTime: 0,
            endTime: 0,
            duration: 0
        })

        const inputValue = ref('')
        const models = ref<AIModel[]>([])
        const messages = ref<Message[]>([])

        // 初始化 marked.js
        marked.setOptions({
            highlight: function (code: string, language: string) {
                const validLanguage = hljs.getLanguage(language) ? language : "plaintext"
                return hljs.highlight(validLanguage, code).value
            },
            langPrefix: "hljs language-",
            pedantic: false,
            gfm: true,
            breaks: false,
            sanitize: false,
            smartLists: true,
            smartypants: false,
            xhtml: false
        })

        // 生命周期钩子
        onMounted(() => {
            loadInitialData()
            window.addEventListener('message', handleWindowMessage)
        })

        onUnmounted(() => {
            window.removeEventListener('message', handleWindowMessage)
        })

        // 监听消息变化，滚动到底部
        watch(messages, () => {
            scrollToBottom()
        }, { deep: true })

        // 方法
        const loadInitialData = async () => {
            await Promise.all([
                props.model.getModels(),
                props.model.getConversations()
            ])
            models.value = []
            loadMessages()
            hljs.highlightAll()
        }

        const loadMessages = async () => {
            const loadedMessages = await props.model.getMessages()
            messages.value = loadedMessages
        }

        const handleWindowMessage = (e: MessageEvent) => {
            const { type, data, text } = e.data
            switch (type) {
                case 'tags-end':
                    handleModels(text.models as AIModel[])
                    break
                case 'chat-pre':
                    handleChatRequest()
                    break
                case 'chat-start':
                    handleChatStart()
                    break
                case 'chat-data':
                    handleChatData(data)
                    break
                case 'chat-end':
                    handleChatEnd()
                    break
                case 'optimization':
                    handleOptimization(text)
                    break
                case 'explanation':
                    handleExplanation(text)
                    break
            }
        }

        const handleModels = (newModels: AIModel[]) => {
            const sortedModels = [...newModels].sort((a, b) => a.name.localeCompare(b.name))
            console.log(sortedModels)
            models.value = sortedModels
        }

        const handleChatRequest = () => {
            chatState.value = {
                ...chatState.value,
                content: '...',
                isLoading: true
            }
            messages.value = [...messages.value, {
                role: 'assistant',
                content: '...',
                info: new Info(),
                timestamp: Date.now()
            }]
        }

        const handleChatStart = () => {
            chatState.value = {
                ...chatState.value,
                content: '',
                tokens: 0,
                startTime: 0,
                endTime: 0
            }
        }

        const handleChatData = (data: any) => {
            const text = data.message.content
            const createdAt = data.created_at ? new Date(data.created_at).getTime() : 0

            const newState = {
                ...chatState.value,
                content: chatState.value.content + text,
                tokens: chatState.value.tokens + 1
            }

            if (createdAt) {
                if (newState.startTime === 0) {
                    newState.startTime = createdAt
                }
                newState.endTime = createdAt
            }

            if (newState.tokens % 2 === 0) {
                updateAIMessage(newState.content)
            }

            chatState.value = newState
        }

        const handleChatEnd = () => {
            const { content, model: currentModel, tokens, startTime, endTime } = chatState.value
            const duration = (endTime - startTime) / 1000

            props.model.addAIMessage(content, {
                model: currentModel,
                tokens,
                duration,
                startTime,
                endTime
            })

            chatState.value = { ...chatState.value, isLoading: false }
            updateAIMessage(content, createMarkdownInfo(chatState.value))
            loadMessages()
        }

        const handleOptimization = (code: string) => {
            if (!code) return
            inputValue.value = `优化一下这段代码\`\`\`${code}\`\`\``
            inputRef.value?.focus()
        }

        const handleExplanation = (code: string) => {
            if (!code) return
            inputValue.value = `解释一下这段代码\`\`\`${code}\`\`\``
            inputRef.value?.focus()
        }

        const updateAIMessage = (content: string, info: string = '') => {
            const newMessages = [...messages.value]
            const lastIndex = newMessages.length - 1

            if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                newMessages[lastIndex] = {
                    ...newMessages[lastIndex],
                    content,
                }
            }

            messages.value = newMessages
        }

        const sendMessage = () => {
            if (!inputValue.value.trim()) return

            if (chatState.value.isLoading) {
                props.model.stop()
                return
            }

            const newMessage: Message = {
                role: 'user',
                content: inputValue.value,
                timestamp: Date.now(),
                info: new Info()
            }

            messages.value = [...messages.value, newMessage]
            props.model.chat(chatState.value.model, inputValue.value, messages.value)
            props.model.updateConversationTitle(inputValue.value)
            inputValue.value = ''
        }

        const scrollToBottom = () => {
            messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
        }

        const renderMarkdown = (message: Message) => {
            return marked.parse(`${message.role === 'assistant' ? 'AI: ' : ''}${message.content} ${message.info || ''}`)
        }

        const updateModel = (model: string) => {
            chatState.value = { ...chatState.value, model }
        }

        return {
            props,
            messagesEndRef,
            inputRef,
            chatState,
            inputValue,
            models,
            messages,
            sendMessage,
            renderMarkdown,
            updateModel
        }
    }
})
</script>

<style scoped>
/* 添加你的样式 */
</style>