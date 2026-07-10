const n=`<template>
  <div class="flex items-center gap-2">
    <rounded-icon-btn
      v-if="editable"
      type="edit"
      without-border
      :iconSize="20"
      :tooltip="t('labels.consignation_change_term')"
      @click="emit('edit')"
    />
    <div
      class="text-sm border rounded-lg px-2.5 py-[3px] max-w-[150px] min-w-0 overflow-hidden"
    >
      <span class="truncate block w-full">{{ formattedValue }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getFormattedDate } from "~/utils/formatters";

// Props
const props = defineProps<{
  value?: string;
  editable?: boolean;
}>();

// Emits
const emit = defineEmits<{
  (e: "edit"): void;
}>();

// Composables
const { t } = useI18n();

// Computed
const formattedValue = computed(() => {
  return getFormattedDate(props.value) || t("filters.no");
});
<\/script>
`;export{n as default};
