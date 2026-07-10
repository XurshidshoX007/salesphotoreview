const n=`<template>
  <div>
    <d-modal
      :name="t('cash.the_cash_enough_founds')"
      @closeDialog="closeDialog"
    >
      <div class="text-red-600 font-medium mb-4">
        {{ cashExpansesStore?.modalErrorData?.Messages[0] }}
      </div>
      <div class="error-modal">
        <div class="section">
          <div class="title">{{ t("cash.current_balance") }}:</div>
          <div class="sum">
            {{
              getFormattedAmount(
                cashExpansesStore?.modalErrorData?.ErrorData?.CurrentBalance ??
                  0,
              )
            }}
          </div>
        </div>
        <div class="section">
          <div class="title">{{ t("cash.expense") }}:</div>
          <div class="sum">
            {{
              getFormattedAmount(
                cashExpansesStore?.modalErrorData?.ErrorData?.Expense ?? 0,
              )
            }}
          </div>
        </div>
        <div class="section">
          <div class="title">{{ t("cash.after_balance") }}:</div>
          <div class="sum">
            {{
              getFormattedAmount(
                cashExpansesStore?.modalErrorData?.ErrorData?.AfterBalance ?? 0,
              )
            }}
          </div>
        </div>
      </div>
      <template #footer>
        <div class="modal-footer">
          <m-btn group="outlined" @click="closeDialog">
            {{ t("clients.cancel") }}
          </m-btn>
          <m-btn :loading="saveLoading" @click="saveFunction">
            {{ t("cash.pay") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </div>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useClientsExpensePaymentStore } from "~/stores/clients/client-expense-payment/client-expense";
import { useI18n } from "vue-i18n";
import { getFormattedAmount } from "~/utils/filter";

//store
const cashExpansesStore = useClientsExpensePaymentStore("main");

// emit
const emit = defineEmits(["closeDialog", "refresh"]);

//state
const saveLoading = ref(false);
const { t } = useI18n();

// methods
const saveFunction = async () => {
  saveLoading.value = true;
  try {
    const response = await cashExpansesStore.saveExpenseClient(
      null,
      "modal-expense",
    );
    emit("refresh");
    if (response !== "error") {
      notify({ title: t("successful"), type: "success" });
      cashExpansesStore.modalErrorData = null;
    }
  } catch (error) {
    // Let default error handling take care of unexpected errors
  } finally {
    saveLoading.value = false;
  }
};

const closeDialog = () => {
  cashExpansesStore.modalErrorData = null;
};
<\/script>

<style scoped lang="scss">
.error-modal {
  width: 100%;

  .section {
    padding: 6px 0px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      color: #424f4f;
      font-family: Inter, sans-serif;
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 140%;
    }

    .sum {
      color: #299b9b;
      font-family: Inter, sans-serif;
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 140%;
    }
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
`;export{n as default};
