const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="filter-content-header">
        <div class="flex gap-2 items-center">
          <page-title-20 :title="pageTitle" />
          <div v-if="isSelectedConfigDeletable">
            <rounded-icon-btn type="danger" @click="onDeleteChosenConfig" />
          </div>
          <div v-if="selectedConfigId !== 'default'">
            <rounded-icon-btn
              icon-file-name="bookmark"
              :tooltip="
                t(
                  'reports.universal_sales_report.save_current_state_to_favourites',
                )
              "
              @click="openSaveConfigToFavPagesDialog"
            />
          </div>
        </div>
        <div class="filter-btn-group">
          <RadioBtn
            v-if="radioItemsByReportType.length"
            ref="RadioBtnComponent"
            :label="t('labels.date_applies_to')"
            :items="radioItemsByReportType"
            :selectedItem="selectedRadioItemByReportType"
            @onSelectItemId="onChangeSelectedRadioItemByReportType"
          />
          <DatePicker
            ref="DatePickerComponent"
            tomorrow-preset
            default-preset="this-month"
            :initial-from-date="initialFromDate"
            :initial-to-date="initialToDate"
            @onApply="onChangeDateRange"
          />
          <filter-checkbox-bar-btn
            :filter-state-keys="filterStateKeys"
            :storage-key="storageKey"
            @update="updateFilterStates"
          />
        </div>
      </div>
      <div class="filter-content">
        <dropdowns-by-filter-states
          ref="DropdownComponent"
          :filter-states="checkedFilterStates"
          @onOpenDropdown="filtersStore.onOpenDropdown"
          @search="filtersStore.onSearchDropdown"
        />
        <TerritoryTreeDropdowns
          ref="TerritoryTreeDropdownsComponent"
          :filter-storage-key="storageKey"
          @onSelect="filtersStore.selectedTerritories = $event"
          @pass-territory-filter-states="addTerritoryFilterStates"
        />
        <flex-row class="submit-item">
          <m-btn
            :loading="universalSalesReportStore.isDataLoading"
            @click="onApplyFilter"
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
    <transition name="modal">
      <div v-if="isSaveToFavPagesDialogOpen">
        <ReportsUniversalSalesReportSaveToFavPagesDialog
          :is-save-btn-loading="isSavingToFavPage"
          @close-dialog="closeSaveConfigToFavPagesDialog"
          @on-save="onSaveConfigToFavourites"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import {
  type DatePicker,
  type DropdownsByFilterStates,
  type RadioBtn,
  type TerritoryTreeDropdowns,
} from "#components";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { FavouritePagesEventKeys } from "~/variable/event-key-constants";
import { setFavoritePageToLocalByKey } from "~/utils/local-storage";

// Props
const props = defineProps<{
  reportType: "return" | "sales" | "bonus" | "cashbox";
  pageTitle: string;
  storageKey: string;
  selectedConfigId?: string | "default";
}>();

// Store
const filtersStore = useFiltersStore(
  "/reports/order-by-agents" + props.reportType.toString(),
);
const universalSalesReportStore = useUniversalReportsStore("main");

// Emits
const emit = defineEmits(["onDeleteChosenConfig"]);

// Child Components
const route = useRoute();
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const RadioBtnComponent = ref<typeof RadioBtn | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);
const isSaveToFavPagesDialogOpen = ref(false);
const isSavingToFavPage = ref(false);

// State
const eventBus = useEventBus();
const { t } = useI18n();
const filterStates = ref<FilterStateModel[]>([]);
type ReportType = "return" | "sales" | "bonus" | "cashbox";

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, props.storageKey);
};

const reportFilterStateKeysByType: Record<ReportType, string[]> = {
  sales: [
    "branches",
    "supervisors",
    "agent-dropdown",
    "expeditors",
    "client-categories",
    "clients",
    "trade-directions",
    "order-type",
    "order-statuses",
    "brands",
    "product-category",
    "product-group",
    "kpi-product-groups",
    "products",
    "currencies",
    "price-type",
    "warehouses",
  ],
  return: [
    "branches",
    "agent-dropdown",
    "expeditors",
    "order-statuses",
    "product-category",
    "product-group",
    "products",
    "currencies",
    "price-type",
    "warehouses",
  ],
  bonus: [
    "branches",
    "agent-dropdown",
    "order-statuses",
    "product-category",
    "product-group",
    "products",
    "warehouses",
  ],
  cashbox: [
    "branches",
    "supervisors",
    "agent-dropdown",
    "expeditors",
    "clients",
    "trade-directions",
    "payment-statuses",
    "cash",
    "currencies",
  ],
};

