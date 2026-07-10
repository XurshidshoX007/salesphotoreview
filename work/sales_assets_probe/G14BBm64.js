const e=`<template>
  <div>
    <form id="app" class="w-full relative" @submit.prevent="save">
      <d-modal
        @closeDialog="closeDialog"
        only-close-dialog
        :loading="cashExpenditureStore.isExpenseDetailLoading"
        :title-color="titleColorForHeader"
        :name="debtId ? t('cash.edit_debt') : t('cash.add_debt')"
      >
        <flex-col class="gap-5">
          <DropdownsByFilterStates
            :filterStates="filterStates"
            @onOpenDropdown="filtersStore.onOpenDropdown"
            @search="filtersStore.onSearchDropdown"
          />
          <d-input-date-picker
            :label="t('column.payment_date')"
            :value="data.payment_date"
            disable-future-dates
            :disabled-past-dates="!hasAccess2CreatePaymentWithPastDates"
            @change="data.payment_date = $event"
          />
          <d-input
            :label="t('column.sum')"
            type="number"
            :value="data.payment_amount"
            @change="data.payment_amount = $event"
            required
            status="test"
          />
          <d-input
            :label="t('column.comment')"
            pattern-type="comment"
            :value="data.description"
            @change="data.description = $event"
          />
        </flex-col>
        <template #footer>
          <m-btn :loading="saveLoading" class="w-full" type="submit">
            {{ debtId ? t("save") : t("clients.add") }}
          </m-btn>
        </template>
      </d-modal>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useClientsExpensePaymentStore } from "~/stores/clients/client-expense-payment/client-expense";
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { ClientEmployeeModel } from "~/interfaces/api/users/tasks-models";
import { getFilteredEmployeesByClientId } from "~/utils/filter";
import { getPaymentCurrencyDropdownData } from "~/utils/payment-currency";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";

// Props and Emit
const emit = defineEmits(["closeDialog", "refresh"]);
const props = defineProps({
  clientId: String,
  modalName: String,
  titleColorForHeader: String,
  debtId: String,
});

// Access
const { hasAccess2CreatePaymentWithPastDates } = useCashboxAccess();

// Store
const cashExpenditureStore = useClientsExpensePaymentStore("main");
const filtersStore = useFiltersStore(
  \`"dashboard/cashbox/expense-payment/modal\`,
);

// State
let data = ref({
  id: undefined,
  payment_amount: null,
  currency_id: null,
  client_id: null,
  agent_id: null,
  payment_courier_id: null,
  cash_box_id: null,
  payment_date: new Date().toISOString(),
  trade_direction_id: null,
  description: "",
  // accepted_negative_balance: null,
});
const employedAgents = ref<ClientEmployeeModel[] | undefined>();
const paymentsInfo = ref();

const saveLoading = ref(false);
const { t } = useI18n();
// Methods
const save = async () => {
  saveLoading.value = true;

  try {
    const { id, ...newDataWithoutId } = data.value;
    const isEdit = id !== undefined;
    const apiType = isEdit ? "expense-edit" : "expense";
    const requestData = isEdit ? data.value : newDataWithoutId;

    const response = await cashExpenditureStore.saveExpenseClient(
      requestData,
      apiType,
    );

    if (response !== "error") {
      emit("refresh");
      notify({ type: "success", title: "Сохранено" });
      closeDialog();
    }
  } catch (error) {
    // Default error handling will take care of displaying the error
    closeDialog();
  } finally {
    saveLoading.value = false;
  }
};

const closeDialog = () => emit("closeDialog");

const getEmployedAgentsByClientId = async (clientId: string) => {
  employedAgents.value =
    await cashExpenditureStore.getEmployedAgentsByClientIds(clientId);
};

// Hooks

const filterStates = ref([
  {
    name: t("sidebar.clients"),
    key: "clients",
    get initialName() {
      return (
        clientName.value ||
        (paymentsInfo.value && paymentsInfo.value?.client?.name)
      );
    },
    get data() {
      return filtersStore.clients || [];
    },
    get disabled() {
      return !!props.clientId || props.debtId;
    },
    get getSelectedData() {
      return data.value?.client_id;
    },
    set setSelectedData(value: string) {
      data.value.client_id = value;
    },
    onLoadElse: async () => {
      await filtersStore.onLoadElseClients();
    },
    isSingleSelect: true,
    required: true,
  },
  {
    name: t("users.agents.agent"),
    key: "agent-dropdown",
    get data() {
      return clientEmployedAgents.value || filtersStore.agents || [];
    },
    get getSelectedData() {
      return data.value.agent_id;
    },
    set setSelectedData(value: string) {
      data.value.agent_id = value;
    },
    isSingleSelect: true,
    required: true,
  },
  {
    name: t("settings_sidebar.payment_method"),
    key: "currencies",
    order: 3,
    get data() {
      return getPaymentCurrencyDropdownData(filtersStore.currency, [
        data.value.currency_id,
        paymentsInfo.value?.currency?.id,
      ]);
    },
    get getSelectedData() {
      return data.value.currency_id;
    },
    set setSelectedData(value: string) {
      data.value.currency_id = value;
    },
    isSingleSelect: true,
    required: true,
  },
  {
    name: t("settings_sidebar.trade_direction"),
    key: "trade-directions",
    order: 3,
    get data() {
      return filtersStore.tradeDirections || [];
    },
    get getSelectedData() {
      return data.value.trade_direction_id;
    },
    set setSelectedData(value: string) {
      data.value.trade_direction_id = value;
    },
    isSingleSelect: true,
    required: true,
  },
  {
    name: t("cash.cash"),
    key: "cash",
    order: 3,
    get data() {
      return filtersStore.cashboxes || [];
    },
    get getSelectedData() {
      return data.value.cash_box_id;
    },
    set setSelectedData(value: string) {
      data.value.cash_box_id = value;
    },
    isSingleSelect: true,
    required: true,
  },
  {
    name: t("dashboard.forwarders"),
    key: "expeditors",
    order: 3,
    get data() {
      return filtersStore.expeditors || [];
    },
    get getSelectedData() {
      return data.value.payment_courier_id;
    },
    set setSelectedData(value: string) {
      data.value.payment_courier_id = value;
    },
    isSingleSelect: true,
  },
]);

// hooks
onMounted(async () => {
  if (props.debtId) {
    await Promise.all([
      await handleDetailOnEdit(),
      await filtersStore.getCashboxes(),
      await filtersStore.getCurrencies(),
      await filtersStore.getAgents(),
      await filtersStore.getExpeditors(),
      await filtersStore.getTradeDirections(),
    ]);
  }
  if (props?.clientId) {
    data.value.client_id = props?.clientId;
    if (!filtersStore.currency) {
      await filtersStore.getCurrencies();
    }
  }
  if (props?.clientId) {
    await Promise.all([
      filtersStore.getAgents(),
      getEmployedAgentsByClientId(props?.clientId),
    ]);
  }
});
const clientEmployedAgents = computed(() => {
  if (props.clientId && filtersStore.agents && employedAgents.value) {
    const clientsEmployedAgents = getFilteredEmployeesByClientId(
      props.clientId,
      filtersStore.agents,
      employedAgents.value,
    );

    if (clientsEmployedAgents?.length) {
      return { items: clientsEmployedAgents };
    }
    return null;
  }
  return null;
});
const clientName = computed(() => {
  if (!employedAgents.value || !props.clientId) return null;
  return employedAgents.value[0]?.client_name;
});

// methods
const handleDetailOnEdit = async () => {
  const detail = await cashExpenditureStore.expenseDetail(props.debtId);
  paymentsInfo.value = detail;
  if (detail) {
    data.value = {
      id: props.debtId,
      payment_amount: detail?.payment_amount,
      currency_id: detail?.currency?.id,
      client_id: detail?.client?.id,
      agent_id: detail?.agent?.id,
      payment_courier_id: detail?.payment_courier_id,
      cash_box_id: detail?.cash_box?.id,
      payment_date: detail?.payment_date,
      trade_direction_id: detail?.trade_direction?.id,
      description: detail?.description,
    };
  }
};
<\/script>
`;export{e as default};
