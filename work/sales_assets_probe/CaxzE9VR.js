const n=`<template>
  <d-modal
    only-close-dialog
    :name="hasErrorData ? errorMessages : t('error')"
    data-container-width="500px"
    @closeDialog="closeDialog"
  >
    <flex-col v-if="hasErrorData" class="error-modal-content">
      <div v-for="item in errorData" :id="item.key" class="section">
        <span class="key">
          {{
            clientsInitialBalanceStore.getInitialBalanceExcelErrorTitle(
              item.key,
            )
          }}:
        </span>
        <span class="result">
          {{ item.value }}
        </span>
      </div>
    </flex-col>
    <div v-else class="fs-14">
      {{ errorMessages }}
    </div>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ErrorCode } from "~/variable/error-code-contants";

//store

const clientsInitialBalanceStore = useClientsInitialBalanceStore("main");

//states
const { t } = useI18n();
const errorData = ref([]);
// methods
const emit = defineEmits(["closeDialog"]);
const closeDialog = () => {
  emit("closeDialog");
};

const setSelectedErrorData = () => {
  for (const [key, value] of Object.entries(
    clientsInitialBalanceStore.excelErrorData?.ErrorData,
  )) {
    if (value?.length) {
      // Check if the value is not empty or undefined
      errorData.value.push({
        key: key,
        value: value.join(", "),
      });
    }
  }
};

// hooks
const hasErrorData = computed(() => {
  return (
    clientsInitialBalanceStore.excelErrorData?.ErrorCode ===
    ErrorCode.IncomingClientCreateDataForImportIsIncorrect
  );
});

const errorMessages = computed(() => {
  return clientsInitialBalanceStore.excelErrorData?.Messages?.join(", ");
});

onMounted(() => {
  setSelectedErrorData();
});
<\/script>

<style lang="scss">
.error-modal-content {
  gap: 20px;

  .error-modal-title {
    color: #000000;
    font-weight: 500;
    font-family: "Inter", sans-serif;
    font-size: 18px;
    text-align: center;
  }

  .section {
    align-items: center;
    gap: 4px;

    .key {
      color: #8fa0a0;
      font-family: "Inter", sans-serif;
      font-weight: 400;
      font-size: 14px;
    }

    .result {
      font-size: 14px;
      color: #424f4f;
      font-family: "Inter", sans-serif;
      font-weight: 400;
    }
  }
}
</style>
`;export{n as default};
