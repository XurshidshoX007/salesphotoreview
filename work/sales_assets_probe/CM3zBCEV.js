const n=`<template>
  <d-modal
    :name="(isFailedCount && t('cash.error_import_file')) || t('successful')"
    @closeDialog="closeDialog"
  >
    <flex-col class="gap-5">
      <div class="section">
        <div class="file_total_name">
          {{ t("cash.total_lines_from_imported_file") }}:
        </div>
        <div class="file_count">
          {{ clientsInitialBalanceStore.excelFailedResponse?.total_count }}
        </div>
      </div>
      <div class="section">
        <div class="file_success_name">
          {{ t("cash.successfully_executed_lines_imported_file") }}:
        </div>
        <div class="file_count">
          {{ clientsInitialBalanceStore.excelFailedResponse?.success_count }}
        </div>
      </div>
      <div v-if="isFailedCount" class="section">
        <div class="file_error_name">
          {{ t("cash.failed_lines_imported_file") }}:
        </div>
        <div class="file_count">
          {{ clientsInitialBalanceStore.excelFailedResponse?.failed_count }}
        </div>
      </div>
      <div class="flex items-center justify-between">
        <m-btn v-if="isFailedCount" class="w-full" @click="uploadExcelFile">
          {{ t("cash.download_file_with_error_lines") }}
        </m-btn>
      </div>
    </flex-col>
  </d-modal>
</template>

<script setup lang="ts">
// store
const clientsInitialBalanceStore = useClientsInitialBalanceStore("main");

//state

import { useI18n } from "vue-i18n";

const { t } = useI18n();

// hooks

const isFailedCount = computed(() => {
  return clientsInitialBalanceStore.excelFailedResponse?.failed_count > 0;
});

// emit
const emit = defineEmits(["closeDialog"]);

// methods
const uploadExcelFile = () => {
  const byteCharacters = atob(
    clientsInitialBalanceStore.excelFailedResponse?.file_content,
  );
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = clientsInitialBalanceStore.excelFailedResponse?.file_name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const closeDialog = () => {
  emit("closeDialog");
};
<\/script>

<style lang="scss" scoped>
.section {
  display: flex;
  justify-content: space-between;
  gap: 0 4px;
  align-items: center;

  .file_success_name {
    font-family: "Inter", sans-serif;
    font-weight: 500;
    font-size: 14px;
    color: rgb(33, 148, 49);
    display: inline;
  }

  .file_error_name {
    font-family: "Inter", sans-serif;
    font-weight: 500;
    font-size: 14px;
    color: #ff1919;
  }
  .file_total_name {
    font-family: "Inter", sans-serif;
    font-weight: 500;
    font-size: 14px;
    color: rgb(0, 0, 0);
  }

  .file_count {
    font-family: "Inter", sans-serif;
    font-weight: 500;
    font-size: 14px;
    color: #424f4f;
  }
}
</style>
`;export{n as default};
