<template>
    <div class="chat-area">
        <textarea ref="inputRef" class="vscode-textarea" id="chat-input" placeholder="请输入您的问题" v-model="modelValue"
            @keypress="handleKeyPress" :disabled="isLoading">
    </textarea>
        <button class="vscode-button-full" id="chat-button" @click="$emit('click')">
            {{ isLoading ? "停止" : "发送" }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
const modelValue = defineModel<string>({ required: true })

const props = defineProps({
    isLoading: {
        default: false
    }
})

const emit = defineEmits(['click']);

const inputRef = ref<HTMLTextAreaElement | null>(null);

const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        emit("click");
    }
};
</script>

<style scoped>
.chat-area {
    /* 添加你的样式 */
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
}

.vscode-textarea {
    /* 文本区域样式 */
    width: 100%;
    min-height: 80px;
    padding: 8px;
    resize: none;
}

.vscode-button-full {
    /* 按钮样式 */
    width: 100%;
    padding: 8px;
    cursor: pointer;
}
</style>
