const n=`<template>
  <div
    class="text-sm bg-neutral-50 text-neutral-400 py-2.5 px-5 grid grid-cols-6 border-t border-neutral-200"
  >
    <div>{{ t("settings_sidebar.products") }}</div>
    <div>{{ t("column.in_stock") }}</div>
    <div v-for="check in checkTypes" :key="check.key">
      {{ check.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";

// types
interface Props {
  checkTypes: ConstantModel[];
}

// props
const props = defineProps<Props>();

// states
const { t } = useI18n();
<\/script>
`;export{n as default};
