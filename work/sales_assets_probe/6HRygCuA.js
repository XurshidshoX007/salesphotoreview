const e=`<template>
  <form @submit.prevent="save">
    <d-modal
      :name="
        props.id
          ? t('orders.update_order_restriction_condition')
          : t('orders.add_order_restriction_condition')
      "
      only-close-dialog
      :loading="orderAmountLimitStore.isDetailDialogLoading"
      @closeDialog="closeDialog"
    >
      <flex-col class="w-full gap-5">
        <shared-localized-input
          required
          :label="t('column.name')"
          v-model:base="methodData.default_name"
          v-model:translations="methodData.name_l10n"
        />
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filterStates="baseCurrencyStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <div class="flex gap-5">
          <d-input
            type="number"
            :label="t('column.amount_from')"
            :value="methodData.amount_from"
            acceptZero
            :max="methodData.amount_to"
            @change="(value) => (methodData.amount_from = value)"
          />
          <d-input
            type="number"
            :label="t('column.amount_to')"
            :value="methodData.amount_to"
            acceptZero
            :min="methodData.amount_from"
            @change="(value) => (methodData.amount_to = value)"
          />
        </div>
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filterStates="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <d-input
          pattern-type="comment"
          :label="t('column.comment')"
          :value="methodData.default_description"
          @change="(value) => (methodData.default_description = value)"
        />
        <Switch
          :active="methodData.is_active"
          @change="methodData.is_active = $event"
        />
      </flex-col>
      <template #footer>
        <m-btn class="w-full" type="submit" :loading="isBtnLoading">
          {{ props.id ? t("save") : t("clients.add") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useNotification } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import type { DropdownsByFilterStates } from "#components";
import type { WarehousesModel } from "~/interfaces/api/warehouse/warehouses-model";
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { TradeDirectionsModel } from "~/interfaces/api/settings/trade-directions-model";
import type { AmountConditionModel } from "~/interfaces/api/orders/amount-limit-condition/order-amount-condition-model";
import type { TerritoryModel } from "~/interfaces/api/settings/territory-model";
import type { BaseCurrencyModel } from "~/interfaces/api/settings/base-currency-model";
import type { AgentModel } from "~/interfaces/api/users/agent/agent-model";
import type { CurrencyModel } from "~/interfaces/api/settings/currency-model";
import { OrderEventKeys } from "~/variable/event-key-constants";

const DropdownComponent = ref<typeof DropdownsByFilterStates>(null);

// Props
const props = withDefaults(
  defineProps<{
    id?: string;
    isActive?: boolean;
  }>(),
  {
    isActive: undefined,
  },
);

// emits
const emit = defineEmits<{
  (e: "closeDialog"): void;
  (e: "clearFetchedTab"): void;
}>();

// Stores
const orderAmountLimitStore = useAmountLimitConditionStore("main");

// Composables
const { t } = useI18n();
const eventBus = useEventBus();

// Enums
enum MAIN_TABS {
  LIMITCONDITION = 1,
  AUTOCONFIRM = 2,
}

// State
const isBtnLoading = ref(false);
const warehouses = ref<DropdownItemsModelByType<WarehousesModel> | undefined>();
const agents = ref<DropdownItemsModelByType<AgentModel> | undefined>();
const baseCurrency = ref<
  DropdownItemsModelByType<BaseCurrencyModel> | undefined
>();
const currencies = ref<DropdownItemsModelByType<CurrencyModel> | undefined>();
const territories = ref<DropdownItemsModelByType<TerritoryModel> | undefined>();

const tradeDirections = ref<
  DropdownItemsModelByType<TradeDirectionsModel> | undefined
>();
const dropdownParams = ref(
  props.id ? { ...dropdownParamsAll } : { ...defaultDropdownParams },
);

const warehouseParams = ref<defaultDropdownParamsType>(dropdownParams.value);
const agentParams = ref<defaultDropdownParamsType>(dropdownParams.value);
const currenciesParams = ref<defaultDropdownParamsType>(dropdownParams.value);
const baseCurrenciesParams = ref<defaultDropdownParamsType>(
  dropdownParams.value,
);

const tradeDirectionParams = ref<defaultDropdownParamsType>(
  dropdownParams.value,
);
const territoriesParams = ref<defaultDropdownParamsType>(dropdownParams.value);
const consignationsBoolean = ref({
  items: [
    {
      name: t("filters.all"),
      id: null,
    },
    {
      name: t("filters.yes"),
      id: true,
    },
    {
      name: t("filters.no"),
      id: false,
    },
  ],
});

const filterStates = ref([
  {
    name: t("users.agents.agent"),
    key: "agents",
    get data() {
      return agents.value || [];
    },
    get getSelectedData() {
      return methodData.value.agent_id_arr || [];
    },
    set setSelectedData(value: string[]) {
      methodData.value.agent_id_arr = value;
    },
  },
  {
    name: t("sidebar.warehouse"),
    key: "warehouses",
    get data() {
      return warehouses.value || [];
    },
    get getSelectedData() {
      return methodData.value.warehouse_id_arr || [];
    },
    set setSelectedData(value: string[]) {
      methodData.value.warehouse_id_arr = value;
    },
  },
  {
    name: t("settings_sidebar.payment_method"),
    key: "currencies",
    get data() {
      return currencies.value || [];
    },
    get getSelectedData() {
      return methodData.value.currency_id_arr;
    },
    set setSelectedData(value: string[]) {
      methodData.value.currency_id_arr = value;
    },
  },
  {
    name: t("settings_sidebar.trade_direction"),
    key: "trade-directions",
    get data() {
      return tradeDirections.value || [];
    },
    get getSelectedData() {
      return methodData.value.trade_direction_id_arr || [];
    },
    set setSelectedData(value: string[]) {
      methodData.value.trade_direction_id_arr = value;
    },
  },
  {
    name: t("settings_sidebar.territory"),
    key: "territories",
    get isLoading() {
      return orderAmountLimitStore.isDetailDialogLoading;
    },
    get data() {
      return territories.value || [];
    },
    get getSelectedData() {
      return methodData.value.territory_id_arr;
    },
    set setSelectedData(value: string[]) {
      methodData.value.territory_id_arr = value;
    },
    isTreeView: true,
    checked: true,
  },
  {
    name: t("column.consignation"),
    key: "consignation",
    data: consignationsBoolean.value,
    get getSelectedData() {
      return methodData.value.for_consignation;
    },
    set setSelectedData(value: boolean | null) {
      methodData.value.for_consignation = value;
    },
    isSingleSelect: true,
  },
]);

const baseCurrencyStates = ref([
  {
    name: t("column.currency"),
    key: "base-currency",
    required: true,
    isSingleSelect: true,
    get data() {
      return baseCurrency.value || [];
    },
    get getSelectedData() {
      return methodData.value.base_currency_id || "";
    },
    set setSelectedData(value: string) {
      methodData.value.base_currency_id = value;
    },
  },
]);

const methodData = ref<AmountConditionModel>({
  id: undefined,
  is_active: true,
  name: null,
  default_name: "",
  name_l10n: {},
  for_consignation: null,
  base_currency_id: null,
  amount_from: null,
  amount_to: null,
  agent_id_arr: [],
  warehouse_id_arr: [],
  trade_direction_id_arr: [],
  currency_id_arr: [],
  territory_id_arr: [],
  default_description: null,
});

// Emits

// Methods
const closeDialog = () => {
  emit("closeDialog");
  DropdownComponent.value.onClearFilter();
};

const save = async () => {
  const { notify } = useNotification();
  isBtnLoading.value = true;
  try {
    await orderAmountLimitStore.add(methodData.value);
    notify({ title: t("successful") });

    if (props.id) {
      updateListEmit();
    } else {
      refreshListEmit();
    }
    closeDialog();
  } catch (error) {
    notify({ title: t("error"), type: "error" });
  } finally {
    isBtnLoading.value = false;
  }
};

const refreshListEmit = () => {
  emit("clearFetchedTab");
  nextTick(() => {
    eventBus.emit(OrderEventKeys.REQUEST_AUTOMATION_TABLE_UPDATE, {
      activeTab: MAIN_TABS.LIMITCONDITION,
    });
  });
};

const updateListEmit = () => {
  eventBus.emit(OrderEventKeys.REQUEST_AUTOMATION_TABLE_UPDATE, {
    activeTab: MAIN_TABS.LIMITCONDITION,
    isActive: props.isActive,
  });
};

const getDetail = async () => {
  methodData.value = await orderAmountLimitStore.getAmountLimitDetail(props.id);
};

const onOpenDropdown = async (state: string, value: any) => {
  if (state === "trade-directions" && !tradeDirections.value) {
    await getTradeDirections();
  } else if (state === "agents" && !agents.value) {
    await getAgents();
  } else if (state === "currencies" && !currencies.value) {
    await getCurrencies();
  } else if (state === "base-currency" && !baseCurrency.value) {
    await getBaseCurrencies();
  } else if (state === "warehouses" && !warehouses.value) {
    await getWarehouses();
  } else if (state === "territories" && !territories.value) {
    await getTerritories();
  } else return;
};

const getWarehouses = async () => {
  warehouses.value = await orderAmountLimitStore.getWarehouses(
    warehouseParams.value,
  );
};

const getTradeDirections = async () => {
  tradeDirections.value = await orderAmountLimitStore.getTradeDirectionList(
    tradeDirectionParams.value,
  );
};

const getAgents = async () => {
  agents.value = await orderAmountLimitStore.getAgentsList(agentParams.value);
};

const getCurrencies = async () => {
  currencies.value = await orderAmountLimitStore.getCurrencies(
    currenciesParams.value,
  );
};

const getBaseCurrencies = async () => {
  baseCurrency.value = await orderAmountLimitStore.getBaseCurrenciesList(
    baseCurrenciesParams.value,
  );
};

const getTerritories = async () => {
  territories.value = await orderAmountLimitStore.getTerritoriesList(
    territoriesParams.value,
  );
};
// Hooks
onMounted(async () => {
  if (props.id) {
    await Promise.all([
      getDetail(),
      getWarehouses(),
      getTradeDirections(),
      getAgents(),
      getCurrencies(),
      getTerritories(),
      getBaseCurrencies(),
    ]);
  }
});
<\/script>
`;export{e as default};
