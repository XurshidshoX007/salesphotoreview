const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title size="xl" :title="t('column.debt_orders')" />
      <div class="filter-btn-group">
        <div class="w-60">
          <DropdownsByFilterStates :filterStates="termStates" />
        </div>
        <DatePicker
          v-show="orderDebtsStore.setSelectTermDate === 'period'"
          :initial-from-date="initialTermFromDate"
          :initial-to-date="initialTermToDate"
          default-preset="past-30-days"
          ref="DateTermPickerComponent"
          @onApply="onChangeTermDateRange"
        />
        <div class="w-60">
          <DropdownsByFilterStates :filterStates="shippedStates" />
        </div>
        <DatePicker
          v-show="orderDebtsStore.setSelectShippedDate === 'period'"
          default-preset="past-30-days"
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          ref="DatePickerComponent"
          @onApply="onChangeDateRange"
        />
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="orderDebtFilterStates"
          @update="filtersStore.updateFilterStates($event, filterStates)"
        />
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
        ref="TerritoryTreeDropdownsComponent"
        :filter-storage-key="orderDebtFilterStates"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
      <flex-row class="submit-item">
        <m-btn
          @click="onSetFilters"
          :loading="
            orderDebtsStore.isLoading && !orderDebtsStore.isFilterLoading
          "
        >
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
import type {
  DatePicker,
  DropdownsByFilterStates,
  TerritoryTreeDropdowns,
} from "#components";
import { useI18n } from "vue-i18n";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import { useOrderDebtsStore } from "~/stores/dashboard/cashbox/order-debts/order-debts.store";
import { orderDebtFilterStates } from "~/variable/column-constants";
import {
  ConsignationFilterType,
  OrderPaymentStateFilterType,
} from "~/variable/static-constants";

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates>(null);
const DatePickerComponent = ref<typeof DatePicker>(null);
const DateTermPickerComponent = ref<typeof DatePicker>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// Store
const orderDebtsStore = useOrderDebtsStore("main");
const filtersStore = useFiltersStore("/dashboard/cashbox/order-debts");

// state
const { t } = useI18n();

const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const initialTermFromDate = ref(
  filtersStore.selectedTermDateRange?.fromDate || null
);

const initialTermToDate = ref(
  filtersStore.selectedTermDateRange?.toDate || null
);

const periodStates = ref({
  items: [
    {
      id: "all",
      name: t("filters.all"),
    },
    {
      id: "period",
      name: t("cash.period"),
    },
  ],
});

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, orderDebtFilterStates);
};

