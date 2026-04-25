<template>
  <div class="usage-info">
    <span>Context</span>
    <span>{{ info.window }}</span>
    <span>/</span>
    <span>Max</span>
    <span>{{ MAX_TOKEN_LENGTH }}</span>
  </div>
</template>

<script lang="ts" setup>
import { MAX_TOKEN_LENGTH } from '@/stores/constants';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({
      temp: 0,
      user: 0,
      assistant: 0,
      upload: 0,
      window: 0,
      width: 0,
    }),
  },
});
</script>

<style>
.usage-info {
  display: flex;
  align-items: center;
  line-height: 14px;
  gap: 4px;
  color: var(--vscode-icon-foreground);
  font-size: 12px;
  font-family: monospace;

  i {
    vertical-align: middle;
  }
}
</style>
