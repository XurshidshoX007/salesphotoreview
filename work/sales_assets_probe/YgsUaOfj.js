const e=`<template>
  <div class="filter-content-container !p-3">
    <div class="filter-content-header">
      <page-title-20 :title="t('sidebar.report_by_gps')" />
      <div class="filter-btn-group">
        <DatePicker
          ref="DatePickerComponent"
          default-preset="this-month"
          :initial-from-date="filtersStore.selectedDateRange?.fromDate"
          :initial-to-date="filtersStore.selectedDateRange?.toDate"
          @onApply="onChangeDateRange"
        />
      </div>
    </div>
    <div class="filter-content">
      <DropdownsByFilterStates
        ref="DropdownComponent"
        :filter-states="filterStates"
        @onOpenDropdown="onOpenDropdown"
        @search="filtersStore.onSearchDropdown"
      />
      <flex-row class="submit-item">
        <m-btn
          @click="onApplyFilter"
          :loading="reportByGpsStore.isFilterLoading"
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
import type { DatePicker, DropdownsByFilterStates } from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { useI18n } from "vue-i18n";

// Composables
const { t } = useI18n();

// Stores
const reportByGpsStore = useReportByGpsStore();
const filtersStore = useFiltersStore("/reports/report-by-gps");

// States
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);

const filterStates = ref<FilterStateModel[]>([
  {
    name: t("settings_sidebar.branches"),
    key: "branches",
    get data() {
      return filtersStore.branches ?? undefined;
    },
    get getSelectedData() {
      return filtersStore.selectedBranches;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedBranches = value;
    },
  },
  {
    name: t("gps.expeditor"),
    key: "expeditors",
    get data() {
      return filtersStore.expeditors ?? undefined;
    },
    get getSelectedData() {
      return filtersStore.selectedExpeditors;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedExpeditors = value;
    },
  },
]);

// Hooks
onMounted(() => {
  onApplyFilter();
});

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedExpeditors.length ||
    filtersStore.selectedBranches.length
  );
});

// Methods
const onOpenDropdown = (state: string) => {
  filtersStore.onOpenDropdown(state);
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onApplyFilter = () => {
  const params = reportByGpsStore.params as typeof reportByGpsStore.params & {
    expeditor_ids: string[];
    branch_ids: string[];
    date_range: { from: string; to: string };
  };
  params.expeditor_ids = filtersStore.selectedExpeditors;
  params.branch_ids = filtersStore.selectedBranches;
  params.date_range = {
    from: filtersStore.selectedDateRange?.fromDate || "",
    to: filtersStore.selectedDateRange?.toDate || "",
  };
};

const onClearFilter = () => {
  filtersStore.selectedExpeditors = [];
  filtersStore.selectedBranches = [];
  DropdownComponent.value?.onClearFilter();
  DatePickerComponent.value?.onReset();
  onApplyFilter();
};
<\/script>
`;export{e as default};
