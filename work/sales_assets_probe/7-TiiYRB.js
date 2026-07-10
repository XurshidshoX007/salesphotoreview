const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title20 :title="t('sidebar.sales_by_customer')" />
      <div class="filter-btn-group">
        <RadioBtn
          ref="RadioBtnComponent"
          :label="t('labels.date_applies_to')"
          :items="dateFilterTypes"
          :selectedItem="filtersStore.selectedDateFilterType"
          name="date-filter-types"
          @onSelectItemId="onSelectDateFilterType"
        />
        <DatePicker
          ref="DatePickerComponent"
          default-preset="past-7-days"
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          tomorrow-option
          @onApply="onChangeDateRange"
        />
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="reportCustomerMinimumFilterStates"
          @update="filtersStore.updateFilterStates($event, filterStates)"
        />
      </div>
    </div>
    <div class="filter-content">
      <dropdowns-by-filter-states
        ref="DropdownComponent"
        :filterStates="filtersStore.checkedFilterStates(filterStates)"
        @onOpenDropdown="filtersStore.onOpenDropdown"
      />
      <TerritoryTreeDropdowns
        ref="TerritoryTreeDropdownsComponent"
        :filter-storage-key="reportCustomerMinimumFilterStates"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addAdditionalFilterStates"
      />
      <div
        v-show="isChecked(sliderSummaFromToState)"
        class="md:col-span-2 col-span-1"
      >
        <FilterSlider
          :range-amount="filtersStore.priceRangeStatic"
          :min="filtersStore.priceStatic.min"
          :max="filtersStore.priceStatic.max"
          :filter-storage-key="reportCustomerMinimumFilterStates"
          @on-range-amount="filtersStore.priceRangeStatic = $event"
          @addSliderFilterState="addAdditionalFilterStates"
        />
      </div>
      <flex-row class="submit-item">
        <m-btn
          :loading="salesByClientsMinAkbStore.isClientsDataLoading"
          @click="onApplyFilter"
          >{{ t("apply") }}</m-btn
        >
        <ResetFilterBtn
          :is-filter-clearable="isFilterClearable"
          @onClearFilter="onClearFilter"
        />
      </flex-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import moment from "moment";
import type {
  DatePicker,
  DropdownsByFilterStates,
  RadioBtn,
  TerritoryTreeDropdowns,
} from "#components";
import { useI18n } from "vue-i18n";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import {
  reportCustomerMinimumFilterStates,
  sliderSummaFromToState,
} from "~/variable/column-constants";
import {
  OrderListDateFilterType,
  StateFilterType,
} from "~/variable/static-constants";

// store
const salesByClientsMinAkbStore = useSalesByClientsMinAkbStore("main");
const filtersStore = useFiltersStore("/reports/customer/minimum");

// child-components
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const RadioBtnComponent = ref<typeof RadioBtn | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// states
const { t } = useI18n();

const selectedDays = ref<string[]>([]);
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(
    key,
    reportCustomerMinimumFilterStates
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
    name: t("column.day_of_visit"),
    key: "day",
    data: filtersStore.days,
    get getSelectedData() {
      return selectedDays.value;
    },
    set setSelectedData(value: string[]) {
      selectedDays.value = value;
    },
    checked: isChecked("day"),
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
    name: t("clients.client_activity"),
    key: "filter-type",
    isSingleSelect: true,
    get data() {
      return filtersStore.stateFilterType;
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
    key: "consignation",
    isSingleSelect: true,
    get data() {
      return {
        items: filtersStore.consignationFilterTypes || undefined,
      };
    },
    get getSelectedData() {
      return filtersStore.selectedConsignationFilterType;
    },
    set setSelectedData(value: number) {
      filtersStore.selectedConsignationFilterType = value;
    },
    checked: isChecked("consignation"),
  },
]);

// hooks
onMounted(async () => {
  await Promise.all([
    filtersStore.getOrderTypes(),
    filtersStore.getConsignationFilterTypes(),
    filtersStore.getFilterTypes(),
  ]);

  autSelectOrderType();
  onApplyFilter();
});

