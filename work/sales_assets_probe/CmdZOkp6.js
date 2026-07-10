const e=`<template>
  <d-modal :name="t('invoices.details')" @close-dialog="closeDialog">
    <flex-col class="gap-4">
      <flex-row
        v-for="(item, key) in formattedDetail"
        :key="key"
        class="justify-between items-center border-b last-border-b-0 py-2"
      >
        <div>
          {{ key }}
        </div>
        <div>
          {{ item }}
        </div>
      </flex-row>
    </flex-col>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ClientFinanceExpensePaymentDetailModel } from "~/interfaces/api/clients/expense-payment-models";

// props
const props = defineProps<{
  id: string;
}>();

// emits
const emit = defineEmits<{
  (e: "closeDialog"): void;
}>();

// store
const expenseStore = useClientsExpensePaymentStore("main");

// states
const { t } = useI18n();
const detail = ref<ClientFinanceExpensePaymentDetailModel>();

// hooks
onMounted(async () => await getDetail());

const formattedDetail = computed(() => {
  if (!detail.value) return null;
  return {
    [t("column.id")]: detail.value.visual_id || "",
    [t("column.created_date")]: getFormattedDate(detail.value.created_date),
    [t("column.last_modified_date")]: getFormattedDate(
      detail.value.last_modified_date
    ),
    [t("column.payment_date")]: getFormattedDate(detail.value.payment_date),
    [t("column.payment_approved_date")]: getFormattedDate(
      detail.value.payment_approved_date
    ),
    [t("suppliers.payment.payment_amount")]: getFormattedAmount(
      detail.value.payment_amount
    ),
    [t("column.balance")]: getFormattedAmount(detail.value.balance),
    [t("column.currency")]: detail.value.currency.name || "",
    [t("users.agents.agent")]: detail.value.agent.name || "",
    [t("column.expeditor")]: detail.value.expeditor.name || "",
    [t("column.cash")]: detail.value.cash_box.name || "",
    [t("column.created_by")]: detail.value.created_by.name || "",
    [t("column.last_modified_by")]: detail.value.last_modified_by.name || "",
    [t("settings_sidebar.trade_direction")]:
      detail.value.trade_direction.name || "",
    [t("column.client_name")]: detail.value.client.name || "",
    [t("column.client_id")]: detail.value.client.visual_id || "",
    [t("column.client_phone")]: detail.value.client.phone || "",
    [t("column.client_balance")]: getFormattedAmount(
      detail.value.client.balance
    ),
    [t("column.client_company_name")]: detail.value.client.company_name || "",
    [t("clients.client_territory")]: detail.value.client.territory.name || "",
    [t("column.description")]: detail.value.description || "",
  };
});

// methods
const closeDialog = () => {
  emit("closeDialog");
};

const getDetail = async () => {
  const res = await expenseStore.getDetail(props.id);
  if (res !== "error") {
    detail.value = res as ClientFinanceExpensePaymentDetailModel;
  } else {
    // closeDialog();
  }
};
<\/script>
`;export{e as default};