const filterStates = ref<FilterStateModel[]>([
  {
    name: t("settings_sidebar.branches"),
    key: "branches",
    isFilter: true,
    get data() {
      return filtersStore.branches || [];
    },
    get getSelectedData() {
      return filtersStore.selectedBranches;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedBranches = value;
    },
    checked: isChecked("branches"),
  },
  {
    name: t("users.agents.agent"),
    key: "agent-dropdown",
    isFilter: true,
    get data() {
      return filtersStore.agents || [];
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
    name: t("clients.forwarder"),
    key: "expeditors",
    get data() {
      return filtersStore.expeditors || [];
    },
    get getSelectedData() {
      return filtersStore.selectedExpeditors;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedExpeditors = value;
    },
    checked: isChecked("expeditors"),
  },
  {
    name: t("settings_sidebar.client_category"),
    key: "client-categories",
    get data() {
      return filtersStore.clientCategories || [];
    },
    get getSelectedData() {
      return filtersStore.selectedClientCategories;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedClientCategories = value;
    },
    checked: isChecked("client-categories"),
  },
  {
    name: t("sidebar.clients"),
    key: "clients",
    required: true,
    get data() {
      return filtersStore.clients || [];
    },
    get getSelectedData() {
      return filtersStore.selectedClients;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedClients = value;
    },
    onLoadElse: async () => {
      await filtersStore.onLoadElseClients();
    },
    checked: isChecked("clients"),
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
    name: t("column.order-payment-filter-type"),
    key: "order-payment-filter-type",
    isSingleSelect: true,
    get data() {
      return filtersStore.orderPaymentStateFilterType || [];
    },
    get getSelectedData() {
      return filtersStore.selectedOrderPaymentFilterType;
    },
    set setSelectedData(value: number) {
      filtersStore.selectedOrderPaymentFilterType = value;
    },
    checked: isChecked("order-payment-filter-type"),
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
    name: t("column.consignation"),
    key: "consignation-filter-type",
    isSingleSelect: true,
    get data() {
      return { items: filtersStore.consignationFilterTypes };
    },
    get getSelectedData() {
      return filtersStore.selectedConsignationFilterType;
    },
    set setSelectedData(value: number) {
      filtersStore.selectedConsignationFilterType = value;
    },
    checked: isChecked("consignation-filter-type"),
  },
  {
    name: t("column.warehouses"),
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

const termStates = ref([
  {
    name: t("column.consignation_term"),
    key: "date",
    isSingleSelect: true,
    get data() {
      return periodStates.value || [];
    },
    get getSelectedData() {
      return orderDebtsStore.setSelectTermDate;
    },
    set setSelectedData(value: string) {
      orderDebtsStore.setSelectTermDate = value;
    },
  },
]);

const shippedStates = ref([
  {
    name: t("column.shipped_date"),
    key: "date",
    isSingleSelect: true,
    get data() {
      return periodStates.value || [];
    },
    get getSelectedData() {
      return orderDebtsStore.setSelectShippedDate;
    },
    set setSelectedData(value: string) {
      orderDebtsStore.setSelectShippedDate = value;
    },
  },
]);

// hooks

onMounted(async () => {
  await filtersStore.getOrderPaymentStateFilterType();
  await filtersStore.getConsignationFilterTypes();
  onSetFilters();
});

// methods
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[]
) => {
  filterStates.value.push(...territoryFilterStates);
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onChangeTermDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedTermDateRange = newRange;
};

const onSetFilters = () => {
  orderDebtsStore.setNullMultipleDialog();
  orderDebtsStore.params.branch_id_arr = filtersStore.selectedBranches;
  orderDebtsStore.params.agent_id_arr = [...filtersStore.selectedAgents];
  orderDebtsStore.params.client_id_arr = filtersStore.selectedClients;
  orderDebtsStore.params.client_category_id_arr =
    filtersStore.selectedClientCategories;
  orderDebtsStore.params.client_category_id_arr =
    filtersStore.selectedClientCategories;
  orderDebtsStore.params.expeditor_id_arr = filtersStore.selectedExpeditors;
  orderDebtsStore.params.territory_id_arr = filtersStore.selectedTerritories;
  orderDebtsStore.params.currency_id_arr = filtersStore.selectedCurrencies;
  orderDebtsStore.params.warehouse_id_arr = filtersStore.selectedWarehouses;
  orderDebtsStore.params.trade_direction_id_arr =
    filtersStore.selectedTradeDirections;
  orderDebtsStore.params.consignation_filter_type =
    filtersStore.selectedConsignationFilterType;
  orderDebtsStore.params.order_payment_state_filter_type =
    filtersStore.selectedOrderPaymentFilterType;
  orderDebtsStore.params.shipped_date_range = updateRange(
    orderDebtsStore.setSelectShippedDate,
    filtersStore.selectedDateRange
  );
  orderDebtsStore.params.term_range = updateRange(
    orderDebtsStore.setSelectTermDate,
    filtersStore.selectedTermDateRange
  );
  orderDebtsStore.setPage(1);
};

const updateRange = (condition: string, selectedRange: DateRangeModel) => {
  const storeRange =
    condition === "period"
      ? { to: selectedRange?.toDate, from: selectedRange?.fromDate }
      : null;
  return storeRange;
};

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    DateTermPickerComponent.value?.isClearable() ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedWarehouses.length ||
    filtersStore.selectedClients.length ||
    filtersStore.selectedExpeditors.length ||
    filtersStore.selectedCurrencies.length ||
    filtersStore.selectedOrderPaymentFilterType !==
      OrderPaymentStateFilterType.All ||
    filtersStore.selectedConsignationFilterType !==
      ConsignationFilterType.All ||
    filtersStore.selectedTradeDirections.length
  );
});

const onClearFilter = () => {
  orderDebtsStore.setPage(1);
  filtersStore.selectedBranches = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedCurrencies = [];
  filtersStore.selectedWarehouses = [];
  filtersStore.selectedExpeditors = [];
  filtersStore.selectedTradeDirections = [];
  filtersStore.selectedClients = [];
  filtersStore.selectedOrderPaymentFilterType = OrderPaymentStateFilterType.All;
  filtersStore.selectedConsignationFilterType = ConsignationFilterType.All;
  filtersStore.selectedClientCategories = [];
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DropdownComponent.value.onClearFilter();
  DatePickerComponent.value?.onReset();
  DateTermPickerComponent.value?.onReset();
  onSetFilters();
};
<\/script>
`;export{e as default};