const dateFilterTypes = computed(() => {
  return salesByClientsMinAkbStore.dateFilterTypes || undefined;
});

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    RadioBtnComponent.value?.isClearable() ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedOrderStatuses.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedPriceTypes.length ||
    filtersStore.selectedProductCategorieis.length ||
    filtersStore.selectedProductGroup.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedStateFilterType !== StateFilterType.OnlyActive ||
    filtersStore.selectedProducts.length ||
    filtersStore.selectedSegments.length ||
    selectedDays.value.length ||
    salesByClientsMinAkbStore.params.date_filter_type !==
      OrderListDateFilterType.ByOrderDate ||
    filtersStore.priceRangeStatic[0] !== filtersStore.priceStatic.min ||
    filtersStore.priceRangeStatic[1] !== filtersStore.priceStatic.max
  );
});

// methods
const autSelectOrderType = () => {
  filtersStore.selectedOrderTypesSingle = filtersStore.orderTypes.items[0]?.id;
};

const addAdditionalFilterStates = (
  additionalFilterStates: FilterStateModel[]
) => {
  filterStates.value.push(...additionalFilterStates);
};

const onSelectDateFilterType = (newValue: number) => {
  filtersStore.selectedDateFilterType = newValue;
};

const onApplyFilter = () => {
  salesByClientsMinAkbStore.params.page = 1;
  salesByClientsMinAkbStore.params.branch_id_arr =
    filtersStore.selectedBranches;
  salesByClientsMinAkbStore.params.order_status_arr =
    filtersStore.selectedOrderStatuses;
  salesByClientsMinAkbStore.params.category_id_arr = [
    ...filtersStore.selectedProductCategorieis,
  ];
  salesByClientsMinAkbStore.params.amount_range.from_value =
    filtersStore.priceRangeStatic[0];
  salesByClientsMinAkbStore.params.amount_range.to_value =
    filtersStore.priceRangeStatic[1];
  salesByClientsMinAkbStore.params.date_filter_type =
    filtersStore.selectedDateFilterType;
  salesByClientsMinAkbStore.params.date_range!.from = moment(
    filtersStore.selectedDateRange!.fromDate
  );
  salesByClientsMinAkbStore.params.date_range!.to = moment(
    filtersStore.selectedDateRange!.toDate
  );
  salesByClientsMinAkbStore.params.product_id_arr =
    filtersStore.selectedProducts;
  salesByClientsMinAkbStore.params.product_group_id_arr =
    filtersStore.selectedProductGroup;
  // salesByClientsMinAkbStore.params.agent_id_arr = selectedAgents.value;
  salesByClientsMinAkbStore.params.visit_day_arr = selectedDays.value;
  salesByClientsMinAkbStore.params.client_category_id_arr =
    filtersStore.selectedClientCategories;
  salesByClientsMinAkbStore.params.territory_id_arr =
    filtersStore.selectedTerritories;
  salesByClientsMinAkbStore.params.state_filter_type =
    filtersStore.selectedStateFilterType;
  salesByClientsMinAkbStore.params.price_type_id_arr =
    filtersStore.selectedPriceTypes;
  salesByClientsMinAkbStore.params.agent_id_arr = filtersStore.selectedAgents;
  salesByClientsMinAkbStore.params.order_type =
    filtersStore.selectedOrderTypesSingle;
  salesByClientsMinAkbStore.params.consignation_filter_type =
    filtersStore.selectedConsignationFilterType;
  salesByClientsMinAkbStore.params.segment_id_arr =
    filtersStore.selectedSegments;
};

const onClearFilter = () => {
  salesByClientsMinAkbStore.setPage(1);
  filtersStore.selectedBranches = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedOrderStatuses = [];
  filtersStore.selectedPriceTypes = [];
  filtersStore.selectedProductCategorieis = [];
  filtersStore.selectedClientCategories = [];
  filtersStore.selectedDateFilterType = OrderListDateFilterType.ByOrderDate;
  filtersStore.selectedStateFilterType = StateFilterType.OnlyActive;
  selectedDays.value = [];
  filtersStore.selectedProducts = [];
  filtersStore.selectedSegments = [];
  filtersStore.priceRangeStatic[0] = filtersStore.priceStatic.min;
  filtersStore.priceRangeStatic[1] = filtersStore.priceStatic.max;
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DropdownComponent.value!.onClearFilter();
  DatePickerComponent.value?.onReset();
  RadioBtnComponent.value?.onReset();
  onApplyFilter();
};
const onChangeDateRange = (newRange: any) => {
  filtersStore.selectedDateRange = newRange;
};
<\/script>
`;export{e as default};
