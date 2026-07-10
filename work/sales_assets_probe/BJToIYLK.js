const e=`<template>
  <flex-col class="w-full items-center">
    <IconExcelSVG :size="48" class="mb-2" />

    <p class="text-neutral-400 font-medium text-sm max-w-64 text-center !mb-4">
      {{ t("settings.import_products_from_excel_file") }}
    </p>
  </flex-col>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// Composables
const { t } = useI18n();
<\/script>
`;export{e as default};
