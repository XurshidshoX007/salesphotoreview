const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="filter-content-header">
        <page-title size="xl" :title="t('dashboard.dashboard_sales')" />
        <div class="filter-btn-group">
          <RadioBtn
            ref="RadioBtnComponent"
            :items="dateFilterTypes"
            :selectedItem="filtersStore.selectedOrderDateFilterTypes"
            @onSelectItemId="onSelectDateFilterType"
          />
          <DatePicker
            ref="DatePickerComponent"
            :initial-from-date="initialFromDate"
            :initial-to-date="initialToDate"
            default-preset="today"
            tomorrow-preset
            @onApply="onChangeDateRange"
          />
          <filter-checkbox-bar-btn
            :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
            :storage-key="dashboardSalesFilterStates"
            @update="filtersStore.updateFilterStates($event, filterStates)"
          />
        </div>
      </div>
      <div class="filter-content">
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filterStates="filtersStore.checkedFilterStates(filterStates)"
          @onOpenDropdown="filtersStore.onOpenDropdown"
          @search="filtersStore.onSearchDropdown"
        />
        <TerritoryTreeDropdowns
          ref="TerritoryTreeDropdownsComponent"
          :filter-storage-key="dashboardSalesFilterStates"
          @onSelect="filtersStore.selectedTerritories = $event"
          @pass-territory-filter-states="addTerritoryFilterStates"
        />
        <flex-row class="submit-item">
          <m-btn @click="onApplyFilter">
            {{ t("apply") }}
          </m-btn>
          <ResetFilterBtn
            :is-filter-clearable="isFilterClearable"
            @onClearFilter="onClearFilter"
          />
        </flex-row>
      </div>
    </div>
    <transition name="modal">
      <div v-if="isClientsModalOpen">
        <OrdersCreateOrdersClientsTableWithFilter
          @closeDialog="isClientsModalOpen = false"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type {
  RadioBtn,
  DropdownsByFilterStates,
  DatePicker,
  TerritoryTreeDropdowns,
} from "#components";
import { useI18n } from "vue-i18n";
import { dashboardSalesFilterStates } from "~/variable/column-constants";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";

// stores
const salesDashboardStore = useDashboardSalesStore("main");
const filtersStore = useFiltersStore("dashboard/sales/filter");
// child components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const RadioBtnComponent = ref<typeof RadioBtn | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);

const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

// state
const { t } = useI18n();

const isClientsModalOpen = ref<boolean>(false);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, dashboardSalesFilterStates);
};

const filterStates = ref<Array<FilterStateModel<object>>>([
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
    name: t("column.product_group"),
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
    checked: isChecked("product-group"),
  },
  {
    name: t("settings.brand"),
    key: "brands",
    get data() {
      return filtersStore.brands || [];
    },
    get getSelectedData() {
      return filtersStore.selectedBrands;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedBrands = value;
    },
    checked: isChecked("brands"),
  },
]);

// hooks

onMounted(async () => {
  await filtersStore.getOrderDateFilterTypes();
  onApplyFilter();
});

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    RadioBtnComponent.value?.isClearable() ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedTradeDirections.length ||
    filtersStore.selectedCurrencies.length ||
    filtersStore.selectedBrands.length ||
    filtersStore.selectedOrderStatuses.length ||
    filtersStore.selectedProductCategorieis.length ||
    filtersStore.selectedProductGroup.length
  );
});

// methods
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel<object>[]
) => {
  filterStates.value.push(...territoryFilterStates);
};

const dateFilterTypes = computed(() => {
  return filtersStore.orderDateFilterTypes.items || undefined;
});

const onSelectDateFilterType = (newValue: number) => {
  filtersStore.selectedOrderDateFilterTypes = newValue;
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onApplyFilter = () => {
  salesDashboardStore.filterParams.currency_id_arr = [
    ...filtersStore.selectedCurrencies,
  ];
  salesDashboardStore.filterParams.territory_id_arr =
    filtersStore.selectedTerritories;
  salesDashboardStore.filterParams.order_status_arr =
    filtersStore.selectedOrderStatuses;
  salesDashboardStore.filterParams.product_category_id_arr =
    filtersStore.selectedProductCategorieis;
  salesDashboardStore.filterParams.trade_direction_id_arr =
    filtersStore.selectedTradeDirections;
  salesDashboardStore.filterParams.brand_id_arr = filtersStore.selectedBrands;
  salesDashboardStore.filterParams.product_group_id_arr =
    filtersStore.selectedProductGroup;
  salesDashboardStore.filterParams.date_filter = {
    range: {
      from: filtersStore.selectedDateRange?.fromDate,
      to: filtersStore.selectedDateRange?.toDate,
    },
    filter_type: filtersStore.selectedOrderDateFilterTypes,
  };
};

const onClearFilter = () => {
  filtersStore.selectedProductCategorieis = [];
  filtersStore.selectedProductGroup = [];
  filtersStore.selectedCurrencies = [];
  filtersStore.selectedBrands = [];
  filtersStore.selectedTradeDirections = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedOrderStatuses = [];
  filtersStore.selectedOrderDateFilterTypes = 1;
  DropdownComponent.value!.onClearFilter();
  DatePickerComponent.value?.onReset();
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  onApplyFilter();
};
<\/script>
`;export{e as default};
