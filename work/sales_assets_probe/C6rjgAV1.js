const e=`<template>
  <form @submit.prevent="onSave" class="w-full">
    <d-modal
      @closeDialog="closeDialog"
      :dataContainerWidth="'80%'"
      only-close-dialog
      :name="t('clients.group_processing')"
      :loading="isLoading"
    >
      <div class="rounded-lg bg-white border-grey overflow-hidden pb-2">
        <div class="overflow-x-auto">
          <data-table class="max-h-160 overflow-y-auto relative pb-3 bg-white">
            <template #header>
              <c-tr class="bg-[#FAFDFD] border-t-0 sticky top-0 z-11">
                <c-td-no-edit v-for="key in headers" :key="key.key">
                  <d-input-date-picker
                    v-if="key.key === 'payment_received_date'"
                    class="text-xs items-start"
                    :label="key.name"
                    :value="receivedDateForAll"
                    @change="onChangeReceivedDateFromAll"
                    without-time
                  />
                  <dropdowns-by-filter-states
                    v-else-if="key.key === 'expeditor'"
                    :filter-states="filterStatesExpeditorAll"
                    @onOpenDropdown="onOpenDropdown"
                  />
                  <div v-else-if="key.key === 'for_consignation'">
                    <Checkbox
                      title="Консигнация"
                      id="consignation-for-all"
                      :checked="isConsignationCheckedForAll"
                      @change="onCheckConsignationForAll"
                    />
                  </div>
                  <div v-else-if="key.key === 'currency'">
                    <dropdowns-by-filter-states
                      :filter-states="filterStatesCurrencyAll"
                      @onOpenDropdown="onOpenDropdown"
                    />
                  </div>
                  <d-input
                    :label="key.name"
                    v-else-if="key.key === 'payment_amount'"
                    type="number"
                    @change="setDataByKey(key.key, $event)"
                  />
                  <div v-else-if="key.key === 'description'">
                    <d-input
                      :label="t('column.comment')"
                      pattern-type="comment"
                      @change="setDataByKey(key.key, $event)"
                    />
                  </div>
                  <div v-else>
                    {{ key.name }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
            <template #body>
              <c-tr
                v-for="(data, index) in paymentsInfo"
                :key="data?.id?.identity"
              >
                <c-td-no-edit
                  v-for="key in headers"
                  :key="key.key"
                  class="text-start"
                >
                  <div v-if="key.key === 'client_name'">
                    {{ data?.client?.name }}
                  </div>
                  <div
                    v-else-if="key.key === 'payment_received_date'"
                    class="w-50"
                  >
                    <d-input-date-picker
                      :value="getReceivedDateByIdx(index)"
                      class="text-xs"
                      @change="methodData[index].payment_received_date = $event"
                      without-time
                    />
                  </div>
                  <div v-else-if="key.key === 'trade_direction'" class="w-60">
                    <DropdownsByFilterStates
                      :filterStates="
                        getTradeDirectionsFilterStateByIdAndIdx(
                          index,
                          methodData[index]?.agent_id,
                          data?.id?.identity,
                        )
                      "
                      @onOpenDropdown="
                        onOpenDropdown(
                          'trade-directions',
                          methodData[index]?.agent_id,
                          data?.id?.identity,
                        )
                      "
                    />
                  </div>
                  <div
                    v-if="key.key === 'agent' || key.key === 'expeditor'"
                    class="w-60"
                  >
                    <DropdownsByFilterStates
                      :filterStates="
                        key.key === 'agent'
                          ? getAgentsFilterStateByIdAndIdx(
                              data?.client?.id,
                              index,
                            )
                          : getExpeditorFilterStatesByIdAndIdx(
                              data?.client?.id,
                              index,
                            )
                      "
                      @onOpenDropdown="onOpenDropdown"
                    />
                  </div>

                  <div v-else-if="key?.key === 'currency'" class="w-60">
                    <DropdownsByFilterStates
                      :filterStates="
                        getCurrencyFilterStateByIdAndIdx(
                          data?.client?.id,
                          index,
                        )
                      "
                      @onOpenDropdown="onOpenDropdown"
                    />
                  </div>
                  <div v-else-if="key.key === 'for_consignation'">
                    <Checkbox
                      title="Консигнация"
                      :id="'for_consignation' + index"
                      :checked="methodData[index].for_consignation"
                      @change="methodData[index].for_consignation = $event"
                    />
                  </div>
                  <div v-else-if="key.key === 'debt_orders'" class="w-60">
                    <DropdownsByFilterStates
                      :filterStates="getDebtOrdersFilterStatesByIdx(index)"
                      @onOpenDropdown="getDebtOrdersByIdx(index)"
                    />
                  </div>
                  <div
                    v-if="
                      key.key === 'payment_amount' || key.key === 'description'
                    "
                  >
                    <d-input
                      :type="key.key === 'payment_amount' ? 'number' : 'text'"
                      :value="
                        key.key === 'payment_amount'
                          ? methodData[index]?.payment_amount
                          : methodData[index]?.description
                      "
                      class="w-full"
                      :status="
                        (key.key === 'payment_amount' && 'number') || 'comment'
                      "
                      @change="onChangeInputFieldByKey(key.key, index, $event)"
                    />
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </data-table>
        </div>
      </div>

      <template #footer>
        <div class="flex w-full justify-end">
          <div class="w-3/5 flex">
            <div class="flex gap-4.5 items-center w-3/5 justify-end">
              <div class="w-2/3">
                <DropdownsByFilterStates
                  :filterStates="filterStatesOfCashbox"
                  @onOpenDropdown="onOpenDropdown"
                />
              </div>
            </div>
            <div class="flex w-2/5 p-2">
              <m-btn class="w-full" type="submit" :loading="isBtnLoading"
                >{{ t("save") }}
              </m-btn>
            </div>
          </div>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import moment from "moment"; // DO NOT Delete
import {
  defaultDropdownParams,
  defaultParams,
  dropdownParamsAll,
} from "~/variable/params";
import { getFilteredEmployeesByClientId } from "~/utils/filter";
import { useI18n } from "vue-i18n";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { TradeDirectionsModel } from "~/interfaces/api/settings/trade-directions-model";

// store
const clientsBalancesStore = useClientsBalancesStore("main");

// props
const props = defineProps({
  paymentsIds: Array,
});

// emits
const emit = defineEmits(["closeDialog"]);

// state
let methodData = ref([]);
const { t } = useI18n();
const paymentsInfo = ref();
const selectedCashBoxId = ref(null);
const agents = ref(null);
const employedAgents = ref(null);
const expeditors = ref(null);
const employedExpeditors = ref(null);
const currencies = ref<DropdownItemsModelByType<CurrencyDropdownModel>>();
const debtOrders = ref({});
const isLoading = ref(false);
const isBtnLoading = ref(false);

const selectedAgentIdForAll = ref("");
const selectedExpeditorIdForAll = ref("");
const selectedCurrencyIdForAll = ref("");
const receivedDateForAll = ref(moment().format("YYYY-MM-DD HH:mm"));
const cashBoxes = ref();

const headers = ref([
  {
    name: t("sidebar.clients"),
    key: "client_name",
  },
  {
    name: t("column.payment_date"),
    key: "payment_received_date",
  },
  {
    name: t("users.agents.agent"),
    key: "agent",
  },

  {
    name: t("settings_sidebar.trade_direction"),
    key: "trade_direction",
    checked: true,
    type: "trade_direction",
  },
  {
    name: t("column.consignation"),
    key: "for_consignation",
  },
  {
    name: t("column.sum"),
    key: "payment_amount",
  },
  {
    name: "Долги по заказам",
    key: "debt_orders",
  },
  {
    name: t("settings_sidebar.currencies"),
    key: "currency",
  },
  {
    name: t("column.comment"),
    key: "description",
  },
]);

const dropdownParams = ref(
  props.paymentsIds ? { ...dropdownParamsAll } : { ...defaultDropdownParams },
);

const agentsParams = ref(dropdownParams.value);
const expeditorsParams = ref(dropdownParams.value);
const cashboxesParams = ref(dropdownParams.value);
const debtOrdersParams = ref(dropdownParams.value);
const tradeDirectionParams = ref(dropdownParams.value);
const tradeDirections = ref<DropdownItemsModelByType<TradeDirectionsModel>>();
const tradeDirectionsWithAgents = ref([]);

const filterStatesOfCashbox = ref([
  {
    name: t("cash.cash"),
    key: "cashboxes",
    isSingleSelect: true,
    required: true,
    get data() {
      return cashBoxes.value || [];
    },
    get getSelectedData() {
      return selectedCashBoxId.value;
    },
    set setSelectedData(value: string) {
      onSelectCashboxId(value);
    },
  },
]);

const filterStatesExpeditorAll = ref([
  {
    key: "expeditor",
    isSingleSelect: true,
    get data() {
      return expeditors.value || [];
    },
    get getSelectedData() {
      return selectedExpeditorIdForAll;
    },
    set setSelectedData(value: string) {
      setDataByKey("expeditor", value);
    },
  },
]);

const filterStatesCurrencyAll = ref([
  {
    name: t("settings_sidebar.currencies"),
    key: "currencies",
    isSingleSelect: true,
    get data() {
      return currencies.value || [];
    },
    get getSelectedData() {
      return selectedCurrencyIdForAll;
    },
    set setSelectedData(value: string) {
      setDataByKey("currency", value);
    },
  },
]);

// hooks
const isConsignationCheckedForAll = computed(() => {
  return methodData.value?.every((item) => item.for_consignation);
});

const clientsIds = computed(() => {
  if (paymentsInfo.value) {
    return [
      ...new Set(paymentsInfo.value.map((payment) => payment?.client?.id)),
    ];
  }
});

onMounted(async () => {
  isLoading.value = true;
  paymentsInfo.value = await clientsBalancesStore.getMultiplePaymentsInfo(
    props.paymentsIds,
  );
  setPaymentsData();
  await Promise.all([getEmployedAgents(), onAutoFirstCashboxSelect()]);
  isLoading.value = false;
});

// methods
const getTradeDirectionsForAgent = (agentId: string, id: string) => {
  const agentData = tradeDirectionsWithAgents.value?.find(
    (item) => item.agent_id === agentId && item.id === id,
  );
  return agentData?.trade_directions || tradeDirections.value || [];
};

const getTradeDirectionsFilterStateByIdAndIdx = (
  idx: number,
  agentId: string,
  id: string,
) => {
  return [
    {
      key: "trade-directions",
      isSingleSelect: true,
      required: true,
      initialName: paymentsInfo.value[idx]?.trade_direction?.name,
      get data() {
        return getTradeDirectionsForAgent(agentId, id);
      },
      get getSelectedData() {
        return methodData.value[idx]?.trade_direction_id;
      },
      set setSelectedData(value) {
        methodData.value[idx].trade_direction_id = value;
      },
    },
  ];
};

const setPaymentsData = () => {
  if (paymentsInfo.value) {
    methodData.value = paymentsInfo.value.map((payment) => ({
      id: payment.id,
      client_id: payment?.client?.id,
      agent_id: payment?.agent?.id,
      payment_courier_id: payment?.expeditor?.id,
      payment_received_date: payment?.payment_received_date,
      currency_id: payment?.currency?.id,
      for_consignation: payment?.for_consignation,
      payment_amount: payment?.payment_amount,
      description: payment?.comment,
      order_id: payment?.order?.id,
      trade_direction_id: payment.trade_direction?.id,
    }));
  }
};

const getClientAgentsById = (clientId) => {
  if (employedAgents.value) {
    const clientsEmployees = getFilteredEmployeesByClientId(
      clientId,
      agents.value,
      employedAgents.value,
    );
    return clientsEmployees?.length ? { items: clientsEmployees } : null;
  }
};

const getClientExpeditorsById = (clientId) => {
  if (employedExpeditors.value) {
    const clientsEmployees = getFilteredEmployeesByClientId(
      clientId,
      expeditors.value,
      employedExpeditors.value,
    );
    return clientsEmployees?.length ? { items: clientsEmployees } : null;
  }
};

const onSelectCashboxId = (cashboxId) => {
  selectedCashBoxId.value = cashboxId;
  for (const data of methodData.value) {
    data.cash_box_id = cashboxId;
  }
};

const onAddDescription = (index, value) => {
  methodData.value[index].description = value;
};

const onAddCurrency = (index, value) => {
  methodData.value[index].payment_amount = value;
};

const onChangeInputFieldByKey = (key, index, value) => {
  if (key === "payment_amount") {
    onAddCurrency(index, value);
  } else if (key === "description") {
    onAddDescription(index, value);
  }
};

const onCheckConsignationForAll = (isCecked) => {
  for (let item of methodData.value) {
    item.for_consignation = isCecked;
  }
};

const getFormattedDebtOrdersByIdx = (idx) => {
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

const getExpeditorFilterStatesByIdAndIdx = (clientId, idx) => {
  return [
    {
      key: "expeditors",
      isSingleSelect: true,
      initialName: paymentsInfo.value[idx]?.expeditor?.name,
      // get data() {
      //   return getClientExpeditorsById(clientId) || expeditors.value || [];
      // },
      get data() {
        return expeditors.value || [];
      },
      get getSelectedData() {
        return methodData.value[idx].payment_courier_id;
      },
      set setSelectedData(value) {
        methodData.value[idx].payment_courier_id = value;
      },
    },
  ];
};

const getAgentsFilterStateByIdAndIdx = (clientId, idx) => {
  return [
    {
      key: "agents",
      isSingleSelect: true,
      initialName: paymentsInfo.value[idx]?.agent?.name,
      get data() {
        return getClientAgentsById(clientId) || agents.value || [];
      },
      get getSelectedData() {
        return methodData.value[idx].agent_id;
      },
      set setSelectedData(value) {
        methodData.value[idx].agent_id = value;
        debtOrders.value = {};
      },
    },
  ];
};

const getCurrencyFilterStateByIdAndIdx = (clientId, idx) => {
  return [
    {
      key: "currencies",
      isSingleSelect: true,
      initialName: paymentsInfo.value[idx]?.currency?.name,
      get data() {
        return currencies.value || [];
      },
      get getSelectedData() {
        return methodData.value[idx].currency_id;
      },
      set setSelectedData(value) {
        methodData.value[idx].currency_id = value;
        debtOrders.value = {};
      },
    },
  ];
};

const getDebtOrdersFilterStatesByIdx = (idx) => {
  return [
    {
      key: "debt-orders",
      isSingleSelect: true,
      initialName: paymentsInfo.value[idx]?.order?.name,
      get disabled() {
        return (
          !methodData.value[idx]?.client_id ||
          !methodData.value[idx]?.currency_id ||
          !methodData.value[idx]?.agent_id
        );
      },
      get data() {
        return getFormattedDebtOrdersByIdx(idx);
      },
      get getSelectedData() {
        return methodData.value[idx].order_id;
      },
      set setSelectedData(value) {
        methodData.value[idx].order_id = value;
      },
      onLoadElse: async () => {
        await onLoadElseDebtOrders(idx);
      },
    },
  ];
};

const onOpenDropdown = async (state: string, value: unknown, id: string) => {
  if (state === "agents" && !agents.value) {
    await Promise.all([getEmployedAgents(), getAgents()]);
  } else if (state === "expeditors" && !expeditors.value) {
    await Promise.all([getEmployedExpeditors(), getExpeditors()]);
  } else if (state === "currencies" && !currencies.value) {
    await getCurrencies();
  } else if (state === "cashboxes" && !cashBoxes.value) {
    await getCashboxes();
  } else if (state === "trade-directions") {
    tradeDirectionParams.value = {
      ...tradeDirectionParams.value,
      agent_id: value,
      id: id,
    };
    await getTradeDirections(value, id);
  } else return;
};

const getTradeDirections = async (agentId: string, id: string) => {
  if (!agentId) {
    tradeDirections.value = await clientsBalancesStore.getTradeDirections(
      tradeDirectionParams.value,
    );
    return;
  }

  // Check if the trade direction already exists for the given agentId and id
  const exists = tradeDirectionsWithAgents.value.some(
    (item) => item.agent_id === agentId && item.id === id,
  );

  if (!exists) {
    const response = await clientsBalancesStore.getTradeDirections(
      tradeDirectionParams.value,
    );

    tradeDirectionsWithAgents.value.push({
      agent_id: agentId,
      trade_directions: response,
      id: id,
    });
  }
};

const onSave = async () => {
  isBtnLoading.value = true;
  let forSaveData = methodData.value?.map(
    ({ payment_received_date, ...rest }) => ({
      payment_date: payment_received_date,
      ...rest,
    }),
  );

  await clientsBalancesStore.onEditPaymentList(forSaveData);
  closeDialog();
  isBtnLoading.value = false;
};

const closeDialog = () => emit("closeDialog");

const setDataByKey = (key, value) => {
  if (key === "payment_amount") {
    methodData?.value?.forEach((item) => {
      item.payment_amount = value;
    });
  } else if (key === "description") {
    methodData?.value?.forEach((item) => {
      item.description = value;
    });
  } else if (key === "agents") {
    selectedAgentIdForAll.value = value;
    for (let data of methodData.value) {
      data.agent_id = value;
    }
  } else if (key === "expeditor") {
    selectedExpeditorIdForAll.value = value;
    for (let data of methodData.value) {
      data.payment_courier_id = value;
    }
  } else if (key === "currency") {
    selectedCurrencyIdForAll.value = value;
    for (let data of methodData.value) {
      data.currency_id = value;
    }
  }
};

const onChangeReceivedDateFromAll = (newDate) => {
  receivedDateForAll.value = newDate;
  methodData?.value?.forEach((item) => {
    item.payment_received_date = newDate;
  });
};

const getReceivedDateByIdx = (idx: number) => {
  return methodData.value[idx]?.payment_received_date;
};

const onAutoFirstCashboxSelect = async () => {
  await getCashboxes();
  const firstCashboxId = cashBoxes.value.items[0].id;
  onSelectCashboxId(firstCashboxId);
};

const getCurrencies = async () => {
  currencies.value = await clientsBalancesStore.getCurrencies();
};

const getCashboxes = async () => {
  cashBoxes.value = await clientsBalancesStore.getCashboxes(
    cashboxesParams.value,
  );
};

const getAgents = async () => {
  agents.value = await clientsBalancesStore.getAgents(agentsParams.value);
};

const getEmployedAgents = async () => {
  employedAgents.value =
    await clientsBalancesStore.getEmployedAgentsByClientIds(clientsIds.value);
};

const getExpeditors = async () => {
  expeditors.value = await clientsBalancesStore.getExpeditors(
    expeditorsParams.value,
  );
};

const getEmployedExpeditors = async () => {
  employedExpeditors.value =
    await clientsBalancesStore.getEmployedExpeditorsByClientIds(
      clientsIds.value,
    );
};

const getDebtOrdersByIdx = async (methodDataIdx) => {
  const { client_id, agent_id, currency_id, order_id } =
    methodData.value[methodDataIdx];

  if (
    !client_id ||
    !agent_id ||
    !currency_id ||
    debtOrders.value[methodDataIdx]
  )
    return;

  debtOrdersParams.value = {
    ...debtOrdersParams.value,
    client_id,
    agent_id,
    currency_id,
    including_order_id: order_id,
    order_by: null,
  };

  debtOrders.value[methodDataIdx] = await clientsBalancesStore.getDebtOrders(
    debtOrdersParams.value,
  );
};

const onLoadElseDebtOrders = async (methodDataIdx) => {
  debtOrdersParams.value.page_size += 10;
  await getDebtOrdersByIdx(methodDataIdx);
};
<\/script>

<!--<style scoped>-->
<!--::-webkit-scrollbar {-->
<!--  width: 8px;-->
<!--}-->

<!--::-webkit-scrollbar-track {-->
<!--  -webkit-box-shadow: inset 0 0 6px #e1e4e4;-->
<!--  border-radius: 10px;-->
<!--}-->

<!--::-webkit-scrollbar-thumb {-->
<!--  border-radius: 10px;-->
<!--  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);-->
<!--}-->
<!--</style>-->
`;export{e as default};
