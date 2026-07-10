const n=`<template>
  <d-modal
    :name="
      hasErrorData
        ? t('cash.there_are_not_enough_founds_the_cash_register')
        : t('error')
    "
    :dataContainerWidth="'450px'"
    @closeDialog="closeDialog"
  >
    <div>
      <div v-if="hasErrorData" class="error-modal">
        <div class="section">
          <div class="title">{{ t("cash.current_balance") }}:</div>
          <div class="sum">
            {{
              getFormattedAmount(
                expenseStore?.modalErrorData.ErrorData?.CurrentBalance,
              )
            }}
          </div>
        </div>
        <div class="section">
          <div class="title">{{ t("cash.expense") }}:</div>
          <div class="sum">
            {{
              getFormattedAmount(
                expenseStore?.modalErrorData.ErrorData?.Expense,
              )
            }}
          </div>
        </div>
        <div class="section">
          <div class="title">{{ t("cash.after_balance") }}:</div>
          <div class="sum">
            {{
              getFormattedAmount(
                expenseStore?.modalErrorData.ErrorData?.AfterBalance,
              )
            }}
          </div>
        </div>
      </div>
      <div v-else class="fs-14">
        {{ expenseStore.modalErrorData?.Messages?.join(", ") }}
      </div>
    </div>
    <template #footer>
      <div class="flex items-center justify-between page-gap">
        <m-btn group="outlined" @click="closeDialog">
          {{ t("cash.log_out") }}
        </m-btn>
        <m-btn @click="saveFunction">{{ t("cash.pay") }}</m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup>
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { ErrorCode } from "~/variable/error-code-contants";

// store
const expenseStore = useCashExpenses("main");

//state
const { t } = useI18n();

// methods
const saveFunction = () => {
  expenseStore
    .saveExpense(null, "modal-expense")
    .then((resp) => {
      notify({ title: "Успешно разделить", type: "success" });
      expenseStore.modalErrorData = null;
    })
    .catch((error) => {
      expenseStore.modalErrorData = null;
    });
};

const closeDialog = () => {
  expenseStore.modalErrorData = null;
};

// hooks

const hasErrorData = computed(() => {
  return (
    ErrorCode.ProfitDepositNegativeBalanceNotAccepted ===
    expenseStore.modalErrorData.ErrorCode
  );
});
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
</style>
`;export{n as default};