const allFilterStatesArr: FilterStateModel[] = [
  {
    name: t("settings_sidebar.branches"),
    key: "branches",
    paramsKey: "branch_id_arr",
    checked: isChecked("branches"),
    get data() {
      return filtersStore.branches || [];
    },
    get getSelectedData() {
      return filtersStore.selectedBranches;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedBranches = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedBranches;
    },
  },
  {
    name: t("sidebar.supervisor"),
    key: "supervisors",
    paramsKey: "supervisor_id_arr",
    checked: isChecked("supervisors"),
    get data() {
      return filtersStore.supervisors || undefined;
    },
    get getSelectedData() {
      return filtersStore.selectedSupervisors;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedSupervisors = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedSupervisors;
    },
  },
  {
    name: t("users.agents.agent"),
    key: "agent-dropdown",
    paramsKey: "agent_id_arr",
    isFilter: true,
    checked: isChecked("agent-dropdown"),
    get data() {
      return filtersStore.agents || [];
    },
    get getSelectedData() {
      return filtersStore.selectedAgents;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedAgents = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedAgents;
    },
  },
  {
    name: t("filters.expeditor"),
    key: "expeditors",
    paramsKey: "expeditor_id_arr",
    checked: isChecked("expeditors"),
    get data() {
      return filtersStore.expeditors || [];
    },
    get getSelectedData() {
      return filtersStore.selectedExpeditors;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedExpeditors = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedExpeditors;
    },
  },
  {
    name: t("settings_sidebar.client_category"),
    key: "client-categories",
    paramsKey: "client_category_id_arr",
    checked: isChecked("client-categories"),
    get data() {
      return filtersStore.clientCategories || [];
    },
    get getSelectedData() {
      return filtersStore.selectedClientCategories;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedClientCategories = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedClientCategories;
    },
  },
  {
    name: t("sidebar.clients"),
    key: "clients",
    paramsKey: "client_id_arr",
    checked: isChecked("clients"),
    get data() {
      return filtersStore.clients || undefined;
    },
    get getSelectedData() {
      return filtersStore.selectedClients;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedClients = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedClients;
    },
    onLoadElse: async () => {
      await filtersStore.onLoadElseClients();
    },
  },
  {
    name: t("settings_sidebar.trade_direction"),
    key: "trade-directions",
    paramsKey: "trade_direction_id_arr",
    checked: isChecked("trade-directions"),
    get data() {
      return filtersStore.tradeDirections || undefined;
    },
    get getSelectedData() {
      return filtersStore.selectedTradeDirections;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedTradeDirections = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedTradeDirections;
    },
  },
  {
    name: t("column.order_type"),
    key: "order-type",
    paramsKey: "order_type_arr",
    checked: isChecked("order-type"),
    get data() {
      return filtersStore.orderTypes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedOrderTypes;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedOrderTypes = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedOrderTypes;
    },
  },
  {
    name: t("column.order_status"),
    key: "order-statuses",
    paramsKey: "order_status_arr",
    checked: isChecked("order-statuses"),
    type: "number",
    get data() {
      return filtersStore.orderStatuses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedOrderStatuses;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedOrderStatuses = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedOrderStatuses;
    },
  },
  {
    name: t("filters.brand"),
    key: "brands",
    paramsKey: "product_brand_id_arr",
    checked: isChecked("brands"),
    get data() {
      return filtersStore.brands || [];
    },
    get getSelectedData() {
      return filtersStore.selectedBrands;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedBrands = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedBrands;
    },
  },
  {
    name: t("settings_sidebar.product_category"),
    key: "product-category",
    paramsKey: "product_category_id_arr",
    checked: isChecked("product-category"),
    get data() {
      return filtersStore.productCategory || [];
    },
    get getSelectedData() {
      return filtersStore.selectedProductCategorieis;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedProductCategorieis = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedProductCategorieis;
    },
  },
  {
    name: t("column.product_group"),
    key: "product-group",
    paramsKey: "product_group_id_arr",
    checked: isChecked("product-group"),
    get data() {
      return filtersStore.productGroup || [];
    },
    get getSelectedData() {
      return filtersStore.selectedProductGroup;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedProductGroup = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedProductGroup;
    },
  },
  {
    name: t("sidebar.kpi_product_groups"),
    key: "kpi-product-groups",
    paramsKey: "kpi_product_group_id_arr",
    checked: isChecked("kpi-product-groups"),
    get data() {
      return filtersStore.kpiProductGroups || undefined;
    },
    get getSelectedData() {
      return filtersStore.selectedKpiProductGroups;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedKpiProductGroups = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedKpiProductGroups;
    },
  },
  {
    name: t("settings_sidebar.products"),
    key: "products",
    paramsKey: "product_id_arr",
    checked: isChecked("products"),
    get data() {
      return filtersStore.products || [];
    },
    get getSelectedData() {
      return filtersStore.selectedProducts;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedProducts = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedProducts;
    },
  },
  {
    name: t("cash.cash"),
    key: "cash",
    paramsKey: "cashbox_id_arr",
    checked: isChecked("cash"),
    get data() {
      return filtersStore.cashboxes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedCashboxes;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedCashboxes = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedCashboxes;
    },
  },
  {
    name: t("settings_sidebar.payment_method"),
    key: "currencies",
    paramsKey: "payment_method_id_arr",
    isFilter: true,
    checked: isChecked("currencies"),
    get data() {
      return filtersStore.currency || [];
    },
    get getSelectedData() {
      return filtersStore.selectedCurrencies;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedCurrencies = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedCurrencies;
    },
  },
  {
    name: t("settings_sidebar.price_type"),
    key: "price-type",
    paramsKey: "price_type_id_arr",
    checked: isChecked("price-type"),
    get data() {
      return filtersStore.priceTypes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedPriceTypes;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedPriceTypes = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedPriceTypes;
    },
  },
  {
    name: t("reports.universal_sales_report.payment_status"),
    key: "payment-statuses",
    paramsKey: "status",
    type: "number",
    isSingleSelect: true,
    checked: isChecked("paymentStatuses"),
    get data() {
      return filtersStore.paymentStatuses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedPaymentStatuses;
    },
    set setSelectedData(value: number) {
      filtersStore.selectedPaymentStatuses = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedPaymentStatuses;
    },
  },
  {
    name: t("sidebar.warehouse"),
    key: "warehouses",
    paramsKey: "warehouse_id_arr",
    checked: isChecked("warehouses"),
    get data() {
      return filtersStore.warehouses || undefined;
    },
    get getSelectedData() {
      return filtersStore.selectedWarehouses;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedWarehouses = value;
    },
    get getSelectedDataIds() {
      return filtersStore.selectedWarehouses;
    },
  },
];

