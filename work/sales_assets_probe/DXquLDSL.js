const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title20 :title="t('reports.reports_results_of_visits')" />
      <div class="filter-btn-group">
        <DatePicker
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          ref="DatePickerComponent"
          @onApply="onChangeDateRange"
        />
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="reportResultsVisitsFilterStates"
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
import type { DatePicker, DropdownsByFilterStates } from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import { reportResultsVisitsFilterStates } from "~/variable/column-constants";
import { useReportResultsOfVisitsStore } from "~/stores/reports/visits/results-of-visits";
// Store

const reportResultsOfVisitsStore = useReportResultsOfVisitsStore("main");
const filtersStore = useFiltersStore("/reports/results-of-visits");

// child-components

const DatePickerComponent = ref<typeof DatePicker | null>(null);
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);

// State
const { t } = useI18n();
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(
    key,
    reportResultsVisitsFilterStates
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
]);

// hooks

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedOrderStatuses.length
  );
});
// Methods

const onApplyFilters = () => {
  reportResultsOfVisitsStore.params.branch_id_arr =
    filtersStore.selectedBranches;
  reportResultsOfVisitsStore.params.order_state_type_arr =
    filtersStore.selectedOrderStatuses;
  reportResultsOfVisitsStore.params.agent_id_arr = [
    ...filtersStore.selectedAgents,
  ];
  if (filtersStore.selectedDateRange) {
    reportResultsOfVisitsStore.params.date_only_range.from_value =
      getFormattedDate(filtersStore.selectedDateRange.fromDate, "YYYY-MM-DD");
    reportResultsOfVisitsStore.params.date_only_range.to_value =
      getFormattedDate(filtersStore.selectedDateRange.toDate, "YYYY-MM-DD");
  }
};

const onClearFilter = () => {
  reportResultsOfVisitsStore.params.page = 1;
  filtersStore.selectedBranches = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedOrderStatuses = [];
  DropdownComponent.value!.onClearFilter();
  DatePickerComponent.value?.onReset();
  onApplyFilters();
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

// hooks

onMounted(async () => {
  onApplyFilters();
});
<\/script>
`;export{e as default};
