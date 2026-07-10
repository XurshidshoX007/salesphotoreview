const e=`<template>
  <div :class="cn('filter-content-container', props.class)">
    <div class="filter-content-header">
      <div class="filter-content-title">
        <page-title size="xl" :title="t('dashboard.dashboard_sales')" />
      </div>
      <div class="filter-btn-group">
        <radio-btn
          ref="RadioBtnComponent"
          :label="t('labels.date_applies_to')"
          :items="dateFilterItems"
          :selected-item="filtersStore.selectedOrderDateFilterTypes"
          @on-select-item-id="onSelectDateFilterType"
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
import { cn } from "#imports";
import type { DatePicker, RadioBtn } from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import { AppRoutes } from "~/variable/routes";
type Props = { class?: string };
const props = defineProps<Props>();

// Composables
const { t } = useI18n();

// Stores
const filtersStore = useFiltersStore(AppRoutes.dashboard.child.sales);
const dashboardStore = useSalesDashboardStore();

const dateFilterItems = computed(() => {
  const items = (filtersStore.orderDateFilterTypes?.items || []) as {
    id: number;
    name: string;
  }[];
  return items
    .filter((i) => i.id === 1 || i.id === 2)
    .map((i) => ({
      id: i.id,
      name: i.id === 1 ? t("labels.request_date") : t("column.shipped_date"),
    }));
});

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
    name: t("filters.trade_directions"),
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
    name: t("settings.manufacturer"),
    key: "manufacturers",
    get data() {
      return (
        (filtersStore as unknown as { manufacturers?: { items: unknown[] } })
          .manufacturers || { items: [] }
      );
    },
    get getSelectedData() {
      return (
        (filtersStore as unknown as { selectedManufacturers?: string[] })
          .selectedManufacturers ?? []
      );
    },
    set setSelectedData(value: string[]) {
      (
        filtersStore as unknown as { selectedManufacturers: string[] }
      ).selectedManufacturers = value;
    },
  },
  {
    name: t("filters.brands"),
    key: "brands",
    get data() {
      return filtersStore.brands || { items: [] };
    },
    get getSelectedData() {
      return filtersStore.selectedBrands;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedBrands = value;
    },
  },
  {
    name: t("labels.categories"),
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
    name: t("filters.product_groups"),
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
  },
  {
    name: t("filters.payment_type"),
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
  },
  {
    name: t("clients.territories"),
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
  },
]);

// Hooks
onMounted(async () => {
  await filtersStore.getOrderDateFilterTypes();
  onApplyFilter();
});

const isFilterClearable = computed(() => {
  return !(
    (
      DatePickerComponent.value as { isClearable?: () => boolean } | null
    )?.isClearable?.() ||
    (
      RadioBtnComponent.value as { isClearable?: () => boolean } | null
    )?.isClearable?.() ||
    (filtersStore.selectedOrderStatuses?.length ?? 0) > 0 ||
    (filtersStore.selectedProductCategorieis?.length ?? 0) > 0 ||
    ((filtersStore as unknown as { selectedManufacturers?: string[] })
      .selectedManufacturers?.length ?? 0) > 0 ||
    (filtersStore.selectedSupervisors?.length ?? 0) > 0 ||
    (filtersStore.selectedBranches?.length ?? 0) > 0 ||
    (filtersStore.selectedProductGroup?.length ?? 0) > 0 ||
    (filtersStore.selectedBrands?.length ?? 0) > 0 ||
    (filtersStore.selectedTradeDirections?.length ?? 0) > 0 ||
    (filtersStore.selectedTerritories?.length ?? 0) > 0 ||
    (filtersStore.selectedCurrencies?.length ?? 0) > 0 ||
    filtersStore.selectedOrderDateFilterTypes !== 1
  );
});

const isLoading = computed(() => {
  return (
    dashboardStore.clientbaseLoading ||
    dashboardStore.chartSummaryLoading ||
    dashboardStore.productGroupLoading ||
    dashboardStore.clientCategoryLoading ||
    dashboardStore.productCategoryLoading
  );
});

// Methods
const onApplyFilter = () => {
  dashboardStore.params.date_filter = {
    range: {
      from: filtersStore.selectedDateRange?.fromDate || null,
      to: filtersStore.selectedDateRange?.toDate || null,
    },
    filter_type: filtersStore.selectedOrderDateFilterTypes ?? 1,
  };
  dashboardStore.params.order_status_arr =
    filtersStore.selectedOrderStatuses.length > 0
      ? filtersStore.selectedOrderStatuses
      : [];
  dashboardStore.params.product_category_id_arr =
    filtersStore.selectedProductCategorieis || [];
  dashboardStore.params.product_group_id_arr =
    filtersStore.selectedProductGroup || [];
  dashboardStore.params.trade_direction_id_arr =
    filtersStore.selectedTradeDirections || [];
  dashboardStore.params.brand_id_arr = filtersStore.selectedBrands || [];
  dashboardStore.params.territory_id_arr =
    filtersStore.selectedTerritories || [];
  dashboardStore.params.currency_id_arr = filtersStore.selectedCurrencies || [];
  dashboardStore.params.manufacturer_id_arr =
    (filtersStore as unknown as { selectedManufacturers?: string[] })
      .selectedManufacturers || [];
  dashboardStore.params.supervisor_id_arr =
    filtersStore.selectedSupervisors || [];
  dashboardStore.params.branch_id_arr = filtersStore.selectedBranches;
};

const onSelectDateFilterType = (newValue: number) => {
  filtersStore.selectedOrderDateFilterTypes = newValue;
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onClearFilter = () => {
  filtersStore.selectedOrderStatuses = [];
  filtersStore.selectedProductCategorieis = [];
  (
    filtersStore as unknown as { selectedManufacturers: string[] }
  ).selectedManufacturers = [];
  filtersStore.selectedSupervisors = [];
  filtersStore.selectedBranches = [];
  filtersStore.selectedProductGroup = [];
  filtersStore.selectedBrands = [];
  filtersStore.selectedTradeDirections = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedCurrencies = [];
  filtersStore.selectedOrderDateFilterTypes = 1;
  (DatePickerComponent.value as { onReset?: () => void } | null)?.onReset?.();
  (RadioBtnComponent.value as { onReset?: () => void } | null)?.onReset?.();

  onApplyFilter();
};
<\/script>
`;export{e as default};
