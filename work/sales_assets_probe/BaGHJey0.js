const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title-20 :title="t('sidebar.sales_by_clients_4')" />
      <div class="filter-btn-group">
        <QuarterPicker
          ref="QuarterPickerComponent"
          :defaultQuartersValues="month"
          @onApply="changeQuarter"
        />
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="reportsByPeriodCompareFilter"
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
        :filter-storage-key="reportsByPeriodCompareFilter"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
      <flex-row class="submit-item">
        <m-btn
          :loading="salesByCustomerPeriodStore.isLoadingPage"
          @click="onApplyFilter"
          >{{ t("apply") }}
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
  QuarterPicker,
  TerritoryTreeDropdowns,
} from "#components";
import { reportsByPeriodCompareFilter } from "~/variable/column-constants";
import { useSalesByClientsByPeriodCompareStore } from "~/stores/reports/sales-by-clients/by-period-compare/customer-by-period-compare";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";

// stores
const filtersStore = useFiltersStore("orders/orders");
const salesByCustomerPeriodStore =
  useSalesByClientsByPeriodCompareStore("main");

// child components
const QuarterPickerComponent = ref<typeof QuarterPicker | null>(null);
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// state
const { t } = useI18n();

const defaultMonth = ref([
  {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  },
]);

const month = ref(defaultMonth.value);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, reportsByPeriodCompareFilter);
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
    name: t("column.type"),
    key: "order-type",
    get data() {
      return filtersStore.orderTypes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedOrderTypes;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedOrderTypes = value;
    },
    checked: isChecked("order-type"),
  },
  {
    name: t("column.status"),
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
    name: t("filters.brand"),
    key: "brands",
    isSingleSelect: true,
    get data() {
      return filtersStore.brands || [];
    },
    get getSelectedData() {
      return filtersStore.selectedBrands;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedBrands = value;
    },
    checked: isChecked("brands"),
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
    name: t("column.consignation"),
    key: "consignations",
    isSingleSelect: true,
    get data() {
      return filtersStore.consignationsBoolean || [];
    },
    get getSelectedData() {
      return filtersStore.selectedConsignationBoolean;
    },
    set setSelectedData(value: boolean) {
      filtersStore.selectedConsignationBoolean = value;
    },
    checked: isChecked("consignations"),
  },
]);

// hooks

const isFilterClearable = computed(() => {
  return !(
    filtersStore.selectedBranches.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedOrderStatuses.length ||
    filtersStore.selectedOrderTypes.length ||
    filtersStore.selectedProductCategorieis.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedTradeDirections.length ||
    filtersStore.selectedBrands.length ||
    filtersStore.selectedConsignationBoolean !== null ||
    month.value.length > 1
  );
});

onMounted(async () => {
  onApplyFilter();
});

// methods
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[]
) => {
  filterStates.value.push(...territoryFilterStates);
};

const changeQuarter = (newMonth) => {
  month.value = newMonth;
};

const onApplyFilter = () => {
  salesByCustomerPeriodStore.params.branch_id_arr =
    filtersStore.selectedBranches;
  salesByCustomerPeriodStore.params.order_status_arr = [
    ...filtersStore.selectedOrderStatuses,
  ];
  salesByCustomerPeriodStore.params.order_type_arr =
    filtersStore.selectedOrderTypes;
  salesByCustomerPeriodStore.params.territory_id_arr =
    filtersStore.selectedTerritories;
  salesByCustomerPeriodStore.params.product_category_id_arr =
    filtersStore.selectedProductCategorieis;
  salesByCustomerPeriodStore.params.client_category_id_arr =
    filtersStore.selectedClientCategories;
  salesByCustomerPeriodStore.params.for_consignation_arr =
    (filtersStore.selectedConsignationBoolean === null && [true, false]) || [
      filtersStore.selectedConsignationBoolean,
    ];
  salesByCustomerPeriodStore.params.trade_direction_id_arr =
    filtersStore.selectedTradeDirections;
  salesByCustomerPeriodStore.params.agent_id_arr = filtersStore.selectedAgents;
  salesByCustomerPeriodStore.params.brand_id_arr = filtersStore.selectedBrands;
  salesByCustomerPeriodStore.params.year_month_arr = month.value;
};

const onClearFilter = () => {
  filtersStore.selectedBranches = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedOrderStatuses = [];
  filtersStore.selectedOrderTypes = [];
  filtersStore.selectedProductCategorieis = [];
  filtersStore.selectedClientCategories = [];
  filtersStore.selectedTradeDirections = [];
  filtersStore.selectedBrands = [];
  filtersStore.selectedConsignationBoolean = null;
  QuarterPickerComponent.value?.isDeleted();
  month.value = defaultMonth.value;
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DropdownComponent.value!.onClearFilter();
  onApplyFilter();
};
<\/script>
`;export{e as default};
