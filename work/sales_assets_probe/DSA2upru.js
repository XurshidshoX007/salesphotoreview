const n=`<template>
  <d-modal
    dataContainerWidth="400px"
    :name="t('reports.universal_sales_report.format_date_dialog_title')"
    @closeDialog="closeDialog"
  >
    <flex-col>
      <RadioBtn
        :items="formatItems"
        :selectedItem="chosenFormat"
        group="column"
        @onSelectItemId="selectedFormatId = $event"
      />
    </flex-col>
    <template #footer>
      <div class="flex justify-between">
        <cancel-btn @click="closeDialog">{{ t("reports.cancel") }}</cancel-btn>
        <m-btn @click="onChooseFormat">{{ t("apply") }}</m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  chosenFormat: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "onChooseFormat"]);

// states
const { t } = useI18n();
const selectedFormatId = ref<string | null>(null);

const formats = ref<string[]>([
  "YYYY.MM.DD",
  "YYYY.MM.DD HH:mm",
  "YYYY-MM-DD",
  "YYYY-MM-DD HH:mm",
  "YYYY/MM/DD",
  "YYYY/MM/DD HH:mm",
  "DD.MM.YYYY",
  "DD.MM.YYYY HH:mm",
  "DD-MM-YYYY",
  "DD-MM-YYYY HH:mm",
  "DD/MM/YYYY",
  "DD/MM/YYYY HH:mm",
]);

// hooks
const formatItems = computed(() => {
  const getNow = new Date();
  return formats.value.map((format) => ({
    id: format,
    name: getFormattedDate(getNow.toString(), format),
  }));
});

// methods
const closeDialog = () => emit("closeDialog");

const onChooseFormat = () => {
  emit("onChooseFormat", selectedFormatId.value);
  closeDialog();
};
<\/script>
`;export{n as default};