// Hooks
const initialToDate = computed(
  () => filtersStore.selectedDateRange?.toDate || null,
);
const initialFromDate = computed(
  () => filtersStore.selectedDateRange?.fromDate || null,
);

const isSelectedConfigDeletable = computed(() => {
  if (props.selectedConfigId === "default") return false;
  return universalSalesReportStore.userConfigByReportType?.find(
    (config) => config.id === props.selectedConfigId,
  )?.can_delete;
});

const radioItemsByTypeGetter: Record<ReportType, () => unknown[]> = {
  sales: () => universalSalesReportStore.dateFilterTypes || [],
  return: () => universalSalesReportStore.returnFilterTypes || [],
  bonus: () => universalSalesReportStore.orderDateFilterTypes || [],
  cashbox: () => [],
};

const selectedRadioByTypeGetter: Partial<Record<ReportType, () => number>> = {
  sales: () => universalSalesReportStore.selectedDateFilterType,
  return: () => universalSalesReportStore.selectedReturnFilterType,
  bonus: () => universalSalesReportStore.selectedOrderDateFilterType,
};

const onChangeRadioByType: Partial<
  Record<ReportType, (newItemId: number) => void>
> = {
  sales: (newItemId: number) => {
    universalSalesReportStore.selectedDateFilterType = newItemId;
  },
  return: (newItemId: number) => {
    universalSalesReportStore.selectedReturnFilterType = newItemId;
  },
  bonus: (newItemId: number) => {
    universalSalesReportStore.selectedOrderDateFilterType = newItemId;
  },
};

const onApplyRadioByType: Partial<
  Record<ReportType, (params: Record<string, any>) => void>
