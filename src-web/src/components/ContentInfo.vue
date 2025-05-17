<template>
    <div class="info-block">
        <div class="info-item">
            <span>U</span>
            <span>{{ info.user }}</span>
            <span>/</span>
            <el-icon>
                <Top />
            </el-icon>
            <span>{{ info.upload }}</span>
            <span>/</span>
            <el-icon>
                <Bottom />
            </el-icon>
            <span>{{ info.assistant }}</span>
        </div>
        <div class="info-item">
            <span>Use</span>
            <span>{{ info.window }}</span>
            <span>/</span>
            <span>Max</span>
            <span>{{ MAX_TOKEN_LENGTH }}</span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { MAX_TOKEN_LENGTH } from "@/utils/constants";
const props = defineProps({
    info: {
        type: Object,
        default: () => ({
            temp: 0,
            user: 0,
            assistant: 0,
            upload: 0,
            window: 0,
            width: 0
        })
    }
})
</script>

<style>
.info-item {
    display: flex;
    align-items: center;
    line-height: 14px;
    gap: 4px;
    color: #ccc;
    font-size: 12px;
    font-family: monospace;
}

.info-item i {
    vertical-align: middle;
}

.icon-block {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.icon-block svg {
    cursor: pointer;
}

.icon-block svg:hover {
    color: #409eff;
}
</style>