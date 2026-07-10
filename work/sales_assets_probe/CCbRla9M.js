const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title20 :title="t('sidebar.by_visit')" />
      <div class="filter-btn-group">
        <DatePicker
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          ref="DatePickerComponent"
          @onApply="onChangeDateRange"
        />
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="reportVisitsByAgentFilter"
          @update="filtersStore.updateFilterStates($event, filterStates)"
        />
      </div>
    </div>
    <div class="filter-content">
      <dropdowns-by-filter-states
        ref="DropdownComponent"
        :filterStates="filtersStore.checkedFilterStates(filterStates)"
        @onOpenDropdown="filtersStore.onOpenDropdown"
        @search="filtersStore.onSearchDropdown"
      />
      <TerritoryTreeDropdowns
        ref="TerritoryTreeDropdownsComponent"
        :filter-storage-key="reportVisitsByAgentFilter"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />

      <div class="submit-item">
        <m-btn class="w-full" @click="onApplyFilters">
          {{ t("apply") }}
        </m-btn>
        <ResetFilterBtn
          @onClearFilter="onClearFilter"
          :is-filter-clearable="isFilterClearable"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type {
  DatePicker,
  DropdownsByFilterStates,
  TerritoryTreeDropdowns,
} from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { reportVisitsByAgentFilter } from "~/variable/column-constants";
import { useReportVisitsByAgentStore } from "~/stores/reports/visits/visits-by-agent.store";
import { StateFilterType } from "~/variable/static-constants";
// Store

const reportVisitByAgentStore = useReportVisitsByAgentStore("main");
const filtersStore = useFiltersStore("/reports/visits-by-agent/by-agent");

// child-components

const DatePickerComponent = ref<typeof DatePicker | null>(null);
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// State
const { t } = useI18n();
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, reportVisitsByAgentFilter);
};

const filterStates = ref([
  {
    name: t("sidebar.supervisor"),
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
    name: t("active"),
    key: "filter-type",
    get data() {
      return filtersStore.stateFilterType;
    },
    get getSelectedData() {
      return filtersStore.selectedStateFilterType;
    },
    set setSelectedData(value: number) {
      filtersStore.selectedStateFilterType = value;
    },
    isSingleSelect: true,
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
]);

// hooks

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedProductCategorieis.length ||
    filtersStore.selectedOrderStatuses.length ||
    filtersStore.selectedCurrencies.length ||
    filtersStore.selectedProducts.length ||
    filtersStore.selectedStateFilterType !== StateFilterType.OnlyActive ||
    filtersStore.selectedSupervisors.length
  );
});
// Methods
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[]
) => {
  filterStates.value.push(...territoryFilterStates);
};

const onApplyFilters = () => {
  reportVisitByAgentStore.params.territory_id_arr =
    filtersStore.selectedTerritories;
  reportVisitByAgentStore.params.product_category_id_arr =
    filtersStore.selectedProductCategorieis;
  reportVisitByAgentStore.params.product_id_arr = filtersStore.selectedProducts;
  reportVisitByAgentStore.params.svr_id_arr = filtersStore.selectedSupervisors;
  reportVisitByAgentStore.params.order_state_type_arr =
    filtersStore.selectedOrderStatuses;
  reportVisitByAgentStore.params.currency_id_arr =
    filtersStore.selectedCurrencies;
  reportVisitByAgentStore.params.state_filter_type =
    filtersStore.selectedStateFilterType;
  reportVisitByAgentStore.params.agent_id_arr = [
    ...filtersStore.selectedAgents,
  ];
  reportVisitByAgentStore.params.client_category_id_arr =
    filtersStore.selectedClientCategories;
  if (filtersStore.selectedDateRange) {
    reportVisitByAgentStore.params.date_only_range.from_value =
      getFormattedDate(filtersStore.selectedDateRange.fromDate, "YYYY-MM-DD");
    reportVisitByAgentStore.params.date_only_range.to_value = getFormattedDate(
      filtersStore.selectedDateRange.toDate,
      "YYYY-MM-DD"
    );
  }
};

const onClearFilter = () => {
  reportVisitByAgentStore.params.page = 1;
  filtersStore.selectedProductCategorieis = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedCurrencies = [];
  filtersStore.selectedClientCategories = [];
  filtersStore.selectedSupervisors = [];
  filtersStore.selectedProducts = [];
  filtersStore.selectedOrderStatuses = [];
  filtersStore.selectedStateFilterType = StateFilterType.OnlyActive;
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DropdownComponent.value!.onClearFilter();
  DatePickerComponent.value?.onReset();
  onApplyFilters();
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

// hooks

onMounted(async () => {
  await filtersStore.getFilterTypes();
  onApplyFilters();
});
<\/script>
`;export{e as default};
