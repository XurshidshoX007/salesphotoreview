const n=`<template>
  <form @submit.prevent="onSave" class="relative">
    <d-modal
      dataContainerWidth="1400px"
      :name="t('cash.payments')"
      @closeDialog="emit('closeDialog')"
    >
      <div class="flex items-center gap-4">
        <div class="w-60">
          <DropdownsByFilterStates
            :filterStates="filterStatesOfCashbox"
            @onOpenDropdown="onOpenDropdown"
          />
        </div>
        <div class="flex p-2 gap-3 items-center">
          <DInputDatePicker
            :label="t('column.payment_date')"
            :value="selectedDate"
            disable-future-dates
            :disabled-past-dates="!hasAccess2CreatePaymentWithPastDates"
            @change="onChangeDate"
          />
        </div>
      </div>

      <div class="rounded-lg bg-white overflow-hidden border-grey">
        <div class="overflow-x-auto pb-3">
          <data-table
            :is-empty="!clientsData.length"
            :loading="clientsData.length === 0"
            class="max-h-160 overflow-y-auto relative pb-3 bg-white"
          >
            <template #header>
              <c-tr class="bg-[#FAFDFD] border-t-none sticky top-0 z-11">
                <c-td-no-edit
                  v-for="key in headers"
                  :key="key.key"
                  :is-checked="key.checked"
                  :class="{
                    'bg-red-200': key.key === 'currency' && !key.isActive,
                  }"
                >
                  <div v-if="key.key === 'for_consignation'">
                    <Checkbox
                      id="consignation_for_all"
                      :title="key.name"
                      :checked="isConsignationCheckedForAll"
                      @change="onCheckConsignationForAll"
                    />
                  </div>
                  <div v-else>
                    {{ key.name }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>

            <template #body>
              <c-tr v-for="(data, index) in clientsData" :key="data?.client_id">
                <c-td-no-edit
                  v-for="key in headers"
                  :key="key.key"
                  :is-checked="key.checked"
                  :class="{
                    'bg-red-200': key.key === 'currency' && !key.isActive,
                  }"
                >
                  <div v-if="key.key === 'trade_direction'" class="w-60">
                    <DropdownsByFilterStates
                      :filterStates="
                        getTradeDirectionsFilterStateByIdAndIdx(
                          index,
                          clientsData[index]?.agent_id,
                          data?.client_id,
                        )
                      "
                      @onOpenDropdown="
                        onOpenDropdown($event, clientsData[index]?.agent_id)
                      "
                    />
                  </div>
                  <div v-else-if="key.key === 'agent'" class="w-60">
                    <DropdownsByFilterStates
                      v-if="!byAgent"
                      :filterStates="
                        getFilterStatesByIdAndIndex(data?.client_id, index)
                      "
                    />
                    <div v-else>
                      {{ data?.agent_name }}
                    </div>
                  </div>
                  <div v-else-if="key.key === 'for_consignation'">
                    <Checkbox
                      :title="t('column.consignation')"
                      :id="'for_consignation' + index"
                      :checked="data.for_consignation"
                      @change="onChangeConsignation(data, $event)"
                    />
                  </div>
                  <div v-else-if="key?.key === 'currency'">
                    <d-input
                      type="number"
                      @change="
                        onAddCurrency(clientsData[index], key?.id, $event)
                      "
                      :disabled="key.isDisabled"
                    />
                  </div>
                  <div v-else-if="key.key === 'comment'">
                    <d-input
                      type="text"
                      @change="
                        onAddDescription(clientsData[index].client_id, $event)
                      "
                    />
                  </div>
                  <div v-else>
                    {{ data[key.key] }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </data-table>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-between gap-x-4 items-center">
          <div
            class="flex w-[calc(100%-140px)] overflow-y-auto justify-between"
          >
            <div class="flex gap-8 pb-2">
              <div
                v-for="currency in currencies?.items"
                :key="currency.id"
                class="mt-2"
                :class="\`w-1/\${currencies.items.length}\`"
              >
                <div class="text-[#8FA0A0] fs-12 whitespace-nowrap">
                  {{ currency?.name }}
                </div>
                <div class="fs-14 fw-6 ml-2">
                  {{ getSumOfCurrencyById(currency.id) }}
                </div>
              </div>
            </div>
          </div>
          <m-btn
            class="w-30 h-10"
            type="submit"
            :disabled="checkDisabled"
            :loading="isBtnLoading"
            >{{ t("save") }}</m-btn
          >
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";
import { ref } from "vue";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { TradeDirectionsModel } from "~/interfaces/api/settings/trade-directions-model";
import type { ClientPaymentDataModel } from "~/interfaces/api/cashboxes/client-payment-data";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";
import type { CurrencyDropdownModel } from "~/interfaces/dropdown-model";

// store
const clientsBalancesStore = useClientsBalancesStore("main");

// access
const { hasAccess2CreatePaymentWithPastDates } = useCashboxAccess();

// props
const props = defineProps<{
  byAgent?: boolean;
}>();

// emits
const emit = defineEmits(["closeDialog"]);

// state
const { t } = useI18n();
const selectedCashBoxId = ref(null);
const selectedDate = ref("");
const agents = ref(null);
const employedAgents = ref(null);
const clientsData = ref([]);
const currencies = ref<DropdownItemsModelByType<CurrencyDropdownModel>>();
const cashBoxes = ref();
const methodData = ref([]);
const isConsignationCheckedForAll = ref(false);
const isBtnLoading = ref(false);
const checkDisabled = ref(true);

const group = ref([
  {
    name: t("column.client"),
    key: "client_name",
    checked: true,
    type: "client_name",
  },
  {
    name: t("users.agents.agent"),
    key: "agent",
    checked: true,
    type: "agent",
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
    checked: true,
    type: "client",
  },
]);

const agentsParams = ref({ ...dropdownParamsAll });
const cashboxesParams = ref({ ...dropdownParamsAll });
const currenciesParams = ref({ ...dropdownParamsAll });
const tradeDirectionParams = ref({ ...defaultDropdownParams });

const tradeDirections = ref<DropdownItemsModelByType<TradeDirectionsModel>>();

const getTradeDirectionsFilterStateByIdAndIdx = (
  idx: number,
  agentId: string,
  client_id: string,
) => {
  return [
    {
      key: "trade-directions",
      isSingleSelect: true,
      required: true,
      get data() {
        return (
          getTradeDirectionsByClientId(agentId, client_id, idx) ||
          tradeDirections.value
        );
      },
      get getSelectedData() {
        return clientsData.value[idx]?.trade_direction_id;
      },
      set setSelectedData(value: string) {
        clientsData.value[idx].trade_direction_id = value;
      },
    },
  ];
};

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

// hooks
const headers = computed<
  Array<Template & { isActive?: boolean; isDisabled?: boolean; id?: string }>
>(() => {
  if (!currencies.value) return group.value;

  const currencyHeaders = currencies.value.items
    .map((currency) => ({
      ...currency,
      key: "currency",
      checked: true,
      isActive: currency.is_active,
      hasData: methodData.value.some(
        (data) => data.currency_id === currency.id,
      ),
      isDisabled: !currency.is_allowed_to_create_payment,
    }))
    .filter((currency) => currency.isActive || currency.hasData);

  return [
    ...group.value,
    ...currencyHeaders,
    {
      name: t("column.comment"),
      key: "comment",
      checked: true,
    },
  ];
});

onMounted(async () => {
  await Promise.all([
    getCurrencies(),
    getEmployedAgents(),
    onAutoFirstCashboxSelect(),
    getTradeDirections(),
  ]);
  if (!props.byAgent) {
    await getAgents();
  }
  setClientsData();
});

// methods

const getEmployedAgentsByClientId = (clientId: string) => {
  if (!clientId || !agents.value) {
    return null;
  }

  const clientEmployees = employedAgents.value!?.find(
    (employee) => employee.client.id === clientId,
  );

  if (!clientEmployees || !clientEmployees?.agent_arr?.length) {
    return null;
  }

  const filteredEmployees = clientEmployees.agent_arr
    .map((employee) =>
      agents.value?.items?.find((worker) => worker.id === employee.agent_id),
    )
    .filter(Boolean);

  return filteredEmployees?.length ? { items: filteredEmployees } : null;
};

const getTradeDirectionsByClientId = (
  agentId: string,
  clientId: string,
  idx: number,
) => {
  if (!clientId || !employedAgents.value) return null;

  const clientEmployees = employedAgents.value.find(
    (employee) => employee.client.id === clientId,
  );
  if (!clientEmployees) return null;

  const clientAgentTradeDirections = props.byAgent
    ? clientEmployees?.trade_direction_ids
    : clientEmployees.agent_arr?.find((item) => item.agent_id === agentId)
        ?.trade_direction_ids;

  if (!clientAgentTradeDirections?.length) return null;

  if (clientAgentTradeDirections.length === 1) {
    clientsData.value[idx].trade_direction_id = clientAgentTradeDirections[0];
  }

  const filteredTradeDirections =
    tradeDirections.value?.items?.filter((item) =>
      clientAgentTradeDirections.includes(item.id),
    ) || [];

  return filteredTradeDirections.length
    ? { items: filteredTradeDirections }
    : null;
};

const setClientsData = () => {
  if (employedAgents.value) {
    if (props.byAgent) {
      clientsData.value = employedAgents.value.map((agent) => ({
        client_id: agent?.client?.id || "",
        client_name: agent?.client?.name || "",
        agent_id: agent?.agent?.id || "",
        agent_name: agent?.agent?.name || "",
        trade_direction_id:
          agent?.trade_direction_ids?.length === 1
            ? [agent.trade_direction_ids[0]]
            : "",
        for_consignation: false,
      }));
    } else {
      clientsData.value = clientsBalancesStore.clientsIds.map((clientId) => {
        const clientEmployedAgents = employedAgents.value.find(
          (agent) => agent.client.id === clientId,
        );
        const firstAgent = clientEmployedAgents?.agent_arr?.[0] || {};

        return {
          client_id: clientEmployedAgents?.client?.id || "",
          client_name: clientEmployedAgents?.client?.name || "",
          agent_id: firstAgent?.agent_id || "",
          trade_direction_id: firstAgent?.trade_direction_id || "",
          for_consignation: false,
        };
      });
    }
  }
};

const onSelectCashboxId = (cashboxId: string) => {
  selectedCashBoxId.value = cashboxId;
  for (const data of methodData.value) {
    data.cash_box_id = cashboxId;
  }
};

const onChangeDate = (date: string) => {
  selectedDate.value = date;
  for (const data of methodData.value) {
    data.payment_date = date;
  }
};

const onAddDescription = (clientId: string, value: string) => {
  const clientData = methodData.value.find(
    (data) => data.client_id === clientId,
  );
  if (clientData) {
    clientData.description = value;
  }
};

const getSumOfCurrencyById = (currencyId: string) => {
  let initial = 0;
  const sum = methodData.value
    .filter((data) => data.currency_id === currencyId)
    ?.reduce((accumulator, data) => accumulator + data.payment_amount, initial);
  return getFormattedAmount(sum);
};

const updateCheckDisabled = () => {
  checkDisabled.value = !methodData.value.some(
    (item) => item.payment_amount > 0,
  );
};

watch(methodData, updateCheckDisabled, { deep: true });

const onAddCurrency = (
  clientData: ClientPaymentDataModel,
  currencyId: string,
  value: number,
) => {
  const isAlreadyExist = methodData.value.find(
    (data) =>
      data?.client_id === clientData.client_id &&
      data?.currency_id === currencyId,
  );
  if (!isAlreadyExist) {
    methodData.value.push({
      ...clientData,
      payment_date: selectedDate.value,
      currency_id: currencyId,
      cash_box_id: selectedCashBoxId.value,
      payment_amount: value,
    });
  } else {
    isAlreadyExist.payment_amount = value;
  }
};

const getFilterStatesByIdAndIndex = (clientId: string, idx: number) => {
  return [
    {
      key: "agents",
      isSingleSelect: true,
      required: true,
      get data() {
        return getEmployedAgentsByClientId(clientId) || agents.value || [];
      },
      get getSelectedData() {
        return clientsData.value[idx]?.agent_id;
      },
      set setSelectedData(value) {
        onSetIdByField(value, idx, "agent_id");
        clientsData.value[idx].trade_direction_id = null;
      },
    },
  ];
};

const onSetIdByField = (id: string, idx: number, field: string) => {
  clientsData.value[idx][field] = id;
  for (let data of methodData.value) {
    if (data.client_id === clientsData.value[idx].client_id) {
      data[field] = id;
    }
  }
};

const onChangeConsignation = (clientData, isChecked: boolean) => {
  clientData.for_consignation = isChecked;
  methodData.value.forEach((data) => {
    if (data?.client_id === clientData?.client_id) {
      data.for_consignation = isChecked;
    }
  });
};

const onCheckConsignationForAll = (isChecked: boolean) => {
  isConsignationCheckedForAll.value = isChecked;
  for (let clientData of clientsData.value) {
    clientData.for_consignation = isChecked;
  }
  for (let data of methodData.value) {
    data.for_consignation = isChecked;
  }
};

const onOpenDropdown = async (state: string, value: unknown) => {
  if (state === "cashboxes" && !cashBoxes.value) {
    getCashboxes();
  } else if (state === "trade-directions" && !tradeDirections.value) {
    await getTradeDirections();
  } else return;
};

const getTradeDirections = async () => {
  tradeDirections.value = await clientsBalancesStore.getTradeDirections(
    tradeDirectionParams.value,
  );
};

const getCurrencies = async () => {
  currencies.value = await clientsBalancesStore.getCurrencies(
    currenciesParams.value,
  );
};

const onAutoFirstCashboxSelect = async () => {
  await getCashboxes();
  selectedCashBoxId.value = cashBoxes.value.items[0].id;
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
  let agentIds = [];

  if (props.byAgent) {
    agentIds =
      clientsBalancesStore.agentsIds?.map((item) => {
        const [agent_id, client_id] = item.split("_");
        return { client_id, agent_id };
      }) || [];

    employedAgents.value =
      await clientsBalancesStore.getAgentsAndTradeDirectionsByAgentIds(
        agentIds,
      );
  } else {
    employedAgents.value =
      await clientsBalancesStore.getAgentsAndTradeDirectionsByClientIds(
        clientsBalancesStore.clientsIds,
      );
  }
};

const onSave = async () => {
  isBtnLoading.value = true;
  methodData.value = methodData.value.filter((data) => data.payment_amount > 0);
  const res = await clientsBalancesStore.onCreatePaymentList(methodData.value);
  if (res !== "error") {
    clientsBalancesStore.clientsIds = [];
    clientsBalancesStore.agentsIds = [];
    emit("closeDialog");
    await clientsBalancesStore.refreshClientsData();
  }
  isBtnLoading.value = false;
};
<\/script>
`;export{n as default};
