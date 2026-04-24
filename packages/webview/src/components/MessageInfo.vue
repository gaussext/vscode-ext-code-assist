<template>
  <el-tooltip class="item" effect="dark" placement="top">
    <template #content>
      <div class="tooltip">
        <div class="tooltip__item">
          <span>Model :</span>
          <span>{{ message.model }}</span>
        </div>
        <div class="tooltip__item">
          <span>Load Duration :</span>
          <span>{{ info.loadDuration }} Second</span>
        </div>
        <div class="tooltip__item">
          <span>Eval Duration :</span>
          <span>{{ info.evalDuration }} Second</span>
        </div>
        <div class="tooltip__item">
          <span>Total Duration :</span>
          <span>{{ info.totalDuration }} Second</span>
        </div>
        <div class="tooltip__item">
          <span>Token :</span>
          <span>{{ info.tokens }} Tokens</span>
        </div>
        <div class="tooltip__item">
          <span>Token Speed: </span>
          <span>{{ info.tokensSpeed }} Tokens/s</span>
        </div>
        <div class="tooltip__item">
          <span>Char :</span>
          <span>{{ info.chars }} Chars</span>
        </div>
        <div class="tooltip__item">
          <span>Char Speed: </span>
          <span>{{ info.charsSpeed }} Chars/s</span>
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
    default: () => new ChatMessage('system', ''),
  },
});

const getInfoFromMessage = (message: ChatMessage) => {
  const loadDuration = ((message.loadTime - message.startTime || 1000) / 1000).toFixed(2);
  const evalDuration = ((message.endTime - message.loadTime || 1000) / 1000).toFixed(2);
  const totalDuration = ((message.endTime - message.startTime || 1000) / 1000).toFixed(2);
  const tokens = getTokenCount(message.content);
  const tokensSpeed = (tokens / parseFloat(evalDuration)).toFixed(2);
  const chars = message.content.length;
  const charsSpeed = (chars / parseFloat(evalDuration)).toFixed(2);
  return {
    loadDuration,
    evalDuration,
    totalDuration,
    tokens,
    tokensSpeed,
    chars,
    charsSpeed,
  };
};

const info = getInfoFromMessage(props.message);
</script>
<style lang="scss" scoped>
.tooltip__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
</style>
