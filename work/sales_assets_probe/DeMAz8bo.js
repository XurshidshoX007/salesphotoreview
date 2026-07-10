const e=`<template>
  <flex-col class="w-full items-center px-4 py-12">
    <p class="text-sm text-center text-green-600 font-medium mb-4">
      Импорт завершен
    </p>

    <SettingsProductsExcelDialogFileTemplate
      :file-name="fileName"
      :size="size"
      :percent="100"
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
}

defineProps<Props>();
<\/script>
`;export{e as default};
