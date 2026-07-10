const n=`<template>
  <div
    class="w-[190px] min-w-[190px] h-[190px] rounded-xl border-2 border-dashed border-neutral-200 flex items-center justify-center cursor-pointer transition-all duration-200 bg-neutral-50 hover:border-[#299b9b] hover:bg-[#f0fafa] group"
    @click="!isLoading && $emit('click')"
  >
    <div class="flex flex-col items-center gap-2">
      <icon-loading
        :width="6"
        :height="6"
        v-show="isLoading"
        :loading="isLoading"
      />

      <div v-show="!isLoading" class="flex items-center justify-center">
        <IconImage
          class="text-3xl text-[#8fa0a0] group-hover:text-[#299b9b] transition-colors duration-200"
        />
      </div>
      <span
        v-show="!isLoading"
        class="text-xs font-medium text-[#8fa0a0] font-['Inter',sans-serif] text-center transition-colors duration-200 group-hover:text-[#299b9b]"
      >
        {{ t("settings.upload_image") }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// Props
defineProps<{
  isLoading?: boolean;
}>();

// Emits
defineEmits(["click"]);

// Composables
const { t } = useI18n();
<\/script>
`;export{n as default};
