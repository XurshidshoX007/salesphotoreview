const e=`<template class="relative p-0">
  <form @submit.prevent="onSave">
    <d-modal
      only-close-dialog
      :name="(paymentId && t('cash.edit_payment')) || t('orders.add_payment')"
      :title-color="titleColorForHeader"
      :loading="paymentUpdateLoading"
      @closeDialog="closeDialog"
    >
      <div class="w-full">
        <flex-col ref="modalContent" class="gap-3">
          <div class="sticky -top-4 bg-white z-22 pb-2">
            <flex-col class="w-full gap-5">
              <DropdownsByFilterStates
                :filterStates="clientFilterState"
                @onOpenDropdown="onOpenDropdown"
                @search="onSearchDropdown"
              />
            </flex-col>
          </div>
          <div v-for="(paymentForm, index) in paymentFormArr" :key="index">
            <div class="border-grey p-3 rounded-large">
              <flex-col class="w-full gap-5">
                <div
                  class="w-full flex items-center justify-between"
                  :class="\`id_\${index}\`"
                >
                  <page-title20 :title="t('clients.payment')" />
                  <div v-if="index !== 0" class="text-red leading-[18px]">
                    <div
                      @click="onDeleteFormByIdx(index)"
                      class="cursor-pointer hover:text-[rgba(209, 5, 5, 1)] text-[16px]"
                    >
                      {{ t("deleted") }}
                    </div>
                  </div>
                </div>
                <d-input-date-picker
                  :value="paymentForm.payment_date"
                  :label="t('column.payment_date')"
                  disable-future-dates
                  :disabled-past-dates="!hasAccess2CreatePaymentWithPastDates"
                  @change="(v) => (paymentForm.payment_date = v)"
                />
                <DropdownsByFilterStates
                  :filterStates="getPaymentFilterStatesByIdx(index)"
                  @onOpenDropdown="onOpenDropdown"
                />
                <transition name="toggle-accordion">
                  <div v-if="isDebtOrdersShowable(index)">
                    <DropdownsByFilterStates
                      :filterStates="getDebtOrdersByIdx(index)"
                      @onOpenDropdown="getDebtOrders(index)"
                    />
                  </div>
                </transition>
                <d-input
                  :label="t('column.sum')"
                  :value="paymentForm.payment_amount"
                  required
                  type="number"
                  @change="paymentForm.payment_amount = $event"
                />
                <Checkbox
                  :title="t('column.consignation')"
                  :id="'for-consignation' + index"
                  :checked="paymentForm.for_consignation"
                  class="w-fit"
                  @change="paymentForm.for_consignation = $event"
                />
                <d-input
                  :label="t('column.comment')"
                  :value="paymentForm.description"
                  pattern-type="comment"
                  @change="paymentForm.description = $event"
                />
              </flex-col>
            </div>
          </div>
          <div v-if="!paymentId" class="flex justify-end">
            <m-btn @click="onAddForm" group="border">
              + {{ t("add_more") }}
            </m-btn>
          </div>
        </flex-col>
      </div>
      <template #footer>
        <m-btn type="submit" class="w-full" :loading="isBtnLoading"
          >{{ props.paymentId ? t("save") : t("clients.add") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import type { ClientPaymentModel } from "~/interfaces/api/clients/clients-model";
import type { AppResponse } from "~/interfaces/api/response/app-response";

import type {
  ClientModel,
  ClientEmployeeModel,
} from "~/interfaces/api/users/tasks-models";

import type {
  clientDropdownParamsType,
  defaultDropdownParamsType,
  ListParams,
} from "~/interfaces/api/params/list-parameters";
import type { CashboxesModel } from "~/interfaces/api/cashboxes/cashboxes-model";
import {
  clientDropdownParams,
  defaultDropdownParams,
  defaultParams,
  dropdownParamsAll,
} from "~/variable/params";
import { uuidv4 } from "~/utils/uuidV4";
import { useI18n } from "vue-i18n";

import { getFilteredEmployeesByClientId } from "~/utils/filter";
import { getPaymentCurrencyDropdownData } from "~/utils/payment-currency";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { TradeDirectionsModel } from "~/interfaces/api/settings/trade-directions-model";
import type { CashboxDebtOrdersModel } from "~/interfaces/api/cashboxes/cashbox-debt-orders-model";
import type { AgentModel } from "~/interfaces/api/users/agent/agent-model";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";
import type { CurrencyDropdownModel } from "~/interfaces/dropdown-model";

// store
const clientsBalancesStore = useClientsBalancesStore("client_payment");

// access
const { hasAccess2CreatePaymentWithPastDates } = useCashboxAccess();

// props
const props = defineProps<{
  currencyId?: string;
  paymentId?: string;
  clientId?: string;
  titleColorForHeader?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "refresh"]);

// state
const { t } = useI18n();
const clients = ref<AppResponse<ClientModel> | undefined>();
const selectedClientId = ref<string>();
const agents = ref<DropdownItemsModelByType<AgentModel> | undefined>();
const selectedAgentId = ref<string>();
const selectedExpeditorId = ref<string>();
const employedAgents = ref<ClientEmployeeModel[] | undefined>();
const currencies = ref<DropdownItemsModelByType<CurrencyDropdownModel>>();
const tradeDirections = ref<
  DropdownItemsModelByType<TradeDirectionsModel> | undefined
>();
const isBtnLoading = ref<boolean>(false);
const cashBoxes = ref<DropdownItemsModelByType<CashboxesModel>>();
const defaultCashboxId = ref<string>();
const debtOrders = ref<Record<number, AppResponse<CashboxDebtOrdersModel>>>({});
const paymentsInfo = ref();
const paymentUpdateLoading = ref(false);

const clientsParams = ref<clientDropdownParamsType>({
  ...clientDropdownParams,
});

const agentsParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});

const cashboxesParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});

const tradeDirectionParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});

const debtOrdersParams = ref<ListParams>({
  ...defaultParams,
});

const currencyParams = ref<defaultDropdownParamsType>({
  ...dropdownParamsAll,
});

const paymentFormModel = ref({
  payment_date: "",
  currency_id: "",
  cash_box_id: "",
  order_id: null,
  payment_amount: null as number | null,
  for_consignation: false,
  description: "",
});

const paymentFormArr = ref<ClientPaymentModel[]>([
  {
    ...paymentFormModel.value,
    id: uuidv4(),
    client_id: selectedClientId.value! || props.clientId,
    agent_id: selectedAgentId.value!,
    payment_courier_id: selectedExpeditorId.value!,
    trade_direction_id: tradeDirections.value?.items[0]?.id,
  },
]);

const clientFilterState = ref([
  {
    name: t("sidebar.clients"),
    key: "clients",
    required: true,
    isSingleSelect: true,
    get initialName() {
      return (
        clientName.value ||
        (paymentsInfo.value?.length && paymentsInfo.value[0]?.client?.name)
      );
    },
    get disabled() {
      return !!props.clientId || props.paymentId;
    },
    get data() {
      return clients.value || [];
    },
    get getSelectedData() {
      return selectedClientId.value;
    },
    set setSelectedData(value: string) {
      onChangeClientId(value);
    },
    onLoadElse: async () => {
      await onLoadElseClients();
    },
  },
  {
    name: t("users.agents.agent"),
    key: "agent-dropdown",
    required: true,
    isSingleSelect: true,
    get initialName() {
      return paymentsInfo.value?.length && paymentsInfo.value[0]?.agent?.name;
    },
    get disabled() {
      return !selectedClientId.value;
    },
    get data() {
      return clientEmployedAgents.value || agents.value || [];
    },
    get getSelectedData() {
      return selectedAgentId.value;
    },
    set setSelectedData(value: string) {
      onChangeAgentId(value);
    },
  },
]);

// hooks
watch(selectedClientId, async () => {
  await Promise.all([
    getAgents(),
    getEmployedAgentsByClientId(selectedClientId.value!),
  ]);
});

watch(selectedAgentId, async () => {
  await setDefaultTradeDirection(selectedAgentId.value);
});

const clientEmployedAgents = computed(() => {
  if (selectedClientId.value && agents.value && employedAgents.value) {
    const clientsEmployedAgents = getFilteredEmployeesByClientId(
      selectedClientId.value,
      agents.value,
      employedAgents.value,
    );

    if (clientsEmployedAgents?.length) {
      if (clientsEmployedAgents.length === 1) {
        onChangeAgentId(clientsEmployedAgents[0]?.id);
      }

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

const initialSelectedCurrencyId = computed(() => {
  if (!props.paymentId || !paymentsInfo.value?.length) return undefined;
  return paymentsInfo.value[0]?.currency?.id;
});

onMounted(async () => {
  if (props.paymentId) {
    await paymentEditDefaultData(props.paymentId);
    await getDebtOrders(0);
  } else {
    if (props.currencyId) {
      await fetchAndSetCurrency();
    }
    if (props.clientId) {
      selectedClientId.value = props.clientId;
    }
    await onAutoFirstCashboxSelect();
  }
});

// methods
const paymentEditDefaultData = async (id: string) => {
  paymentUpdateLoading.value = true;
  try {
    await Promise.all([getCashboxes(), getCurrencies()]);
    paymentsInfo.value = await clientsBalancesStore.getMultiplePaymentsInfo([
      id,
    ]);
    const paymentInfo = paymentsInfo.value[0];
    const {
      currency,
      client,
      agent,
      trade_direction,
      payment_received_date,
      payment_amount,
      for_consignation,
      comment,
      cash_box,
      order,
    } = paymentInfo || {};

    const [paymentForm] = paymentFormArr.value || [{}];

    Object.assign(paymentForm, {
      currency_id: currency?.id,
      client_id: client?.id,
      agent_id: agent?.id,
      trade_direction_id: trade_direction?.id,
      cash_box_id: cash_box?.id,
      payment_date: payment_received_date,
      payment_amount,
      for_consignation,
      description: comment,
      order_id: order?.id,
    });

    selectedClientId.value = client?.id;
    selectedAgentId.value = agent?.id;
  } catch (error) {
    console.error("Error loading payment data:", error);
  } finally {
    paymentUpdateLoading.value = false;
  }
};

const formattedDebtOrders = (idx: number) => {
  if (!debtOrders.value[idx]) return [];
  return {
    ...debtOrders.value[idx],
    items: debtOrders.value[idx].items.map((item) => ({
      name: \`\${item.visual_id} (\${getFormattedDate(
        item.order_date,
        "DD.MM.YYYY",
      )})\`,
      secondaryName: \` \${getFormattedAmount(item.debt)} \${
        item.base_currency_code
      }\`,
      id: item.id,
    })),
  };
};

const isDebtOrdersShowable = (paymentFormIdx: number) => {
  const { client_id, agent_id, currency_id } =
    paymentFormArr.value[paymentFormIdx];
  return !!client_id && !!agent_id && !!currency_id;
};

const getPaymentFilterStatesByIdx = (idx: number) => {
  return [
    {
      name: t("settings_sidebar.trade_direction"),
      key: "trade_direction",
      required: true,
      isSingleSelect: true,
      get initialName() {
        return (
          paymentsInfo.value?.length &&
          paymentsInfo.value[0]?.trade_direction?.name
        );
      },
      get disabled() {
        return !selectedAgentId.value;
      },
      get data() {
        return tradeDirections.value || [];
      },
      get getSelectedData() {
        return paymentFormArr.value[idx].trade_direction_id;
      },
      set setSelectedData(value: string) {
        paymentFormArr.value[idx].trade_direction_id = value;
      },
    },
    {
      name: t("cash.cash"),
      key: "cashboxes",
      isSingleSelect: true,
      required: true,
      get data() {
        return cashBoxes.value || [];
      },
      get getSelectedData() {
        return paymentFormArr.value[idx].cash_box_id;
      },
      set setSelectedData(value: string) {
        paymentFormArr.value[idx].cash_box_id = value;
      },
    },
    {
      name: t("settings_sidebar.payment_method"),
      key: "currencies",
      required: true,
      isSingleSelect: true,
      get data() {
        return getPaymentCurrencyDropdownData(currencies.value, [
          paymentFormArr.value[idx]?.currency_id,
          initialSelectedCurrencyId.value,
        ]);
      },
      get getSelectedData() {
        return paymentFormArr.value[idx].currency_id;
      },
      set setSelectedData(value: string) {
        onChangeCurrencyId(idx, value);
      },
    },
  ];
};

const getDebtOrdersByIdx = (idx: number) => {
  return [
    {
      name: t("column.debt_orders"),
      key: "debt-orders",
      isSingleSelect: true,
      get data() {
        return formattedDebtOrders(idx) || [];
      },
      get getSelectedData() {
        return paymentFormArr.value[idx].order_id;
      },
      set setSelectedData(value: string) {
        paymentFormArr.value[idx].order_id = value;
      },
      onLoadElse: async () => {
        await onLoadElseDebtOrders(idx);
      },
    },
  ];
};

const onAddForm = () => {
  paymentFormArr.value.push({
    ...paymentFormModel.value,
    id: uuidv4(),
    cash_box_id: defaultCashboxId.value!,
    client_id: selectedClientId.value!,
    agent_id: selectedAgentId.value!,
    payment_courier_id: selectedExpeditorId.value!,
    trade_direction_id: tradeDirections.value?.items[0]["id"],
  });
};

const onDeleteFormByIdx = (idx: number) => {
  paymentFormArr.value.splice(idx, 1);
};

const onChangeClientId = (value: string | undefined) => {
  selectedAgentId.value = undefined;
  selectedExpeditorId.value = undefined;
  debtOrders.value = {};
  selectedClientId.value = value;
  updateFormsIdByField("client_id", value);
  updateFormsIdByField("order_id", null);
};

const onChangeAgentId = async (value: string | undefined) => {
  selectedAgentId.value = value;
  updateFormsIdByField("agent_id", value);
  debtOrders.value = {};
  updateFormsIdByField("order_id", null);
};

const setDefaultTradeDirection = async (value: string) => {
  tradeDirectionParams.value = {
    ...tradeDirectionParams.value,
    agent_id: value,
  };
  await getTradeDirections();
  onSelectTradeDirectionIdForAll(tradeDirections.value?.items[0]["id"]);
};

const onChangeCurrencyId = (idx: number, currencyId: string) => {
  debtOrders.value = {};
  paymentFormArr.value[idx].currency_id = currencyId;
};

const updateFormsIdByField = (field: string, id: string | undefined | null) => {
  for (let idx in paymentFormArr.value) {
    paymentFormArr.value[idx][field] = id;
  }
};

const onOpenDropdown = async (state: string, value: string) => {
  if (state === "currencies" && !currencies.value) {
    await getCurrencies();
  }
  if (state === "clients" && !clients.value) {
    await getClients();
  }
  if (state === "agent-dropdown" && !agents.value) {
    await getAgents();
  } else if (state === "cashboxes" && !cashBoxes.value) {
    await getCashboxes();
  } else if (state === "trade_direction" && !tradeDirections.value) {
    await getTradeDirections();
  }
};

const onSearchDropdown = async (state: string, value: string) => {
  if (state === "clients") {
    clientsParams.value.search = value;
    await getClients();
    return;
  }
};

const onAutoFirstCashboxSelect = async () => {
  await getCashboxes();
  defaultCashboxId.value = cashBoxes.value?.items[0]?.id;
  onSelectCashboxIdForAll(defaultCashboxId.value!);
};

const fetchAndSetCurrency = async () => {
  await getCurrencies();
  paymentFormArr.value[0].currency_id = props.currencyId!;
};

const onSelectCashboxIdForAll = (cashboxId: string) => {
  for (const data of paymentFormArr.value) {
    data.cash_box_id = cashboxId;
  }
};

const onSelectTradeDirectionIdForAll = (id: string) => {
  for (const data of paymentFormArr.value) {
    data.trade_direction_id = id;
  }
};

const getDebtOrders = async (paymentFormIdx: number) => {
  if (debtOrders.value[paymentFormIdx]) return;
  const { client_id, agent_id, currency_id } =
    paymentFormArr.value[paymentFormIdx];

  debtOrdersParams.value = {
    ...debtOrdersParams.value,
    client_id,
    agent_id,
    currency_id,
    order_by: null,
  };

  debtOrders.value[paymentFormIdx] = await clientsBalancesStore.getDebtOrders(
    debtOrdersParams.value,
  );
};

const onLoadElseDebtOrders = async (paymentFormIdx: number) => {
  debtOrdersParams.value.page_size += 10;
  await getDebtOrders(paymentFormIdx);
};

const getClients = async () => {
  clients.value = await clientsBalancesStore.getClients(clientsParams.value);
};

const onLoadElseClients = async () => {
  clientsParams.value.page_size += 10;
  await getClients();
};

const getAgents = async () => {
  if (!agents.value) {
    agents.value = await clientsBalancesStore.getAgents(agentsParams.value);
  }
};

const getEmployedAgentsByClientId = async (clientId: string) => {
  employedAgents.value =
    await clientsBalancesStore.getEmployedAgentsByClientIds(clientId);
  if (employedAgents.value[0]?.employees?.length === 1) {
    await setDefaultTradeDirection(
      employedAgents.value[0]?.employees[0].employee_id,
    );
  }
};

const getCurrencies = async () => {
  currencies.value = await clientsBalancesStore.getCurrencies(
    currencyParams.value,
  );
};

const getCashboxes = async () => {
  cashBoxes.value = await clientsBalancesStore.getCashboxes(
    cashboxesParams.value,
  );
};
const getTradeDirections = async () => {
  tradeDirections.value = await clientsBalancesStore.getTradeDirections(
    tradeDirectionParams.value,
  );
};

const onSave = async () => {
  isBtnLoading.value = true;
  try {
    let status;
    if (props.paymentId) {
      let forSaveData = paymentFormArr.value?.map(
        ({ payment_received_date, id, ...rest }) => ({
          payment_date: payment_received_date,
          id: paymentsInfo.value[0]?.id,
          ...rest,
        }),
      );
      status = await clientsBalancesStore.onEditPaymentList(forSaveData);
    } else {
      status = await clientsBalancesStore.onCreatePaymentList(
        paymentFormArr.value,
      );
    }
    if (status !== "error") {
      emit("refresh");
      closeDialog();
    }
  } finally {
    isBtnLoading.value = false;
  }
};

const closeDialog = () => emit("closeDialog");
<\/script>

<style scoped>
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px #e1e4e4;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
}
</style>
`;export{e as default};
