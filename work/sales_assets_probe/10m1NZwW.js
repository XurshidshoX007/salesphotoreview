const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title20 :title="t('sidebar.by_visit_2')" />
      <div class="filter-btn-group">
        <DatePicker
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          ref="DatePickerComponent"
          @onApply="onChangeDateRange"
        />
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="reportVisitsByClientFilterStates"
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
        :filter-storage-key="reportVisitsByClientFilterStates"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />

      <div class="submit-item">
        <m-btn
          class="w-full"
          @click="onApplyFilters"
          :loading="reportVisitByClientStore.isLoading"
        >
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
import { useReportVisitsByClientStore } from "~/stores/reports/visits/visits-by-client.store";
import { reportVisitsByClientFilterStates } from "~/variable/column-constants";
// Store

const reportVisitByClientStore = useReportVisitsByClientStore("main");
const filtersStore = useFiltersStore("/reports/visits-by-client/by-client");

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
  return filtersStore.isCheckedFilterState(
    key,
    reportVisitsByClientFilterStates,
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
    name: t("column.day"),
    key: "day",
    data: filtersStore.days,
    get getSelectedData() {
      return filtersStore.selectedDays;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedDays = value;
    },
    checked: isChecked("day"),
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
]);

// hooks

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedProductCategorieis.length ||
    filtersStore.selectedDays.length
  );
});
// Methods
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[],
) => {
  filterStates.value.push(...territoryFilterStates);
};

const onApplyFilters = () => {
  reportVisitByClientStore.params.branch_id_arr =
    filtersStore.selectedBranches;
  reportVisitByClientStore.params.territory_id_arr =
    filtersStore.selectedTerritories;
  reportVisitByClientStore.params.product_category_id_arr =
    filtersStore.selectedProductCategorieis;
  reportVisitByClientStore.params.week_day_arr = filtersStore.selectedDays;
  reportVisitByClientStore.params.agent_id_arr = [
    ...filtersStore.selectedAgents,
  ];
  reportVisitByClientStore.params.client_category_id_arr =
    filtersStore.selectedClientCategories;
  if (filtersStore.selectedDateRange) {
    reportVisitByClientStore.params.date_only_range.from_value =
      getFormattedDate(filtersStore.selectedDateRange.fromDate, "YYYY-MM-DD");
    reportVisitByClientStore.params.date_only_range.to_value = getFormattedDate(
      filtersStore.selectedDateRange.toDate,
      "YYYY-MM-DD",
    );
  }
};

const onClearFilter = () => {
  reportVisitByClientStore.params.page = 1;
  filtersStore.selectedBranches = [];
  filtersStore.selectedProductCategorieis = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedDays = [];
  filtersStore.selectedClientCategories = [];
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DropdownComponent.value!.onClearFilter();
  DatePickerComponent.value?.onReset();
  onApplyFilters();
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

// hooks

onMounted(() => {
  onApplyFilters();
});
<\/script>
`;export{e as default};
