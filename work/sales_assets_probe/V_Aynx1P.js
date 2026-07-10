const e=`<template>
  <d-modal :name="t('invoices.details')" @close-dialog="closeDialog">
    <flex-col class="gap-4">
      <flex-row
        v-for="(item, key) in formattedDetail"
        :key="key"
        v-show="item"
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
import type { PaymentBatchDetailModel } from "~/interfaces/api/clients/payment-batch-detail-model";

// props
const props = defineProps<{
  id: string;
}>();

// emits
const emit = defineEmits<{
  (e: "closeDialog"): void;
}>();

// store
const clientsBalancesStore = useClientsBalancesStore("main");

// states
const { t } = useI18n();
const detail = ref<PaymentBatchDetailModel[]>();

// hooks
onMounted(async () => await getDetail());

const formattedDetail = computed(() => {
  if (!detail.value) return null;
  return {
    [t("users.agents.agent")]: detail.value[0].agent.name || "",
    [t("column.client_name")]: detail.value[0].client.name || "",
    [t("column.currency")]: detail.value[0].currency.name || "",
    [t("column.expeditor")]: detail.value[0].expeditor.name || "",
    [t("suppliers.payment.payment_amount")]: getFormattedAmount(
      detail.value[0].payment_amount
    ),
    [t("column.payment_received_date")]: getFormattedDate(
      detail.value[0].payment_received_date
    ),
    [t("column.payment_date")]: getFormattedDate(detail.value[0].payment_date),
    [t("settings_sidebar.trade_direction")]:
      detail.value[0].trade_direction.name || "",
    [t("column.description")]: detail.value[0].comment || "",
    [t("column.order")]: detail.value[0].order.name || "",
    [t("column.cash")]: detail.value[0].cash_box.name || "",
  };
});

// methods
const closeDialog = () => {
  emit("closeDialog");
};

const getDetail = async () => {
  const res = await clientsBalancesStore.getMultiplePaymentsInfo([props.id]);
  if (res !== "error") {
    detail.value = res as PaymentBatchDetailModel[];
  } else {
    closeDialog();
  }
};
<\/script>
`;export{e as default};
