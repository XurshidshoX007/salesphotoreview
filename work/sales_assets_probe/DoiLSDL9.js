const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title-20 :title="t('sidebar.sales_by_product')" />
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
          :storage-key="reportSalesByProductFilterStates"
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
        :filter-storage-key="reportSalesByProductFilterStates"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
      <flex-row class="submit-item">
        <m-btn
          @click="onApplyFilter"
          :loading="reportSalesByClientsStore.isDataFilterLoading"
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
  DatePicker,
  DropdownsByFilterStates,
  RadioBtn,
  TerritoryTreeDropdowns,
} from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import { reportSalesByProductFilterStates } from "~/variable/column-constants";
import { useOrdersAccess } from "~/composables/access/orders/orders";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import {
  OrderListDateFilterType,
  StateFilterType,
} from "~/variable/static-constants";

// stores
const reportSalesByClientsStore = useSalesByProductsStore("main");
const filtersStore = useFiltersStore("/reports/sales-by-products/filter");

// child components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const RadioBtnComponent = ref<typeof RadioBtn | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// state
const { t } = useI18n();

const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(
    key,
    reportSalesByProductFilterStates,
  );
};

const filterStates = ref([
  {
    name: t("settings_sidebar.branches"),
    key: "branches",
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
    name: t("users.supervisors"),
    key: "supervisors",
    get data() {
      return filtersStore.supervisors || [];
    },
    get getSelectedData() {
      return filtersStore.selectedSupervisors;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedSupervisors = value;
    },
    checked: isChecked("supervisors"),
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
    name: t("column.all_products"),
    key: "filter-type",
    isSingleSelect: true,
    get data() {
      return filtersStore.stateFilterType || [];
    },
    get getSelectedData() {
      return filtersStore.selectedStateFilterType;
    },
    set setSelectedData(value: number) {
      filtersStore.selectedStateFilterType = value;
    },
    checked: isChecked("filter-type"),
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

// hooks
const dateFilterTypes = computed(() => {
  return filtersStore.dateFilterTypes || undefined;
});

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    RadioBtnComponent.value?.isClearable() ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedOrderStatuses.length ||
    filtersStore.selectedPriceTypes.length ||
    filtersStore.selectedCurrencies.length ||
    filtersStore.selectedProductCategorieis.length ||
    filtersStore.selectedWarehouses.length ||
    filtersStore.selectedSegments.length ||
    filtersStore.selectedSupervisors.length ||
    filtersStore.selectedProductGroup.length ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedStateFilterType !== StateFilterType.OnlyActive ||
    filtersStore.selectedDateFilterType !== OrderListDateFilterType.ByOrderDate
  );
});

onMounted(async () => {
  await filtersStore.getDateFilterTypes();
  await filtersStore.getFilterTypes();
  onApplyFilter("default");
});

// methods
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[],
) => {
  filterStates.value.push(...territoryFilterStates);
};

const onSelectDateFilterType = (newValue: number) => {
  filtersStore.selectedDateFilterType = newValue;
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onApplyFilter = (type: string | null) => {
  if (!type) {
    reportSalesByClientsStore.params.order_by = null;
  }
  reportSalesByClientsStore.params.order_status_arr = [
    ...filtersStore.selectedOrderStatuses,
  ];
  reportSalesByClientsStore.params.price_type_id_arr =
    filtersStore.selectedPriceTypes;
  reportSalesByClientsStore.params.currency_id_arr =
    filtersStore.selectedCurrencies;
  reportSalesByClientsStore.params.territory_id_arr =
    filtersStore.selectedTerritories;
  reportSalesByClientsStore.params.category_id_arr =
    filtersStore.selectedProductCategorieis;
  reportSalesByClientsStore.params.warehouse_id_arr =
    filtersStore.selectedWarehouses;
  reportSalesByClientsStore.params.date_filter_type =
    filtersStore.selectedDateFilterType;
  reportSalesByClientsStore.params.date_range!.from =
    filtersStore.selectedDateRange?.fromDate;
  reportSalesByClientsStore.params.date_range!.to =
    filtersStore.selectedDateRange?.toDate;
  reportSalesByClientsStore.params.product_state =
    filtersStore.selectedStateFilterType;
  reportSalesByClientsStore.params.product_group_id_arr =
    filtersStore.selectedProductGroup;
  reportSalesByClientsStore.params.segment_id_arr =
    filtersStore.selectedSegments;
  reportSalesByClientsStore.params.agent_id_arr = filtersStore.selectedAgents;
  reportSalesByClientsStore.params.supervisor_id_arr =
    filtersStore.selectedSupervisors;
  reportSalesByClientsStore.params.branch_id_arr =
    filtersStore.selectedBranches;
};

const onClearFilter = () => {
  DatePickerComponent.value!.onReset();
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedOrderStatuses = [];
  filtersStore.selectedPriceTypes = [];
  filtersStore.selectedCurrencies = [];
  filtersStore.selectedProductCategorieis = [];
  filtersStore.selectedWarehouses = [];
  filtersStore.selectedSupervisors = [];
  filtersStore.selectedProductGroup = [];
  filtersStore.selectedSegments = [];
  filtersStore.selectedBranches = [];
  filtersStore.selectedStateFilterType = StateFilterType.OnlyActive;
  filtersStore.selectedDateFilterType = OrderListDateFilterType.ByOrderDate;
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DropdownComponent.value!.onClearFilter();
  DatePickerComponent.value?.onReset();
  RadioBtnComponent.value?.onReset();
  onApplyFilter(null);
};
<\/script>
`;export{e as default};
