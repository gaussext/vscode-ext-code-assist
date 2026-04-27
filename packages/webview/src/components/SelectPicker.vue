<template>
  <div ref="wrapperRef" class="vscode-select-picker" tabindex="-1">
    <div
      class="select-trigger"
      :class="{ open: isOpen, disabled }"
      @click="toggleOpen"
      @keydown.enter.prevent="toggleOpen"
      @keydown.escape.prevent="close"
    >
      <span class="select-value" :class="{ placeholder: !selectedLabel }">
        {{ selectedLabel || placeholder }}
      </span>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" />
      </svg>
    </div>
    <Transition name="dropdown-fade">
      <div v-if="isOpen" class="select-dropdown">
        <div class="select-search">
          <input
            ref="searchInputRef"
            v-model="filterText"
            class="search-input"
            placeholder="Filter..."
            @click.stop
            @keydown.escape.stop="close"
          />
        </div>
        <div class="select-options">
          <template v-for="group in filteredGroups" :key="group.label">
            <div class="option-group-label">{{ group.label }}</div>
            <div
              v-for="option in group.options"
              :key="option.value"
              class="option-item"
              :class="{ selected: option.value === modelValue }"
              @click="selectOption(option.value)"
            >
              {{ option.label }}
            </div>
          </template>
          <div v-if="filteredGroups.length === 0" class="no-results">
            No matches found
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import type { IStandardItem } from '@/types';
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue';

export interface GroupOption {
  label: string;
  options: IStandardItem<string>[];
}

const props = withDefaults(defineProps<{
  modelValue: string;
  options: GroupOption[];
  placeholder?: string;
  disabled?: boolean;
}>(), {
  placeholder: 'Select...',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const isOpen = ref(false);
const filterText = ref('');
const wrapperRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

const selectedLabel = computed(() => {
  for (const group of props.options) {
    const found = group.options.find((o) => o.value === props.modelValue);
    if (found) return found.label;
  }
  return '';
});

const filteredGroups = computed(() => {
  if (!filterText.value) return props.options;
  const lower = filterText.value.toLowerCase();
  return props.options
    .map((group) => ({
      ...group,
      options: group.options.filter((o) =>
        o.label.toLowerCase().includes(lower),
      ),
    }))
    .filter((group) => group.options.length > 0);
});

const toggleOpen = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    filterText.value = '';
    nextTick(() => searchInputRef.value?.focus());
  }
};

const close = () => {
  isOpen.value = false;
  filterText.value = '';
};

const selectOption = (value: string) => {
  emit('update:modelValue', value);
  close();
};

const handleClickOutside = (e: MouseEvent) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    close();
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>

<style lang="scss" scoped>
.vscode-select-picker {
  position: relative;
  width: 100%;
  font-size: 14px;
  outline: none;

  .select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid var(--vscode-dropdown-border);
    background: var(--vscode-dropdown-background);
    color: var(--vscode-dropdown-foreground);
    cursor: pointer;
    user-select: none;
    transition: border-color 0.2s;

    &:hover {
      border-color: var(--vscode-inputOption-activeBorder);
    }

    &.open {
      border-color: var(--vscode-inputOption-activeBorder);
      border-radius: 4px 4px 0 0;
    }

    &.disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .select-value {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.placeholder {
        color: var(--vscode-input-placeholderForeground);
      }
    }

    svg {
      flex-shrink: 0;
      margin-left: 4px;
      color: var(--vscode-icon-foreground);
    }
  }

  .select-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 100;
    border: 1px solid var(--vscode-inputOption-activeBorder);
    border-top: none;
    border-radius: 0 0 4px 4px;
    background: var(--vscode-editor-background);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    overflow: hidden;

    .select-search {
      padding: 6px;
      border-bottom: 1px solid var(--vscode-dropdown-border);

      .search-input {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid var(--vscode-dropdown-border);
        border-radius: 2px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        font-size: 13px;
        outline: none;
        box-sizing: border-box;

        &:focus {
          border-color: var(--vscode-focusBorder);
        }

        &::placeholder {
          color: var(--vscode-input-placeholderForeground);
        }
      }
    }

    .select-options {
      max-height: 280px;
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;

      .option-group-label {
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 600;
        color: var(--vscode-disabledForeground);
        border-bottom: 1px solid var(--vscode-dropdown-border);
        background: var(--vscode-editor-background);
        position: sticky;
        top: 0;
      }

      .option-item {
        padding: 6px 12px;
        cursor: pointer;
        color: var(--vscode-dropdown-foreground);
        transition: background-color 0.15s;

        &:hover {
          background: var(--vscode-list-hoverBackground);
        }

        &.selected {
          background: var(--vscode-inputOption-hoverBackground);
          color: var(--vscode-list-activeSelectionForeground);
        }
      }

      .no-results {
        padding: 12px;
        text-align: center;
        color: var(--vscode-disabledForeground);
        font-size: 13px;
      }
    }
  }
}

.dropdown-fade-enter-active {
  transition: opacity 0.15s ease;
}

.dropdown-fade-leave-active {
  transition: opacity 0.1s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
}
</style>
