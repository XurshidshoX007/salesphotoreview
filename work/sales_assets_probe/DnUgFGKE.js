const n=`<template>
  <OrdersOrdersOrderPaymentFooter
    :is-saved="isSaved"
    :selected-cashbox-id="selectedCashboxId"
    :selected-date="selectedDate"
    :total-responses="totalResponses"
    :total-success-responses="totalSuccessResponses"
    :show-only-errored-payments="showOnlyErroredPayments"
    :is-btn-loading="isBtnLoading"
    type="application"
    @on-save="onSave"
    @on-select-date="onSelectDate"
    @on-show-only-errored-payments="onShowOnlyErroredPayments"
    @on-change-cashbox-id="onChangeCashboxId"
  />
</template>

<script setup lang="ts">
// props
const props = defineProps<{
  isSaved: boolean;
  selectedCashboxId: string;
  selectedDate: string;
  isBtnLoading?: boolean;
  totalResponses?: number;
  totalSuccessResponses?: number;
  showOnlyErroredPayments?: boolean;
}>();

// emits
const emit = defineEmits([
  "on-save",
  "on-select-date",
  "on-show-only-errored-payments",
  "on-change-cashbox-id",
]);

// methods
const onSave = () => {
  emit("on-save");
};

const onSelectDate = (date: string) => {
  emit("on-select-date", date);
};

const onChangeCashboxId = (id: string) => {
  emit("on-change-cashbox-id", id);
};

const onShowOnlyErroredPayments = (value: boolean) => {
  emit("on-show-only-errored-payments", value);
};
<\/script>
`;export{n as default};