> = {
  sales: (params) => {
    params.date_range.filter_type =
      universalSalesReportStore.selectedDateFilterType;
  },
  return: (params) => {
    params.order_return_filter_type =
      universalSalesReportStore.selectedReturnFilterType;
    params.date_range.filter_type = 1;
  },
  bonus: (params) => {
    params.date_range.filter_type =
      universalSalesReportStore.selectedOrderDateFilterType;
  },
};

const constantsLoaderByType: Partial<Record<ReportType, () => Promise<void>>> =
  {
    sales: () => universalSalesReportStore.getDateFilterTypes(),
    return: () => universalSalesReportStore.getReturnFilterTypes(),
    bonus: () => universalSalesReportStore.getOrderDateFilterTypes(),
  };

const radioItemsByReportType = computed(() => {
  return radioItemsByTypeGetter[props.reportType]();
});

const selectedRadioItemByReportType = computed(() => {
  return selectedRadioByTypeGetter[props.reportType]?.();
});

const filterStateKeys = computed(() => {
  const stateKeys: Record<string, { name: string; checked?: boolean }> = {};
  filterStates.value.forEach(({ name, key, checked }) => {
    stateKeys[key] = { name, checked };
  });
  return stateKeys;
});

const checkedFilterStates = computed(() => {
  return filterStates.value.filter((item) => item.checked);
});

const isFilterClearable = computed(() => {
  return !(
    filterStates.value.some((item) => {
      if (Array.isArray(item.getSelectedData)) {
        return item.getSelectedData.length > 0;
      }
      return item.getSelectedData;
    }) ||
    DatePickerComponent.value?.isClearable() ||
    RadioBtnComponent.value?.isClearable()
  );
});

const getFilterStatesByKeys = (keys: string[]): FilterStateModel[] => {
  const keysSet = new Set(keys);
  return allFilterStatesArr.filter((item) => keysSet.has(item.key));
};

watch(
  () => props.reportType,
  (newType) => {
    const keys = reportFilterStateKeysByType[newType as ReportType] || [];
    filterStates.value = getFilterStatesByKeys(keys);
  },
  { immediate: true },
);

watch(
  () => route.query,
  () => {
    setFiltersFromRouteQuery();
  },
);

onBeforeMount(() => {
  universalSalesReportStore.reportType = props.reportType;
});

onMounted(async () => {
  filtersStore.selectedPaymentStatuses = 2; // set to approved by default
  await Promise.all([
    getConstantsByType(),
    setFiltersFromRouteQuery(),
    filtersStore.getPaymentStatuses(),
  ]);
});

// Methods
const openSaveConfigToFavPagesDialog = () => {
  isSaveToFavPagesDialogOpen.value = true;
};

const closeSaveConfigToFavPagesDialog = () => {
  isSaveToFavPagesDialogOpen.value = false;
};

const setFiltersFromRouteQuery = async () => {
  if (!Object.keys(route.query).length) return;

  await waitForTerritory();

  filterStates.value.forEach((filter) => {
    const queryValue = route.query[filter.paramsKey];

    if (queryValue) {
      const valueArr = Array.isArray(queryValue) ? queryValue : [queryValue];

      let formatted;
      if (filter.isSingleSelect) {
        formatted =
          filter.type === "number" ? Number(valueArr[0]) : valueArr[0];
      } else {
        formatted = filter.type === "number" ? valueArr.map(Number) : valueArr;
      }

      filter.setSelectedData = formatted;
    } else {
      filter.setSelectedData = [];
    }
  });
  filtersStore.selectedDateRange!.fromDate = route.query?.date_range![0];
  filtersStore.selectedDateRange!.toDate = route.query?.date_range![1];
};

const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[],
) => {
  territoryFilterStates.forEach((filter) => {
    Object.defineProperties(filter, {
      paramsKey: {
        value: "territory_id_arr",
        enumerable: true,
      },
      getSelectedDataIds: {
        get() {
          return filtersStore.selectedTerritories;
        },
        enumerable: true,
      },
    });

    filterStates.value.push(filter);
  });
};

const waitForTerritory = async () => {
  if (!route.query["territory_id_arr"]) return;
  TerritoryTreeDropdownsComponent.value &&
    (await TerritoryTreeDropdownsComponent.value.waitForFetch());
};

