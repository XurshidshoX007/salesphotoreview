const n=`<template>
  <div class="table-content-container relative">
    <div
      v-if="isSaving"
      class="absolute z-19 bottom-0 left-0 w-[100%] h-[100%] bg-[rgba(0,0,0,0.3)] flex items-center justify-center pointer-events-none rounded-large"
    >
      <Loading />
    </div>
    <div
      class="table-content-body rounded-large"
      :class="{
        'max-h-[calc(100vh-16rem)] overflow-auto': !isFewDataUiApplyable,
      }"
    >
      <data-table :loading="isLoadingTable" :table-styles="fewDataTableStyles">
        <template #header>
          <c-tr
            class="bg-lotion border-t-0 top-0 sticky bg-lotion z-8 shadow-md"
            :class="fewDataTrClasses"
          >
            <c-td-no-edit
              v-for="key in headers"
              :key="key.key"
              :class="fewDataTdClassesByKey(key.key)"
            >
              <div class="flex gap-1 fs-14 fw-4 items-center">
                <template v-if="headerActions[key.key]">
                  <div
                    :class="key.key !== 'for_consignation' ? 'w-50' : 'w-25'"
                  >
                    <component
                      :is="headerActions[key.key].component"
                      v-bind="resolvedHeaderProps(key.key)"
                      v-on="resolvedHeaderActions(key.key)"
                    />
                  </div>
                </template>
                <template v-else>
                  <div class="secondary-gray-text">{{ key.name }}</div>
                </template>
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>

        <template #body>
          <c-tr
            v-for="(payment, index) in visibleData"
            :key="payment.id"
            :id="\`row-\${index}\`"
            class="relative"
            :class="fewDataTrClasses"
            v-observe-visibility="
              (isVisible, entry) => onVisibilityChange(isVisible, index)
            "
          >
            <c-td-no-edit
              v-for="key in headers"
              :key="key.key"
              :header-key="key.key"
              :class="[
                fewDataTdClassesByKey(key.key),
                key?.borderX && 'border-r-1',
                isSaved && key.key !== 'client_name' && 'opacity-20',
              ]"
            >
              <template v-if="key.key === 'payment_date'">
                {{ getFormattedDate(payment.payment_date) }}
              </template>
              <template v-else-if="key.key === 'remain_after_payment'">
                {{ getRemainAfterPayment(payment.id) }}
              </template>
              <template v-else-if="bodyActions[key.key]">
                <div :class="key.key !== 'for_consignation' ? 'w-50' : 'w-25'">
                  <component
                    :is="bodyActions[key.key].component"
                    v-bind="resolvedBodyProps(key.key, payment, index)"
                    v-on="{ ...resolvedBodyActions(key.key, index) }"
                  />
                </div>
              </template>
              <template v-else>
                <div
                  :class="{ 'text-end': typeof payment[key.key] === 'number' }"
                >
                  {{ payment[key.key] }}
                </div>
              </template>
            </c-td-no-edit>
            <TableResponseResult
              v-if="isSaved"
              :response-results="responseResults"
              :id="payment.id"
              @on-try-again="onTryAgainFailedRequest"
            />
          </c-tr>
        </template>

        <template #footer>
          <DashboardCashboxApplicationsPaymentPaymentClientTotalAmounts
            :headers="headers"
            :total-amounts="totalAmounts"
            :few-data-tr-classes="fewDataTrClasses"
            :few-data-td-classes-by-key="fewDataTdClassesByKey"
          />
        </template>
      </data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getFilteredEmployeesByClientId } from "~/utils/filter";
import { getPaymentCurrencyDropdownData } from "~/utils/payment-currency";
import { defaultDropdownParams } from "~/variable/params";
import type { AgentModel } from "~/interfaces/api/users/agent/agent-model";
import type { TradeDirectionsModel } from "~/interfaces/api/settings/trade-directions-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { TableResponseResultModel } from "~/interfaces/ui/table-response-result-model";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import type { Template } from "~/interfaces/ui/template";
import type { ClientEmployeeModel } from "~/interfaces/api/users/tasks-models";
import type { CurrencyDropdownModel } from "~/interfaces/dropdown-model";

// props
const props = defineProps<{
  data: Array<any>;
  postData: Array<any>;
  isSaved: boolean;
  responseResults: TableResponseResultModel;
  currencies: DropdownItemsModelByType<CurrencyDropdownModel>;
  employedAgents: Array<ClientEmployeeModel>;
  isLoadingTable: boolean;
  totalAmounts: {
    id: string;
    title: string;
    amount: string;
    details?: {
      id: string;
      title: string;
      amount: string;
    }[];
  }[];
  isSaving?: boolean;
}>();

// emits
const emit = defineEmits(["on-try-again-failed-request"]);

// types
type HeaderAction = {
  component: string;
  props: Record<string, any>;
  onChange?: (value: any) => void;
  onOpenDropdown?: () => void;
};

// store
const applicationPaymentsStore = useApplicationsParamsStore("main");

// states
const { t } = useI18n();
const selectedCurrencyIdForAll = ref<string>();
const amountForAll = ref<number>();

const agents = ref<DropdownItemsModelByType<AgentModel>>();
const agentsParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});

const tradeDirections = ref<DropdownItemsModelByType<TradeDirectionsModel>>();
const tradeDirectionsByAgentId = ref<
  Record<string, DropdownItemsModelByType<TradeDirectionsModel>>
>({});
const tradeDirectionParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});

const currencyFilterStatesOfAll = ref([
  {
    name: t("settings_sidebar.payment_method"),
    key: "currencies",
    isSingleSelect: true,
    get data() {
      return getPaymentCurrencyDropdownData(props.currencies, [
        selectedCurrencyIdForAll.value,
      ]);
    },
    get getSelectedData() {
      return selectedCurrencyIdForAll.value;
    },
    set setSelectedData(value: string) {
      onSelectCurrencyForAll(value);
    },
  },
]);

const headers = ref<Template[]>([
  {
    name: t("sidebar.clients"),
    key: "client_name",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("column.type"),
    key: "type",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("column.payment_date"),
    key: "payment_date",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("clients.forwarder"),
    key: "expeditor_name",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("users.agents.agent"),
    key: "agent_name",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("column.sum"),
    key: "payment_amount",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("settings_sidebar.payment_method"),
    key: "currency_name",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("settings_sidebar.trade_direction"),
    key: "trade_directions",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("column.current_debt_amount"),
    key: "current_debt_amount",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("column.remaining_balance_after_payment"),
    key: "remain_after_payment",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("column.consignation"),
    key: "for_consignation",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("column.comment"),
    key: "comment",
    checked: true,
    is_sortable: false,
  },
]);

// hooks
const isConsignationCheckedForAll = computed<boolean>(() => {
  if (!props.postData?.length) return false;
  return props.postData?.every((item) => {
    return item.for_consignation;
  });
});

onMounted(async () => {
  await Promise.all([fetchAgents(), fetchTradeDirections()]);
});

// table states
const visibleData = ref([]);
const rowsPerPage = ref<number>(20);
const currentPage = ref<number>(1);

const headerActions: Record<string, HeaderAction> = reactive({
  currency_name: {
    component: "DropdownsByFilterStates",
    props: {
      filterStates: currencyFilterStatesOfAll.value,
      readonly: computed(() => props.isSaved),
      class: "w-full",
    },
    onOpenDropdown: () => onOpenDropdown,
  },

  payment_amount: {
    component: "DInput",
    props: {
      type: "number",
      label: t("labels.sum_for_all"),
      value: amountForAll.value,
      required: amountForAll.value! < 0,
      disabled: computed(() => props.isSaved),
    },
    onChange: (value: number) => onChangeAmountForAll(value),
  },

  comment: {
    component: "DInput",
    props: {
      label: t("labels.comment_for_all"),
      disabled: computed(() => props.isSaved),
    },
    onChange: (comment: string) => onChangeCommentForAll(comment),
  },

  for_consignation: {
    component: "Switch",
    props: {
      title: "Кон - я",
      id: "for_consignation",
      disabled: computed(() => props.isSaved),
      active: isConsignationCheckedForAll.value,
    },
    onChange: (isChecked: boolean) => onCheckConsignationForAll(isChecked),
  },
});

const bodyActions = {
  agent_name: {
    component: "DropdownsByFilterStates",
    props: (payment: Record<string, any>, index: number) => ({
      filterStates: getAgentFilterStates(payment, index),
      readonly: props.isSaved,
    }),
    onOpenDropdown: () => onOpenDropdown,
  },

  currency_name: {
    component: "DropdownsByFilterStates",
    props: (payment: Record<string, any>, index: number) => ({
      filterStates: getCurrencyFilterStates(payment, index),
      readonly: props.isSaved,
    }),
    onOpenDropdown: () => onOpenDropdown,
  },

  trade_directions: {
    component: "DropdownsByFilterStates",
    props: (key: string, index: number) => ({
      filterStates: getTradeDirectionFilterStateByAgentId(index),
      readonly: props.isSaved,
    }),
    onOpenDropdown: () => onOpenDropdown,
  },

  payment_amount: {
    component: "DInput",
    props: (key: string, index: number) => ({
      type: "number",
      value: props.postData[index]?.payment_amount,
      min: 0,
      required: props.postData[index]?.payment_amount <= 0,
      disabled: computed(() => props.isSaved).value,
    }),
    onChange: (_: string, index: number, value: number) =>
      onChangeInputFieldByKey("payment_amount", index, value),
  },

  comment: {
    component: "DInput",
    props: (key: string, index: number) => ({
      type: "text",
      value: props.postData[index]?.description,
      disabled: computed(() => props.isSaved).value,
    }),
    onChange: (_: string, index: number, value: string) =>
      onChangeInputFieldByKey("comment", index, value),
  },

  for_consignation: {
    component: "Switch",
    props: (key: string, index: number) => ({
      title: "Кон - я",
      id: index,
      active: props.postData[index]?.for_consignation,
      disabled: computed(() => props.isSaved).value,
    }),
    onChange: (_: string, index: number, isChecked: boolean) =>
      onCheckConsignation(index, isChecked),
  },
};

// table hooks
const isFewDataUiApplyable = computed(() => {
  return visibleData.value.length < 6;
});

const fewDataTableStyles = computed(() => {
  if (!isFewDataUiApplyable.value) return {};
  return {
    height: "calc(100vh - 16rem) !important",
  };
});

const fewDataTrClasses = computed(() => {
  if (!isFewDataUiApplyable.value) return [];
  return [
    "flex",
    visibleData.value.length > 1 ? "first-border-none" : "border-t-0",
  ];
});

const fewDataTdClassesByKey = (key: string) => {
  if (!isFewDataUiApplyable.value) return [];

  const widerColumnKeys = [
    "agent_name",
    "currency_name",
    "trade_directions",
    "payment_amount",
    "comment",
  ];

  return [
    "flex items-center gap-x-2",
    widerColumnKeys.includes(key) ? "w-60" : "w-40",
  ];
};

watch(
  () => props.data,
  () => {
    visibleData.value = [];
    currentPage.value = 1;
    loadMoreRows();
  },
);

// table methods
const loadMoreRows = () => {
  const start = ((currentPage.value - 1) * rowsPerPage.value) as number;
  visibleData.value.push(...props.data.slice(start, start + rowsPerPage.value));
  currentPage.value++;
};

const onVisibilityChange = (isVisible: boolean, index: number) => {
  if (isVisible && index === visibleData.value.length - 10) loadMoreRows();
};

const resolvedHeaderProps = (key: string) => {
  const action = headerActions[key];
  return action?.props ?? {};
};

const resolvedHeaderActions = (key: string) => {
  const action = headerActions[key];
  return {
    change: action?.onChange || (() => {}), // Provide fallback functions
    onOpenDropdown: action?.onOpenDropdown || (() => {}),
  };
};

const resolvedBodyProps = (
  key: string,
  payment: any,
  index: number,
): Record<string, any> => {
  const action = bodyActions[key];
  return action?.props ? action.props(payment, index) : {};
};

const resolvedBodyActions = (key: string, index: number) => {
  const action = bodyActions[key];
  const emittedEvents = {
    change: action?.onChange
      ? (value: any) => action.onChange(key, index, value)
      : null,
    onOpenDropdown: action?.onOpenDropdown || null,
  };

  return Object.fromEntries(
    Object.entries(emittedEvents).filter(([_, handler]) => handler !== null),
  );
};

// methods
const onTryAgainFailedRequest = (id: string) => {
  emit("on-try-again-failed-request", id);
};

const onAddDescription = (index: number, value: string) => {
  props.postData[index].description = value;
};

const onCheckConsignation = (index: number, isChecked: boolean) => {
  props.postData[index].for_consignation = isChecked;
};

const onCheckConsignationForAll = (isChecked: boolean) => {
  props.postData.forEach((item) => (item.for_consignation = isChecked));
};

const onAddCurrency = (index: number, value: number) => {
  props.postData[index].payment_amount = value;
};

const onChangeCommentForAll = (value: string) => {
  props.postData.forEach((data) => (data.description = value));
};

const getRemainAfterPayment = (id: string) => {
  const paymentAmount =
    props.postData.find((item) => item.id === id)?.payment_amount || 0;
  const debt =
    props.data.find((item) => item.id === id)?.current_debt_amount || 0;
  return Math.max(debt - paymentAmount, 0);
};

const onSelectCurrencyForAll = (currencyId: string) => {
  selectedCurrencyIdForAll.value = currencyId;
  props.postData.forEach((data) => (data.currency_id = currencyId));
};

const onChangeAmountForAll = (value: number) => {
  amountForAll.value = value;
  props.postData.forEach((data) => (data.payment_amount = value));
};

const onChangeInputFieldByKey = (
  key: string,
  index: number,
  value: number | string,
) => {
  if (key === "payment_amount") {
    onAddCurrency(index, value as number);
  } else if (key === "comment") {
    onAddDescription(index, value as string);
  }
};

const getClientAgentsById = (clientId: string) => {
  if (props.employedAgents) {
    const clientsEmployees = getFilteredEmployeesByClientId(
      clientId,
      agents.value,
      props.employedAgents,
    );
    return clientsEmployees?.length ? { items: clientsEmployees } : null;
  }
  return null;
};

const setTradeDirectionsByAgentId = (
  data: DropdownItemsModelByType<TradeDirectionsModel>,
  agentId: string,
) => {
  tradeDirectionsByAgentId.value[agentId] = data;
};

const getTradeDirectionsByAgentId = (agentId: string) => {
  return tradeDirectionsByAgentId.value[agentId]?.items?.length
    ? tradeDirectionsByAgentId.value[agentId]
    : null;
};

const isAlreadyFetchedTradeDirections = (agentId: string) => {
  return tradeDirectionsByAgentId.value[agentId];
};

const getTradeDirectionFilterStateByAgentId = (idx: number) => {
  return [
    {
      key: "trade-directions",
      isSingleSelect: true,
      required: true,
      notification: true,
      initialName: props.data[idx]?.trade_direction_name,
      get data() {
        return (
          getTradeDirectionsByAgentId(props.data[idx].agent_id) ||
          tradeDirections.value
        );
      },
      get getSelectedData() {
        return props.postData[idx]?.trade_direction_id;
      },
      set setSelectedData(value: string) {
        if (!props.postData[idx]) {
          props.postData[idx] = {};
        }
        props.postData[idx].trade_direction_id = value;
      },
    },
  ];
};

const getAgentFilterStates = (payment: any, idx: number) => {
  const assignedAgents = getClientAgentsById(payment.client_id);

  const isCurrentAgentAssigned = assignedAgents?.items?.some(
    (agent) => agent.id === props.postData[idx]?.agent_id,
  );

  return [
    {
      key: "agents" + idx,
      isSingleSelect: true,
      required: true,
      notification: true,
      initialName: isCurrentAgentAssigned ? payment.agent?.name : null,
      get data() {
        return assignedAgents || [];
      },
      get getSelectedData() {
        return props.postData[idx]?.agent_id;
      },
      set setSelectedData(value: string) {
        if (!props.postData[idx]) {
          props.postData[idx] = {};
        }
        props.postData[idx].agent_id = value;
      },
    },
  ];
};

const getCurrencyFilterStates = (payment: any, paymentIdx: number) => {
  return [
    {
      key: "currencies",
      isSingleSelect: true,
      required: true,
      notification: true,
      get data() {
        return getPaymentCurrencyDropdownData(props.currencies, [
          props.postData[paymentIdx]?.currency_id,
        ]);
      },
      get getSelectedData() {
        return props.postData[paymentIdx]?.currency_id;
      },
      set setSelectedData(value: string) {
        if (!props.postData[paymentIdx]) {
          props.postData[paymentIdx] = {};
        }
        props.postData[paymentIdx].currency_id = value;
      },
    },
  ];
};

const onOpenDropdown = async (state: string, value: string | unknown) => {
  if (state === "agents" && !agents.value) {
    await fetchAgents();
  } else if (
    state === "trade-directions" &&
    !isAlreadyFetchedTradeDirections(value as string)
  ) {
    const tradeDirections = await fetchTradeDirectionsByAgentId(
      value as string,
    );
    setTradeDirectionsByAgentId(tradeDirections!, value as string);
  }
};

const fetchAgents = async () => {
  agents.value = await applicationPaymentsStore.getAgents(agentsParams.value);
};

const fetchTradeDirections = async () => {
  tradeDirections.value = await applicationPaymentsStore.getTradeDirections(
    tradeDirectionParams.value,
  );
};

const fetchTradeDirectionsByAgentId = async (
  agentId: string,
): Promise<DropdownItemsModelByType<TradeDirectionsModel> | undefined> => {
  const data = await applicationPaymentsStore.getTradeDirections({
    ...tradeDirectionParams.value,
    agent_id: agentId,
  });
  return data;
};

const loadUntilInvalidRow = (index: number) => {
  const targetPage = Math.floor(index / rowsPerPage.value) + 1;

  while (currentPage.value <= targetPage) {
    loadMoreRows();
  }

  const rowElement = document.querySelector(\`#row-\${index}\`);
  if (rowElement) {
    rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  setTimeout(() => {
    const rowElement = document.querySelector(\`#row-\${index}\`);
    if (rowElement) {
      rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 100);
};

defineExpose({
  loadUntilInvalidRow,
});
<\/script>

<style scoped>
.table-content-body {
  padding-bottom: 0;
}

::-webkit-scrollbar {
  width: 8.5px;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
}
</style>
`;export{n as default};
