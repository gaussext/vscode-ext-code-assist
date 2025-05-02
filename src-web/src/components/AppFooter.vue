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