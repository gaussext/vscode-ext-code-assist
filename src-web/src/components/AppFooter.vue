<template>
    <div class="footer-area">
        <textarea type="textarea" ref="inputRef" class="vscode-textarea" id="chat-input" placeholder="请输入您的问题"
            v-model="modelValue" @keypress="handleKeyPress" :disabled="loading">
    </textarea>
        <div id="chat-tool">
            <el-select :model-value="modelId" class="chat-select" placeholder="请选择模型" @change="handleChange"
                :disabled="loading">
                <el-option v-for="item in models" :key="item.value" :label="item.label" :value="item.value">
                </el-option>
            </el-select>
            <el-button id="chat-button" :type="loading ? 'danger' : 'primary'" @click="$emit('click')">
                <el-icon v-if="loading">
                    <VideoPause />
                </el-icon>
                <el-icon v-else>
                    <Promotion />
                </el-icon>
            </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ChatModel, type IModel } from "@/setting";
import { ref, watch } from "vue";
const modelValue = defineModel<string>({ required: true })

const props = defineProps({
    loading: {
        default: false
    },
    model: {
        default: () => new ChatModel()
    },
    models: {
        default: () => [] as IModel[]
    }
})
const modelId = ref(props.model?.value || '')

watch(() => props.model, (value) => {
    modelId.value = value.value;
}, { deep: true })

const emit = defineEmits(['update:model', 'click']);

const inputRef = ref<HTMLTextAreaElement | null>(null);

const handleChange = (value: string) => {
    const model = props.models.find((item) => item.value === value);
    emit('update:model', model);
}

const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        emit("click");
    }
};
</script>