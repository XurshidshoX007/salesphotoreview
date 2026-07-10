const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header mb-2 items-center!">
      <page-title20 :title="t('sidebar.request_automation')" />

      <div class="flex items-center flex-wrap gap-x-3">
        <MultiTab
          variant="primary"
          :tabs="filteredTabs"
          v-model:active="activeTab"
          @update:active="onTabChange"
        />
        <m-btn
          v-if="isAllowForSave"
          @click="emits('onCreate')"
          class="min-w-30!"
        >
          {{ t("create") }}
        </m-btn>
      </div>
    </div>

    <div class="filter-content">
      <DropdownsByFilterStates
        ref="DropdownComponent"
        :filterStates="filtersStore.checkedFilterStates(filterStates)"
        @onOpenDropdown="filtersStore.onOpenDropdown"
        @search="filtersStore.onSearchDropdown"
      />

      <TerritoryTreeDropdowns
        v-show="activeTab === MAIN_TABS.LIMITCONDITION"
        ref="TerritoryTreeDropdownsComponent"
        :filter-storage-key="requestAutomationFilterStates"
        with-title
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />

      <flex-row class="submit-item">
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="requestAutomationFilterStates"
          @update="filtersStore.updateFilterStates($event, filterStates)"
        />

        <m-btn @click="onSetFilters" :loading="isLoading">
          {{ t("apply") }}
        </m-btn>
        <ResetFilterBtn
          :is-filter-clearable="isFilterClearable"
          @onClearFilter="onClearFilter"
        />
      </flex-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type {
  DropdownsByFilterStates,
  TerritoryTreeDropdowns,
} from "#components";
import { requestAutomationFilterStates } from "~/variable/column-constants";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { OrderEventKeys } from "~/variable/event-key-constants";
import { useRequestAutomationAccess } from "~/composables/access/orders/request-automation";
import { useOrderAmountLimitConditionAccess } from "~/composables/access/orders/amount-limit-condition";

// Model
const loadedTabs = defineModel<Set<number>>("loadedTabs");

// Emits
interface clearFitchedtabsProp {
  activeTab: number;
  filters: any;
}

type Emits = {
  (e: "onCreate"): void;
  (e: "change-tab", value: number): void;
  (e: "clearFitchedTabs", value: clearFitchedtabsProp): void;
  (e: "setFirstTab", value: number): void;
};

const emits = defineEmits<Emits>();

const activeTab = defineModel<number>("activeTab");

// Composables
const { t } = useI18n();
const eventBus = useEventBus();
const {
  hasAccess2GetList: limitConditionListAccess,
  hasAccess2Save: limitConditionSaveAccess,
} = useOrderAmountLimitConditionAccess();
const {
  hasAccess2GetList: autoConfirmListAccess,
  hasAccess2Save: autoConfirmSaveAccess,
} = useRequestAutomationAccess();

// Child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// Stores
const filtersStore = useFiltersStore("orders/request-automation");

// Helpers
const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, requestAutomationFilterStates);
};

// Constants
const updateListEventKey = OrderEventKeys.REQUEST_AUTOMATION_TABLE_UPDATE;
const updateIsLoadingEventKey =
  OrderEventKeys.REQUEST_AUTOMATION_IS_LOADING_UPDATE;

// Enums

enum MAIN_TABS {
  LIMITCONDITION = 1,
  AUTOCONFIRM = 2,
}

// States
const isLoading = ref<boolean>(false);
const unAttachAgent = ref([
  {
    name: t("column.without_agent"),
    id: "00000000-0000-0000-0000-000000000000",
    is_active: true,
  },
]);

const territoryFilterStates = ref<FilterStateModel[]>([]);

const filters = ref([
  {
    name: t("users.agents.agent"),
    key: "agent-dropdown",
    isFilter: true,
    get data() {
      return withoutAgentsStates.value || [];
    },
    get getSelectedData() {
      return filtersStore.selectedAgents;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedAgents = value;
    },
    checked: isChecked("agent-dropdown"),
  },
  {
    name: t("settings_sidebar.trade_direction"),
    key: "trade-directions",
    get data() {
      return filtersStore.tradeDirections || [];
    },
    get getSelectedData() {
      return filtersStore.selectedTradeDirections;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedTradeDirections = value;
    },
    checked: isChecked("trade-directions"),
  },
  {
    name: t("settings_sidebar.payment_method"),
    key: "currencies",
    isFilter: true,
    get data() {
      return filtersStore.currency || [];
    },
    get getSelectedData() {
      return filtersStore.selectedCurrencies;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedCurrencies = value;
    },
    checked: isChecked("currencies"),
  },
  {
    name: t("sidebar.warehouse"),
    key: "warehouses",
    get data() {
      return filtersStore.warehouses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedWarehouses;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedWarehouses = value;
    },
    checked: isChecked("warehouses"),
  },
]);

