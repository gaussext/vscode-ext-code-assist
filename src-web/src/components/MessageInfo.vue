<template>
    <el-tooltip class="item" effect="dark" placement="top">
        <template #content>
            <div class="tooltip">
                <div class="tooltip__item">
                    <span>Model :</span>
                    <span>{{ message.model }}</span>
                </div>
                <div class="tooltip__item">
                    <span>Token :</span>
                    <span>{{ info.tokens }} Token</span>
                </div>
                <div class="tooltip__item">
                    <span>Duration :</span>
                    <span>{{ info.second }} Sec</span>  
                </div>
                <div class="tooltip__item">
                    <span>Speed: </span>
                    <span>{{ info.speed }} Token/s</span>
                </div>
            </div>
        </template>
        <el-icon>
            <QuestionFilled />
        </el-icon>
    </el-tooltip>
</template>
<script lang="ts" setup>
import { ChatMessage } from '@/models/Model';
import { getTokenCount } from '@/utils';
import { QuestionFilled } from '@element-plus/icons-vue';

const props = defineProps({
    message: {
        default: () => new ChatMessage('system')
    }
})

const getInfoFromMessage = (message: ChatMessage) => {
    const duration = message.timestamp - message.startTime || 1000;
    const second = (duration / 1000).toFixed(2)
    const tokens = getTokenCount(message.content);
    const speed = (tokens * 1000 / duration).toFixed(2);
    return {
        second,
        speed,
        tokens
    }
}

const info = getInfoFromMessage(props.message);

</script>
<style lang="scss" scoped>
.tooltip__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
}
</style>