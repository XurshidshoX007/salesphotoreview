const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="filter-content-header">
        <div class="filter-content-title">
          <page-title
            size="xl"
            :title="t('dashboard.plan_fact.monitoring_of_sales_and_plans')"
          />
        </div>
        <div class="filter-btn-group">
          <div class="w-69">
            <DropdownsByFilterStates :filter-states="sectionFilterStates" />
          </div>
          <MonthPicker
            ref="MonthPickerComponent"
            @change-month="onSelectMonth"
          />
        </div>
      </div>
      <div class="flex justify-between gap-4">
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filter-states="filterStates"
          @on-open-dropdown="filtersStore.onOpenDropdown"
          @search="filtersStore.onSearchDropdown"
        />
        <div class="flex-2 flex justify-end gap-2 !flex-row-reverse">
          <m-btn @click="onApplyFilter">
            {{ t("apply") }}
          </m-btn>
          <ResetFilterBtn
            :is-filter-clearable="isFilterClearable"
            @on-clear-filter="onClearFilter"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  RadioBtn,
  DropdownsByFilterStates,
  MonthPicker,
} from "#components";
import { useI18n } from "vue-i18n";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { PlanFactSection } from "~/variable/static-constants";

// stores
const filtersStore = useFiltersStore("dashboard/plan-fact/filter");

// emits
const emit = defineEmits(["onSetFilters", "onSectionVisibilityChange"]);

// child components
const DropdownComponent = ref<InstanceType<
  typeof DropdownsByFilterStates
> | null>(null);
const MonthPickerComponent = ref<InstanceType<typeof MonthPicker> | null>(null);
const RadioBtnComponent = ref<InstanceType<typeof RadioBtn> | null>(null);

// states
const { t } = useI18n();

const selectedMonthYear = ref({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
});

const sectionItems = ref([
  {
    id: PlanFactSection.ByBranches,
    name: t("dashboard.plan_fact.by_branches"),
  },
  {
    id: PlanFactSection.BySupervisors,
    name: t("dashboard.plan_fact.sales_by_supervisors"),
  },
  {
    id: PlanFactSection.ByTerritories,
    name: t("dashboard.plan_fact.by_territories"),
  },
  {
    id: PlanFactSection.ByTradeDirections,
    name: t("dashboard.plan_fact.by_trade_directions"),
  },
  {
    id: PlanFactSection.ACBByBranchTradeDirection,
    name: t("dashboard.plan_fact.acb_by_branch_trade_direction"),
  },
  {
    id: PlanFactSection.ByProducts,
    name: t("dashboard.plan_fact.sales_by_sku"),
  },
  {
    id: PlanFactSection.DailyClientSales,
    name: t("dashboard.plan_fact.daily_client_sales"),
  },
  {
    id: PlanFactSection.ACBByBranchTradeDirection,
    name: t("dashboard.plan_fact.acb_by_branch_trade_direction"),
  },
  { id: PlanFactSection.BySales, name: t("dashboard.plan_fact.by_sales") },
  { id: PlanFactSection.OkbAkb, name: t("dashboard.plan_fact.okb/akb") },
  {
    id: PlanFactSection.FactByCategories,
    name: t("dashboard.plan_fact.sales_fact_by_categories"),
  },
  {
    id: PlanFactSection.YearlyGrowth,
    name: t("dashboard.plan_fact.compare_by_years"),
  },
]);

const selectedSectionIds = ref<PlanFactSection[]>(
  sectionItems.value.map((item) => item.id),
);

const sectionFilterStates = ref([
  {
    name: "Настройки разделов",
    key: "sections",
    icon: "settings",
    data: { items: sectionItems.value },
    get getSelectedData() {
      return selectedSectionIds.value;
    },
    set setSelectedData(value: PlanFactSection[]) {
      selectedSectionIds.value = value;
    },
  },
]);

const filterStates = ref<Array<FilterStateModel>>([
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
  },
  {
    name: t("settings_sidebar.territory"),
    key: "territories",
    get data() {
      return filtersStore.territories || [];
    },
    get getSelectedData() {
      return filtersStore.selectedTerritories;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedTerritories = value;
    },
    isTreeView: true,
  },
]);

// hooks
onMounted(async () => {
  await filtersStore.getDateFilterTypes();
  onApplyFilter();
});

watch(
  selectedSectionIds,
  (newIds) => {
    emit("onSectionVisibilityChange", newIds);
  },
  { immediate: true },
);

const isFilterClearable = computed(() => {
  return !(
    MonthPickerComponent.value?.isClearable ||
    RadioBtnComponent.value?.isClearable() ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedSupervisors.length ||
    filtersStore.selectedAgents.length
  );
});
// methods

const onSelectMonth = (monthYear: { year: number; month: number }) => {
  selectedMonthYear.value = monthYear;
};

const onApplyFilter = () => {
  const filterParams = {
    branch_ids: filtersStore.selectedBranches,
    territory_ids: filtersStore.selectedTerritories,
    agent_ids: filtersStore.selectedAgents,
    supervisor_ids: filtersStore.selectedSupervisors,
    branch_id_arr: filtersStore.selectedBranches,
    year_month: {
      year: selectedMonthYear.value.year,
      month: selectedMonthYear.value.month,
    },
  };
  emit("onSetFilters", filterParams);
};

const onClearFilter = () => {
  filtersStore.selectedBranches = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedSupervisors = [];
  filtersStore.selectedAgents = [];
  DropdownComponent.value!.onClearFilter();
  MonthPickerComponent.value?.setToDefault();
  onApplyFilter();
};
<\/script>
`;export{e as default};