const additionalTypes = ref([
  {
    name: t("orders.request_automation.execution_type"),
    key: "expected-shipping-date-calculation-types",
    isFilter: true,
    get data() {
      return filtersStore.expectedShippingDateCalculationTypes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedExpectedShippingDateCalculationType;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedExpectedShippingDateCalculationType = value;
    },
    checked: isChecked("expected-shipping-date-calculation-types"),
  },
  {
    name: t("orders.request_automation.order_type"),
    key: "order-types-with-partial-return",
    isFilter: true,
    get data() {
      return filtersStore.orderTypesWithPartialReturn || [];
    },
    get getSelectedData() {
      return filtersStore.selectedOrderTypesWithPartialReturn;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedOrderTypesWithPartialReturn = value;
    },
    checked: isChecked("order-types-with-partial-return"),
  },
]);

interface ITabConfigs {
  key: number;
  title: string;
  hasAccess: boolean;
}

const tabConfigs = ref<ITabConfigs[]>([
  {
    key: MAIN_TABS.LIMITCONDITION,
    title: t("orders.request_automation.limit-condition"),
    hasAccess: limitConditionListAccess.value,
  },
  {
    key: MAIN_TABS.AUTOCONFIRM,
    title: t("orders.request_automation.auto_confirmation"),
    hasAccess: autoConfirmListAccess.value,
  },
]);

// Hooks

const filteredTabs = computed(() =>
  tabConfigs.value.filter((tab) => tab.hasAccess),
);

const isAllowForSave = computed(() =>
  activeTab.value === MAIN_TABS.LIMITCONDITION
    ? limitConditionSaveAccess.value
    : autoConfirmSaveAccess.value,
);

const filterParams = computed(() => ({
  expected_shipping_date_calculation_type:
    filtersStore.selectedExpectedShippingDateCalculationType.map((i) =>
      String(i),
    ),
  trade_direction_ids: filtersStore.selectedTradeDirections || [],
  warehouse_ids: filtersStore.selectedWarehouses || [],
  agent_ids: filtersStore.selectedAgents || [],
  currency_ids: filtersStore.selectedCurrencies || [],
  order_types:
    filtersStore.selectedOrderTypesWithPartialReturn.map((i) => i.toString()) ||
    [],
  territory_id_arr: filtersStore.selectedTerritories,
}));

const withoutAgentsStates = computed(() => {
  return {
    items: filtersStore.agents
      ? [...unAttachAgent.value, ...filtersStore.agents.items]
      : undefined,
  };
});

const filterStates = computed(() => {
  return [
    ...(activeTab.value === MAIN_TABS.AUTOCONFIRM ? additionalTypes.value : []),
    ...filters.value,
    ...(activeTab.value === MAIN_TABS.LIMITCONDITION
      ? territoryFilterStates.value
      : []),
  ];
});

const isFilterClearable = computed(() => {
  return !(
    filtersStore.selectedExpectedShippingDateCalculationType.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTradeDirections.length ||
    filtersStore.selectedWarehouses.length ||
    filtersStore.selectedCurrencies.length ||
    filtersStore.selectedOrderTypesWithPartialReturn.length ||
    (activeTab.value === MAIN_TABS.LIMITCONDITION &&
      filtersStore.selectedTerritories.length)
  );
});

eventBus.on(updateIsLoadingEventKey, changeIsLoading);

onBeforeUnmount(() => {
  eventBus.off(updateIsLoadingEventKey, changeIsLoading);
});

onMounted(() => {
  emits("setFirstTab", filteredTabs.value[0]?.key);
});

watch(
  () => activeTab.value!,
  async (newTab: number) => {
    const isFirstLoad = !loadedTabs.value!.has(newTab);

    if (isFirstLoad) {
      loadedTabs.value!.add(newTab);
      await nextTick();
      emitFilters();
    }
  },
  { immediate: true },
);

// Methods
const addTerritoryFilterStates = (value: FilterStateModel[]) => {
  territoryFilterStates.value = value;
};

const onTabChange = (tab: number) => {
  emits("change-tab", tab);
};

function changeIsLoading(value: boolean) {
  isLoading.value = value;
}

const emitFilters = () => {
  eventBus.emit(updateListEventKey, {
    activeTab: activeTab.value,
    filters: filterParams.value,
  });
};

const onSetFilters = () => {
  emits("clearFitchedTabs", {
    activeTab: activeTab.value!,
    filters: filterParams.value,
  });
  loadedTabs.value!.forEach((tab) => {
    if (tab !== activeTab.value) {
      loadedTabs.value!.delete(tab);
    }
  });
  nextTick(() => {
    emitFilters();
  });
};

const onClearFilter = () => {
  filtersStore.selectedExpectedShippingDateCalculationType = [];
  filtersStore.selectedTradeDirections = [];
  filtersStore.selectedWarehouses = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedCurrencies = [];
  filtersStore.selectedOrderTypesWithPartialReturn = [];
  DropdownComponent.value?.onClearFilter();
  if (TerritoryTreeDropdownsComponent.value) {
    TerritoryTreeDropdownsComponent.value.clearSelectedItems();
  }
  onSetFilters();
};
<\/script>

<style lang="scss" scoped>
.filter-content {
  grid-template-columns: repeat(auto-fill, minmax(188px, 1fr)) 300px;

  @media (max-width: 1837px) {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}
</style>
`;export{e as default};
