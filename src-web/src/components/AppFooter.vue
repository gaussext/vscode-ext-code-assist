<template>
    <div class="footer-area">
        <textarea type="textarea" ref="inputRef" class="vscode-textarea" id="chat-input" placeholder="请输入您的问题" v-model="modelValue"
            @keypress="handleKeyPress" :disabled="loading">
    </textarea>
        <el-button class="vscode-button-full" id="chat-button" type="primary" @click="$emit('click')">
            {{ loading ? "停止" : "发送" }}
        </el-button>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
const modelValue = defineModel<string>({ required: true })

const props = defineProps({
    loading: {
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