const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <div class="filter-content-title">
        <page-title :title="t('audit.report_audit.report_audit')" />
      </div>
      <div class="filter-btn-group">
        <DatePicker
          ref="DatePickerComponent"
          :label="t('column.date')"
          default-preset="this-month"
          @on-apply="onChangeDateRange"
        />
      </div>
    </div>
    <div class="filter-content">
      <DropdownsByFilterStates
        ref="DropdownComponent"
        :filter-states="filterStates"
        @on-open-dropdown="filtersStore.onOpenDropdown"
      />
      <TerritoryTreeDropdowns
        ref="TerritoryTreeDropdownsComponent"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
      <!-- <flex-row
        v-for="item in checkboxItems"
        :key="item.id"
        class="items-center"
      >
        <Checkbox
          :id="item.id"
          :checked="item.checked"
          :title="item.label"
          @change="item.action"
        />
      </flex-row> -->
      <flex-row class="submit-item">
        <m-btn
          :loading="
            auditReportStore.isLoading && auditReportStore.isFilterLoading
          "
          @click="onApplyFilter"
          >{{ t("apply") }}
        </m-btn>
        <ResetFilterBtn
          :is-filter-clearable="isFilterClearable"
          @on-clear-filter="onClearFilter"
        />
      </flex-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { DropdownsByFilterStates, DatePicker } from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { ConfirmationFilterType } from "~/variable/static-constants";

// stores
const auditReportStore = useAuditReportStore("main");
const filtersStore = useFiltersStore("/audit/audit-report");

// child-components
const DropdownComponent = ref<InstanceType<typeof DropdownsByFilterStates>>();
const DatePickerComponent = ref<InstanceType<typeof DatePicker>>();

// states
const { t } = useI18n();
const selectedConfirmedBySupervisor = ref<ConfirmationFilterType | null>(
  ConfirmationFilterType.All,
);
const selectedConfirmedByManager = ref<ConfirmationFilterType | null>(
  ConfirmationFilterType.All,
);

/** Shared Yes / No / All options for the single-select confirmation filters */
const yesNoAllItems = ref([
  { id: ConfirmationFilterType.All, name: t("filters.all") },
  { id: ConfirmationFilterType.Yes, name: t("filters.yes") },
  { id: ConfirmationFilterType.No, name: t("filters.no") },
]);

const filterStates = ref<FilterStateModel[]>([
  {
    name: t("clients.auditor"),
    key: "auditors",
    isFilter: true,
    get data() {
      return filtersStore.auditors || [];
    },
    get getSelectedData() {
      return filtersStore.selectedAuditors;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedAuditors = value;
    },
  },
  {
    name: t("column.surveys"),
    key: "surveys",
    isFilter: true,
    get data() {
      return filtersStore.surveys || [];
    },
    get getSelectedData() {
      return filtersStore.selectedSurveys;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedSurveys = value;
    },
  },
  {
    name: t("audit.audit"),
    key: "review-configs",
    isFilter: true,
    get data() {
      return filtersStore.reviewConfigs || [];
    },
    get getSelectedData() {
      return filtersStore.selectedReviewConfigs;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedReviewConfigs = value;
    },
  },
  {
    name: t("audit.problems"),
    key: "problem-reasons",
    isFilter: true,
    get data() {
      return filtersStore.problemReasons || [];
    },
    get getSelectedData() {
      return filtersStore.selectedProblemReasons;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedProblemReasons = value;
    },
  },
  {
    name: t("audit.report_audit.confirmed_by_supervisor"),
    key: "confirmed-by-supervisor",
    isSingleSelect: true,
    get data() {
      return { items: yesNoAllItems.value };
    },
    get getSelectedData() {
      return selectedConfirmedBySupervisor.value;
    },
    set setSelectedData(value: ConfirmationFilterType) {
      selectedConfirmedBySupervisor.value = value;
    },
  },
  {
    name: t("audit.report_audit.confirmed_by_manager"),
    key: "confirmed-by-manager",
    isSingleSelect: true,
    get data() {
      return { items: yesNoAllItems.value };
    },
    get getSelectedData() {
      return selectedConfirmedByManager.value;
    },
    set setSelectedData(value: ConfirmationFilterType) {
      selectedConfirmedByManager.value = value;
    },
  },
  {
    name: t("column.issue_priority"),
    key: "libConst_VisitIssuePriority",
    get data() {
      return filtersStore.visitIssuePriorities || [];
    },
    get getSelectedData() {
      return filtersStore.selectedVisitIssuePriorities;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedVisitIssuePriorities = value;
    },
  },
]);

// hooks
const isFilterClearable = computed(() => {
  return !(
    filtersStore.selectedSurveys?.length ||
    filtersStore.selectedReviewConfigs?.length ||
    filtersStore.selectedAuditors?.length ||
    filtersStore.selectedProblemReasons?.length ||
    filtersStore.selectedVisitIssuePriorities?.length ||
    selectedConfirmedBySupervisor.value !== ConfirmationFilterType.All ||
    selectedConfirmedByManager.value !== ConfirmationFilterType.All ||
    DatePickerComponent.value?.isClearable()
  );
});

onMounted(() => onApplyFilter());

// methods
const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[],
) => {
  filterStates.value.push(...territoryFilterStates);
};

const onApplyFilter = () => {
  auditReportStore.params.date_range!.from =
    filtersStore.selectedDateRange!.fromDate;
  auditReportStore.params.date_range!.to =
    filtersStore.selectedDateRange!.toDate;
  auditReportStore.params.product_review_config_id_arr =
    filtersStore.selectedReviewConfigs;
  auditReportStore.params.question_form_id_arr = filtersStore.selectedSurveys;
  auditReportStore.params.issue_id_arr = filtersStore.selectedProblemReasons;
  auditReportStore.params.confirmed_by_supervisor =
    selectedConfirmedBySupervisor.value ?? ConfirmationFilterType.All;
  auditReportStore.params.confirmed_by_manager =
    selectedConfirmedByManager.value ?? ConfirmationFilterType.All;
  onAddFieldToFilter(
    auditReportStore.params,
    "auditor_id",
    filtersStore.selectedAuditors,
  );
  onAddFieldToFilter(
    auditReportStore.params,
    "issue_priority",
    filtersStore.selectedVisitIssuePriorities.map((id) => id.toString()),
  );
  onAddFieldToFilter(
    auditReportStore.params,
    "client_territory_id",
    filtersStore.selectedTerritories,
  );
};

const onClearFilter = () => {
  auditReportStore.setPage(1);
  DropdownComponent.value!.onClearFilter();
  DatePickerComponent.value!.onReset();
  filtersStore.selectedReviewConfigs = [];
  filtersStore.selectedSurveys = [];
  filtersStore.selectedAuditors = [];
  filtersStore.selectedProblemReasons = [];
  filtersStore.selectedVisitIssuePriorities = [];
  selectedConfirmedBySupervisor.value = ConfirmationFilterType.All;
  selectedConfirmedByManager.value = ConfirmationFilterType.All;
  onApplyFilter();
};
<\/script>
`;export{e as default};