const updateFilterStates = (
  newFilterStates: Record<string, { name: string; checked: boolean }>,
) => {
  filterStates.value.forEach((item) => {
    item.checked = newFilterStates[item.key]?.checked;
  });
};

const onChangeSelectedRadioItemByReportType = (newItemId: number) => {
  onChangeRadioByType[props.reportType]?.(newItemId);
};

const onApplySelectedRadioItemByReportType = (params: Record<string, any>) => {
  onApplyRadioByType[props.reportType]?.(params);
};

const replaceUniversalReportParams = (newParams: Record<string, any>) => {
  const params = universalSalesReportStore.params as Record<string, any>;
  Object.keys(params).forEach((key) => {
    delete params[key];
  });
  Object.assign(params, newParams);
};

const onChangeDateRange = (newRange: any) => {
  filtersStore.selectedDateRange = newRange;
};

const onDeleteChosenConfig = () => {
  emit("onDeleteChosenConfig");
};

const onApplyFilter = async () => {
  await waitForTerritory();

  const newParams: Record<string, any> = {};

  if (props.reportType === "cashbox") {
    const filterMapping = {
      agent_id: filtersStore.selectedAgents,
      expeditor_id: filtersStore.selectedExpeditors,
      supervisor_id: filtersStore.selectedSupervisors,
      trade_direction_id: filtersStore.selectedTradeDirections,
      territory_id: filtersStore.selectedTerritories,
      client_id: filtersStore.selectedClients,
      cash_box_id: filtersStore.selectedCashboxes,
      currency_id: filtersStore.selectedCurrencies,
      product_id_arr: filtersStore.selectedProducts,
      branch_id_arr: filtersStore.selectedBranches,
      status: filtersStore.selectedPaymentStatuses,
    };

    Object.entries(filterMapping).forEach(([key, value]) => {
      onAddFieldToFilter(newParams, key, value);
    });

    newParams.date_range = {
      from: filtersStore.selectedDateRange?.fromDate,
      to: filtersStore.selectedDateRange?.toDate,
    };
  } else {
    for (const filter of filterStates.value) {
      newParams[filter.paramsKey] = filter.getSelectedDataIds;
    }

    newParams.territory_id_arr = [...filtersStore.selectedTerritories];
    newParams.date_range = {
      range: {
        from: filtersStore.selectedDateRange.fromDate,
        to: filtersStore.selectedDateRange.toDate,
      },
    };

    onApplySelectedRadioItemByReportType(newParams);
  }

  replaceUniversalReportParams(newParams);
};

const onClearFilter = () => {
  for (const filter of filterStates.value) {
    filter.setSelectedData = [];
  }

  // Clear components if they exist
  TerritoryTreeDropdownsComponent.value?.clearSelectedItems();
  DropdownComponent.value?.onClearFilter();
  DatePickerComponent.value?.onReset();
  RadioBtnComponent.value?.onReset();
  onApplyFilter();
};

const getConstantsByType = async () => {
  await constantsLoaderByType[props.reportType]?.();
};

const onSaveConfigToFavourites = async (info: {
  name: string;
  sort?: number | null;
}) => {
  if (!props.selectedConfigId) return;
  isSavingToFavPage.value = true;

  const _params = {
    date_range: [
      filtersStore.selectedDateRange?.fromDate,
      filtersStore.selectedDateRange?.toDate,
    ],
    configId: props.selectedConfigId,
  };

  for (const filter of filterStates.value) {
    _params[filter.paramsKey] = filter.getSelectedDataIds;
  }

  const urlQuery = route.path + "?" + params2query(_params);

  const payload = {
    name: info.name,
    sort_number: info.sort,
    url: urlQuery,
    is_public: false,
  };

  const res = await universalSalesReportStore.saveUrlQueryToFavPages(payload);
  if (res !== "error") {
    notify({
      title: t("reports.universal_sales_report.saved_to_favourites"),
      type: "success",
    });
    resetFavPages();
  } else {
    notify({
      title: t("error"),
      type: "error",
    });
  }
  isSavingToFavPage.value = false;
  closeSaveConfigToFavPagesDialog();
};

const resetFavPages = () => {
  setFavoritePageToLocalByKey("items", undefined);
  eventBus.emit(FavouritePagesEventKeys.FAV_PAGE_ITEMS_UPDATE);
};

defineExpose({
  onApplyFilter,
  onClearFilter,
});
<\/script>
`;export{e as default};
