const e=`<template>
  <div :class="cn('filter-content-container', props.class)">
    <div class="filter-content-header">
      <div class="filter-content-title">
        <page-title size="xl" :title="t('sidebar.finance')" />
      </div>
      <div class="filter-btn-group">
        <radio-btn
          ref="RadioBtnComponent"
          :label="t('labels.date_applies_to')"
          :items="filtersStore.orderDateFilterTypes.items"
          :selected-item="filtersStore.selectedOrderDateFilterTypes"
          @onSelectItemId="onSelectDateFilterType"
        />
        <date-picker
          ref="DatePickerComponent"
          :label="t('column.date')"
          default-preset="past-30-days"
          :initial-from-date="filtersStore.selectedDateRange?.fromDate"
          :initial-to-date="filtersStore.selectedDateRange?.toDate"
          @on-apply="onChangeDateRange"
        />
      </div>
    </div>
    <div v-if="filterStates.length" class="filter-content">
      <dropdowns-by-filter-states
        ref="DropdownComponent"
        :filter-states="filterStates"
        @on-open-dropdown="filtersStore.onOpenDropdown"
        @search="filtersStore.onSearchDropdown"
      />
      <flex-row class="submit-item">
        <m-btn :loading="isLoading" @click="onApplyFilter">
          {{ t("apply") }}
        </m-btn>
        <reset-filter-btn
          :is-filter-clearable="isFilterClearable"
          @on-clear-filter="onClearFilter"
        />
      </flex-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { AppRoutes } from "~/variable/routes";
import { cn } from "#imports";
import type { DatePicker, RadioBtn } from "#components";

type Props = {
  class?: string;
};

// Props
const props = defineProps<Props>();

// Composables
const { t } = useI18n();

// Stores
const filtersStore = useFiltersStore(AppRoutes.dashboard.child.finance);
const dashboardFinanceStore = useDashboardFinanceStore();

// Child components
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const RadioBtnComponent = ref<typeof RadioBtn | null>(null);

// States
const filterStates = ref([
  {
    name: t("settings_sidebar.branches"),
    key: "branches",
    get data() {
      return filtersStore.branches;
    },
    get getSelectedData() {
      return filtersStore.selectedBranches;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedBranches = value;
    },
  },
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
  },
  {
    name: t("settings_sidebar.territory"),
    key: "territories",
    isFilter: true,
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

// Hooks
onMounted(async () => {
  await filtersStore.getOrderDateFilterTypes();

  onApplyFilter();
});

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    RadioBtnComponent.value?.isClearable() ||
    filtersStore.selectedSupervisors.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedProductCategorieis.length ||
    filtersStore.selectedOrderStatuses.length ||
    filtersStore.selectedBranches.length ||
    dashboardFinanceStore.params.date_filter?.filter_type !== 1
  );
});

const isLoading = computed(() => {
  return (
    dashboardFinanceStore.clientsStore.isLoading ||
    dashboardFinanceStore.categorySalesStore.isLoading ||
    dashboardFinanceStore.debtByTerritoriesStore.isLoading
  );
});

// Methods
const onApplyFilter = () => {
  dashboardFinanceStore.params.date_filter = {
    range: {
      from: filtersStore.selectedDateRange?.fromDate || null,
      to: filtersStore.selectedDateRange?.toDate || null,
    },
    filter_type: filtersStore.selectedOrderDateFilterTypes,
  };
  dashboardFinanceStore.params.supervisor_ids =
    filtersStore.selectedSupervisors;
  dashboardFinanceStore.params.agent_ids = filtersStore.selectedAgents;
  dashboardFinanceStore.params.territory_ids = filtersStore.selectedTerritories;
  dashboardFinanceStore.params.client_category_ids =
    filtersStore.selectedClientCategories;
  dashboardFinanceStore.params.product_category_ids =
    filtersStore.selectedProductCategorieis;
  dashboardFinanceStore.params.order_statuses =
    filtersStore.selectedOrderStatuses;
  dashboardFinanceStore.params.branch_id_arr = filtersStore.selectedBranches;
};

const onSelectDateFilterType = (newValue: number) => {
  filtersStore.selectedOrderDateFilterTypes = newValue;
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onClearFilter = () => {
  filtersStore.selectedSupervisors = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedClientCategories = [];
  filtersStore.selectedProductCategorieis = [];
  filtersStore.selectedOrderStatuses = [];
  filtersStore.selectedBranches = [];
  filtersStore.selectedDateFilterType = 1;
  DatePickerComponent.value!.onReset();
  RadioBtnComponent.value!.onReset();
  onApplyFilter();
};
<\/script>
`;export{e as default};
