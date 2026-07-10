const e=`<template>
  <flex-col class="w-full items-center">
    <p class="text-center text-red-600 font-medium mb-1.5">Ошибка загрузки</p>

    <p class="max-w-72 w-full text-sm text-center text-red-400">
      {{ error }}
    </p>

    <SettingsProductsExcelDialogFileTemplate
      :file-name="fileName"
      :size="size"
      :percent="percent"
      :error="error"
      class="mb-4"
      @clear-file="() => emits('clearFile')"
    />
  </flex-col>
</template>

<script setup lang="ts">
// Emits

const emits = defineEmits<{
  (e: "clearFile"): void;
}>();

// Props

interface Props {
  fileName?: string;
  size?: number;
  percent?: number;
  error?: string | boolean;
}

defineProps<Props>();
<\/script>
`;export{e as default};
