const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title20 :title="t('cash.receipts_report')" />
      <div class="filter-btn-group">
        <RadioBtn
          :label="t('labels.type_order')"
          :items="consignationFilterTypes"
          :selectedItem="filtersStore.selectedConsignationFilterType"
          @onSelectItemId="onSelectConsignationFilterType"
        />
        <DatePicker
          ref="DatePickerComponent"
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          default-preset="today"
          tomorrow-preset
          @onApply="onChangeDateRange"
        />
        <RefreshBtn
          :title="t('refresh_data')"
          :loading="incomeReportsStore.byAgentStore.isLoading"
          @click="incomeReportsStore.refresh"
        />
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="incomeReportFilterStates"
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
        :filter-storage-key="incomeReportFilterStates"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />

      <div class="submit-item">
        <m-btn
          :loading="incomeReportsStore.byAgentStore.isLoading"
          class="w-full"
          @click="onApplyFilters"
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
import type {
  DatePicker,
  DropdownsByFilterStates,
  TerritoryTreeDropdowns,
} from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import { useI18n } from "vue-i18n";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { incomeReportFilterStates } from "~/variable/column-constants";
import { ConsignationFilterType } from "~/variable/static-constants";

// Composables
const { t } = useI18n();

// Stores
const incomeReportsStore = useCashboxIncomeReportsStore("main");
const filtersStore = useFiltersStore("/dashboard/cashbox/income-report");

// States
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, incomeReportFilterStates);
};

const filterStates = ref<FilterStateModel[]>([
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
    name: t("clients.forwarder"),
    key: "expeditors",
    get data() {
      return filtersStore.expeditors || [];
    },
    get getSelectedData() {
      return filtersStore.selectedExpeditors;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedExpeditors = value;
    },
    checked: isChecked("expeditors"),
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
    name: t("settings_sidebar.trade_direction"),
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
    checked: isChecked("trade-directions"),
  },
  {
    name: t("cash.cash"),
    key: "cash",
    get data() {
      return filtersStore.cashboxes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedCashboxes;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedCashboxes = value;
    },
    checked: isChecked("cash"),
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
]);

// Hooks
onMounted(async () => {
  await filtersStore.getConsignationFilterTypes();
  onApplyFilters();
  await incomeReportsStore.loadSharedCurrencies()
});

const consignationFilterTypes = computed(() => {
  return filtersStore.consignationFilterTypes || undefined;
});

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedCashboxes.length ||
    filtersStore.selectedExpeditors.length ||
    filtersStore.selectedCurrencies.length ||
    filtersStore.selectedTradeDirections.length ||
    filtersStore.selectedConsignationFilterType !== ConsignationFilterType.All
  );
});

// Methods
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[],
) => {
  filterStates.value.push(...territoryFilterStates);
};

const onSelectConsignationFilterType = (newValue: number) => {
  filtersStore.selectedConsignationFilterType = newValue;
};

const onApplyFilters = () => {
  incomeReportsStore.filterParams.branch_id_arr = filtersStore.selectedBranches;
  incomeReportsStore.filterParams.expeditor_id_arr =
    filtersStore.selectedExpeditors;
  incomeReportsStore.filterParams.territory_id_arr =
    filtersStore.selectedTerritories;
  incomeReportsStore.filterParams.agent_id_arr = [
    ...filtersStore.selectedAgents,
  ];
  incomeReportsStore.filterParams.cash_box_id_arr =
    filtersStore.selectedCashboxes;
  incomeReportsStore.filterParams.trade_direction_id_arr =
    filtersStore.selectedTradeDirections;
  incomeReportsStore.filterParams.payment_method_id_arr =
    filtersStore.selectedCurrencies;
  incomeReportsStore.filterParams.consignation_filter_type =
    filtersStore.selectedConsignationFilterType;
  incomeReportsStore.filterParams.client_category_id_arr =
    filtersStore.selectedClientCategories;
  if (filtersStore.selectedDateRange) {
    incomeReportsStore.filterParams.date_range.from =
      filtersStore.selectedDateRange?.fromDate ?? undefined;
    incomeReportsStore.filterParams.date_range.to =
      filtersStore.selectedDateRange?.toDate ?? undefined;
  }
};

const onClearFilter = () => {
  filtersStore.selectedBranches = [];
  filtersStore.selectedExpeditors = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedCashboxes = [];
  filtersStore.selectedCurrencies = [];
  filtersStore.selectedTradeDirections = [];
  filtersStore.selectedClientCategories = [];
  filtersStore.selectedConsignationFilterType = ConsignationFilterType.All;
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DropdownComponent.value!.onClearFilter();
  DatePickerComponent.value?.onReset();
  onApplyFilters();
};
const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};
<\/script>
`;export{e as default};
