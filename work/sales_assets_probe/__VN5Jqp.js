const o=`<template>
  <d-modal
    data-container-width="800px"
    :name="t('reports.universal_sales_report.choose_report_to_view')"
    @closeDialog="closeDialog"
  >
    <ReportsUniversalSalesReportSavedReportsBlock
      without-padding
      @on-choose-config="onChooseConfig"
    />
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// states
const { t } = useI18n();

// emits
const emit = defineEmits(["closeDialog", "onChooseConfig"]);

const onChooseConfig = (configId: string) => {
  emit("onChooseConfig", configId);
  closeDialog();
};

const closeDialog = (): void => emit("closeDialog");
<\/script>
`;export{o as default};
