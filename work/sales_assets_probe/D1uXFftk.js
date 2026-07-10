const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title-20 :title="t('sidebar.return_forwarder')" />
      <div class="filter-btn-group">
        <RadioBtn
          ref="RadioBtnComponent1"
          :label="t('labels.type_order')"
          :items="returnFilterTypes"
          :selectedItem="filtersStore.selectedReturnFilterType"
          @onSelectItemId="onSelectReturnFilterType"
        />
        <RadioBtn
          :label="t('labels.date_applies_to')"
          ref="RadioBtnComponent2"
          :items="dateFilterTypes"
          :selectedItem="filtersStore.selectedDateFilterType"
          @onSelectItemId="onSelectDateFilterType"
        />
        <DatePicker
          ref="DatePickerComponent"
          default-preset="this-month"
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          @onApply="onChangeDateRange"
        />
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="reportsExpeditorReportFilterStates"
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
        :filter-storage-key="reportsExpeditorReportFilterStates"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
      <flex-row class="submit-item">
        <m-btn
          @click="onApplyFilter"
          :loading="returnExpeditorsStore.isFilterLoading"
          >{{ t("apply") }}
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
import type {
  DatePicker,
  DropdownsByFilterStates,
  TerritoryTreeDropdowns,
  RadioBtn,
} from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { useI18n } from "vue-i18n";
import { reportsExpeditorReportFilterStates } from "~/variable/column-constants";

// Store
const { t } = useI18n();
const returnExpeditorsStore = useReportsReturnExpeditorsStore("main");
const filtersStore = useFiltersStore("reports/expeditor-report");

// child-components
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const RadioBtnComponent1 = ref<typeof RadioBtn | null>(null); // states
const RadioBtnComponent2 = ref<typeof RadioBtn | null>(null); // states
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// states
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(
    key,
    reportsExpeditorReportFilterStates
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
    name: t("column.type"),
    key: "order-type",
    get data() {
      return filtersStore.orderTypes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedOrderTypes;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedOrderTypes = value;
    },
    checked: isChecked("order-type"),
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
    name: t("settings_sidebar.payment_method"),
    key: "currencies",
    isFilter: true,
    get data() {
      return filtersStore.currency || [];
    },
    get getSelectedData() {
      return filtersStore.selectedPriceTypes;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedPriceTypes = value;
    },
    checked: isChecked("currencies"),
  },
  {
    name: t("column.consignation"),
    key: "consignation",
    isSingleSelect: true,
    get data() {
      return {
        items: returnExpeditorsStore.consignationFilterTypes || undefined,
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
const dateFilterTypes = computed(() => {
  return returnExpeditorsStore.dateFilterTypes || undefined;
});

const returnFilterTypes = computed(() => {
  return returnExpeditorsStore.returnFilterTypes || undefined;
});

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    RadioBtnComponent1.value?.isClearable() ||
    RadioBtnComponent2.value?.isClearable() ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedExpeditors.length ||
    filtersStore.selectedProductCategorieis.length ||
    filtersStore.selectedPriceTypes.length ||
    filtersStore.selectedOrderStatuses.length ||
    filtersStore.selectedOrderTypes.length ||
    filtersStore.selectedTerritories.length
  );
});

onMounted(async () => {
  onApplyFilter();
});

// methods
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[]
) => {
  filterStates.value.push(...territoryFilterStates);
};

const onSelectDateFilterType = (newValue: number) => {
  filtersStore.selectedDateFilterType = newValue;
};

const onSelectReturnFilterType = (newValue: number) => {
  filtersStore.selectedReturnFilterType = newValue;
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onApplyFilter = () => {
  returnExpeditorsStore.commonParams.branch_id_arr =
    filtersStore.selectedBranches;
  returnExpeditorsStore.commonParams.agent_id_arr = filtersStore.selectedAgents;
  returnExpeditorsStore.commonParams.expeditor_id_arr =
    filtersStore.selectedExpeditors;
  returnExpeditorsStore.commonParams.product_category_id_arr =
    filtersStore.selectedProductCategorieis;
  returnExpeditorsStore.commonParams.price_type_id_arr =
    filtersStore.selectedPriceTypes;
  returnExpeditorsStore.commonParams.order_status_arr =
    filtersStore.selectedOrderStatuses;
  returnExpeditorsStore.commonParams.order_type_arr =
    filtersStore.selectedOrderTypes;
  returnExpeditorsStore.commonParams.territory_id_arr =
    filtersStore.selectedTerritories;
  returnExpeditorsStore.commonParams.date_filter_type =
    filtersStore.selectedDateFilterType;
  returnExpeditorsStore.commonParams.order_return_filter_type =
    filtersStore.selectedReturnFilterType;
  returnExpeditorsStore.commonParams.date_range.from =
    filtersStore.selectedDateRange?.fromDate || "";
  returnExpeditorsStore.commonParams.date_range.to =
    filtersStore.selectedDateRange?.toDate || "";
  returnExpeditorsStore.setPage(1);
  returnExpeditorsStore.commonParams.consignation_filter_type =
    filtersStore.selectedConsignationFilterType;
};

const onClearFilter = () => {
  returnExpeditorsStore.setPage(1);
  filtersStore.selectedBranches = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedExpeditors = [];
  filtersStore.selectedProductCategorieis = [];
  filtersStore.selectedPriceTypes = [];
  filtersStore.selectedOrderStatuses = [];
  filtersStore.selectedOrderTypes = [];
  filtersStore.selectedTerritories = [];
  DropdownComponent.value!.onClearFilter();
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DatePickerComponent.value?.onReset();
  RadioBtnComponent1.value?.onReset();
  RadioBtnComponent2.value?.onReset();
  onApplyFilter();
};
<\/script>
`;export{e as default};
