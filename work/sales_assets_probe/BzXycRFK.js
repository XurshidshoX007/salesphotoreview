const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title20 :title="t('sidebar.orders_by_agents')" />
      <div class="filter-btn-group">
        <RadioBtn
          ref="RadioBtnComponent"
          :label="t('labels.date_applies_to')"
          :items="dateFilterTypes"
          :selectedItem="filtersStore.selectedDateFilterType"
          @onSelectItemId="onSelectDateFilterType"
        />
        <DatePicker
          ref="DatePickerComponent"
          tomorrow-preset
          default-preset="this-month"
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          @onApply="onChangeDateRange"
        />
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="reportOrderByAgentsFilterStates"
          @update="filtersStore.updateFilterStates($event, filterStates)"
        />
      </div>
    </div>
    <div class="filter-content">
      <DropdownsByFilterStates
        ref="DropdownComponent"
        :filter-states="filtersStore.checkedFilterStates(filterStates)"
        @onOpenDropdown="filtersStore.onOpenDropdown"
        @search="filtersStore.onSearchDropdown"
      />
      <TerritoryTreeDropdowns
        ref="TerritoryTreeDropdownsComponent"
        :filter-storage-key="reportOrderByAgentsFilterStates"
        with-title
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
      <flex-row class="submit-item">
        <m-btn
          @click="onApplyFilter"
          :loading="
            (ordersByAgentsStore.isByCategoryLoading ||
              ordersByAgentsStore.isByOrdersLoading) &&
            !ordersByAgentsStore.isFilterLoading
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
  RadioBtn,
  TerritoryTreeDropdowns,
} from "#components";
import { reportOrderByAgentsFilterStates } from "~/variable/column-constants";
import { useI18n } from "vue-i18n";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { OrderListDateFilterType } from "~/variable/static-constants";

// Store
const ordersByAgentsStore = useOrdersByAgentsStore("main");
const filtersStore = useFiltersStore("/reports/order-by-agents");

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const RadioBtnComponent = ref<typeof RadioBtn | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// State
const { t } = useI18n();
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(
    key,
    reportOrderByAgentsFilterStates
  );
};

const filterStates = ref([
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
    name: t("column.order_type"),
    key: "order-type",
    get data() {
      return filtersStore.orderTypes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedOrderTypesSingle;
    },
    set setSelectedData(value: number) {
      filtersStore.selectedOrderTypesSingle = value;
    },
    isSingleSelect: true,
    checked: isChecked("order-type"),
  },
  {
    name: t("column.order_status"),
    key: "order-statuses",
    get data() {
      return filtersStore.orderStatuses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedOrderStatuses;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedOrderStatuses = value;
    },
    checked: isChecked("order-statuses"),
  },
  {
    name: t("settings_sidebar.product_category"),
    key: "product-category",
    get data() {
      return filtersStore.productCategory || [];
    },
    get getSelectedData() {
      return filtersStore.selectedProductCategorieis;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedProductCategorieis = value;
    },
    checked: isChecked("product-category"),
  },
  {
    name: t("column.product_group"),
    key: "product-group",
    get data() {
      return filtersStore.productGroup || [];
    },
    get getSelectedData() {
      return filtersStore.selectedProductGroup;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedProductGroup = value;
    },
    checked: isChecked("product-group"),
  },
  {
    name: t("settings.segment"),
    key: "segments",
    get data() {
      return filtersStore.segments || [];
    },
    get getSelectedData() {
      return filtersStore.selectedSegments;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedSegments = value;
    },
    checked: isChecked("segments"),
  },
  {
    name: t("settings_sidebar.products"),
    key: "products",
    get data() {
      return filtersStore.products || [];
    },
    get getSelectedData() {
      return filtersStore.selectedProducts;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedProducts = value;
    },
    checked: isChecked("products"),
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
    name: t("settings_sidebar.price_type"),
    key: "price-type",
    get data() {
      return filtersStore.priceTypes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedPriceTypes;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedPriceTypes = value;
    },
    checked: isChecked("price-type"),
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
]);

