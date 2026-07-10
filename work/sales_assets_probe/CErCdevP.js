const n=`<template>
  <div
    v-if="!hasData"
    class="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
  >
    <div
      class="absolute inset-0"
      style="
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        background: rgba(255, 255, 255, 0.3);
      "
    />
    <p class="relative text-sm font-medium text-neutral-500">
      {{ t("filters.no_data") }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  hasData: boolean;
}>();

const { t } = useI18n();
<\/script>
`;export{n as default};
