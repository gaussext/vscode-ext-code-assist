<template>
  <el-dialog v-model="visible" title="配置模型" width="500" @closed="onClosed">
    <el-form :model="form" :label-width="100">
      <el-form-item label="模型供应商">
        <el-select
          class="el-select--vscode"
          v-model="form.vendorId"
          @change="onVendorChange"
        >
          <el-option
            v-for="option in vendors"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="模型类别">
        <el-select class="el-select--vscode" v-model="form.modelId">
          <el-option
            v-for="option in models"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          >
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="onCancelClick">取消</el-button>
        <el-button type="primary" @click="onConfirmClick"> 确认 </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { chatService, type ChatVendor } from "@/api";
import { type StandardItem } from "@/types";
import { firstElement } from "@/utils";
import { onMounted, reactive, ref } from "vue";

const visible = ref(true);
const props = defineProps({
  vendorId: {
    default: "",
  },
  modelId: {
    default: "",
  },
});

const form = reactive({
  vendorId: props.vendorId,
  modelId: props.modelId,
});

const vendors: StandardItem<ChatVendor>[] = [
  {
    value: "ollama",
    label: "ollama",
  },
  {
    value: "deepseek",
    label: "deepseek",
  },
];

const onVendorChange = (vendor: ChatVendor) => {
  chatService.setVendor(vendor);
  setTimeout(() => {
    getModels();
  });
};

const models = ref<StandardItem<string>[]>([]);
const getModels = async () => {
  const res = await chatService.getModels();
  const modelsList = res.data.models || [];
  const sortedModels = [...modelsList].sort((a, b) =>
    a.label.localeCompare(b.label)
  );
  models.value = sortedModels;
  if (
    !props.modelId ||
    !sortedModels.find((model) => model.value === props.modelId)
  ) {
    form.modelId = firstElement(sortedModels).value;
  }
};

let operation: "submit" | "cancel" = "submit";
const onCancelClick = () => {
  operation = "cancel";
  visible.value = false;
};

const onConfirmClick = () => {
  operation = "submit";
  visible.value = false;
};

const emit = defineEmits(["cancel", "submit"]);

const onClosed = () => {
  emit(operation, form);
};

onMounted(() => {
    getModels();
});
</script>