// hooks

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    RadioBtnComponent.value?.isClearable() ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedOrderStatuses.length ||
    filtersStore.selectedPriceTypes.length ||
    filtersStore.selectedCurrencies.length ||
    filtersStore.selectedProductCategorieis.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedProductGroup.length ||
    filtersStore.selectedProducts.length ||
    filtersStore.selectedTradeDirections.length ||
    filtersStore.selectedSegments.length ||
    filtersStore.selectedDateFilterType !== OrderListDateFilterType.ByOrderDate
  );
});

const dateFilterTypes = computed(() => {
  return ordersByAgentsStore.dateFilterTypes || undefined;
});

onMounted(async () => {
  await filtersStore.getOrderTypes();
  await filtersStore.getConsignationFilterTypes();
  filtersStore.selectedOrderTypesSingle = filtersStore.orderTypes.items[0]?.id;
  onApplyFilter();
});

// methods
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[]
) => {
  filterStates.value.push(...territoryFilterStates);
};

const onSelectDateFilterType = (newValue: number) => {
  filtersStore.selectedDateFilterType = newValue;
};

const onApplyFilter = () => {
  ordersByAgentsStore.tableParams.page = 1;
  ordersByAgentsStore.commonParams.branch_id_arr =
    filtersStore.selectedBranches;
  ordersByAgentsStore.commonParams.order_status_arr =
    filtersStore.selectedOrderStatuses;
  ordersByAgentsStore.commonParams.price_type_id_arr =
    filtersStore.selectedPriceTypes;
  ordersByAgentsStore.commonParams.currency_id_arr =
    filtersStore.selectedCurrencies;
  ordersByAgentsStore.commonParams.agent_id_arr = [
    ...filtersStore.selectedAgents,
  ];
  ordersByAgentsStore.commonParams.trade_direction_id_arr = [
    ...filtersStore.selectedTradeDirections,
  ];
  ordersByAgentsStore.commonParams.territory_id_arr =
    filtersStore.selectedTerritories;
  ordersByAgentsStore.commonParams.category_id_arr =
    filtersStore.selectedProductCategorieis;
  ordersByAgentsStore.commonParams.product_id_arr =
    filtersStore.selectedProducts;
  ordersByAgentsStore.commonParams.product_group_id_arr =
    filtersStore.selectedProductGroup;
  ordersByAgentsStore.commonParams.client_category_id_arr =
    filtersStore.selectedClientCategories;
  ordersByAgentsStore.commonParams.date_filter_type =
    filtersStore.selectedDateFilterType;
  ordersByAgentsStore.commonParams.order_type =
    filtersStore.selectedOrderTypesSingle;
  ordersByAgentsStore.commonParams.consignation_filter_type =
    filtersStore.selectedConsignationFilterType;
  ordersByAgentsStore.commonParams.segment_id_arr =
    filtersStore.selectedSegments;
  if (filtersStore.selectedDateRange) {
    ordersByAgentsStore.commonParams.date_range!.from =
      filtersStore.selectedDateRange.fromDate;
    ordersByAgentsStore.commonParams.date_range!.to =
      filtersStore.selectedDateRange.toDate;
  }
};

const onClearFilter = () => {
  ordersByAgentsStore.setPage(1);
  filtersStore.selectedBranches = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedOrderStatuses = [];
  filtersStore.selectedTradeDirections = [];
  filtersStore.selectedProducts = [];
  filtersStore.selectedPriceTypes = [];
  filtersStore.selectedCurrencies = [];
  filtersStore.selectedProductCategorieis = [];
  filtersStore.selectedClientCategories = [];
  filtersStore.selectedProductGroup = [];
  filtersStore.selectedSegments = [];
  filtersStore.selectedDateFilterType = OrderListDateFilterType.ByOrderDate;
  DropdownComponent.value!.onClearFilter();
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DatePickerComponent.value?.onReset();
  RadioBtnComponent.value?.onReset();
  onApplyFilter();
};

const onChangeDateRange = (newRange: any) => {
  filtersStore.selectedDateRange = newRange;
};
<\/script>
`;export{e as default};
