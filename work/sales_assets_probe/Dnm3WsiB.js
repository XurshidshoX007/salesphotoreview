const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="filter-content-header">
        <div class="filter-content-title">
          <page-title size="xl" :title="t('filters.filter')" />
          <div class="create-button-mobile">
            <filter-checkbox-bar-btn
              device="mobile"
              :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
              :storage-key="orderRefundFilterStates"
              @update="filtersStore.updateFilterStates($event, filterStates)"
            />
          </div>
        </div>

        <div class="filter-btn-group">
          <div v-show="hasAccess2GetList" class="filter-btn-group">
            <RadioBtn
              :label="t('labels.type_order')"
              :items="consignationFilterTypes"
              :selectedItem="filtersStore.selectedConsignationFilterType"
              @onSelectItemId="onSelectConsignationFilterType"
            />
            <RadioBtn
              ref="RadioBtnComponent"
              :label="t('labels.date_applies_to')"
              :items="dateFilterTypes"
              :selectedItem="filtersStore.selectedDateFilterType"
              @onSelectItemId="onSelectDateFilterType"
            />
            <DatePicker
              ref="DatePickerComponent"
              :initial-from-date="initialFromDate"
              :initial-to-date="initialToDate"
              default-preset="past-30-days"
              @onApply="onChangeDateRange"
            />
            <div class="create-button-desktop">
              <filter-checkbox-bar-btn
                device="desktop"
                :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
                :storage-key="orderRefundFilterStates"
                @update="filtersStore.updateFilterStates($event, filterStates)"
              />
            </div>
          </div>
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
          v-if="!isWithClient"
          :filter-storage-key="orderRefundFilterStates"
          ref="TerritoryTreeDropdownsComponent"
          @onSelect="filtersStore.selectedTerritories = $event"
          @pass-territory-filter-states="addTerritoryFilterStates"
        />
        <flex-row class="submit-item">
          <m-btn
            @click="onApplyFilter"
            :loading="createOrdersStore.isLoadingForOrderRefund"
            >{{ t("apply") }}
          </m-btn>
          <ResetFilterBtn
            :is-filter-clearable="isFilterClearable"
            @onClearFilter="onClearFilter"
          />
        </flex-row>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  RadioBtn,
  DropdownsByFilterStates,
  DatePicker,
  TerritoryTreeDropdowns,
} from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import { useI18n } from "vue-i18n";
import { orderRefundFilterStates } from "~/variable/column-constants";
import { useOrdersAccess } from "~/composables/access/orders/orders";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { OrderListDateFilterType } from "~/variable/static-constants";
//props
const props = defineProps({
  isWithClient: Boolean,
});
// stores
const filtersStore = useFiltersStore("orders/create-order-refund/filter");
const createOrdersStore = useCreateOrdersStore("main");
// child components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const RadioBtnComponent = ref<typeof RadioBtn | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// state
const { t } = useI18n();
const { hasAccess2GetList } = useOrdersAccess();

const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);

const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[]
) => {
  filterStates.value.push(...territoryFilterStates);
};

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, orderRefundFilterStates);
};

const filterStates = ref<Array<FilterStateModel<object>>>([
  {
    name: t("settings_sidebar.price_type"),
    key: "price-type",
    get data() {
      return filtersStore.priceTypes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedPriceTypes;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedPriceTypes = value;
    },
    checked: isChecked("price-type"),
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
    hide: props.isWithClient,
    checked: isChecked("client-categories"),
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
    name: t("settings_sidebar.products"),
    key: "products",
    get data() {
      return filtersStore.products || [];
    },
    get getSelectedData() {
      return filtersStore.selectedProducts;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedProducts = value;
    },
    checked: isChecked("products"),
  },
  {
    name: t("sidebar.warehouse"),
    key: "warehouses",
    get data() {
      return filtersStore.warehouses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedWarehouses;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedWarehouses = value;
    },
    checked: isChecked("warehouses"),
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
]);

// hooks
const consignationFilterTypes = computed(() => {
  return filtersStore.consignationFilterTypes || undefined;
});

onMounted(async () => {
  await filtersStore.getDateFilterTypes();
  await filtersStore.getConsignationFilterTypes();
  onApplyFilter();
});

const dateFilterTypes = computed(() => {
  return filtersStore.dateFilterTypes || undefined;
});

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    RadioBtnComponent.value?.isClearable() ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedPriceTypes.length ||
    filtersStore.selectedProductCategorieis.length ||
    filtersStore.selectedWarehouses.length ||
    filtersStore.selectedProducts.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedTradeDirections.length ||
    filtersStore.selectedConsignationFilterType !== 1 ||
    filtersStore.selectedDateFilterType !== OrderListDateFilterType.ByOrderDate
  );
});

// methods

const onSelectConsignationFilterType = (newValue: number) => {
  filtersStore.selectedConsignationFilterType = newValue;
};

const onSelectDateFilterType = (newValue: number) => {
  filtersStore.selectedDateFilterType = newValue;
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onApplyFilter = () => {
  if (!hasAccess2GetList.value) return;
  createOrdersStore.paramsForOrderRefund.page = 1;
  createOrdersStore.paramsForOrderRefund.price_type_id_arr =
    filtersStore.selectedPriceTypes;
  createOrdersStore.paramsForOrderRefund.client_category_id_arr =
    filtersStore.selectedClientCategories;
  createOrdersStore.paramsForOrderRefund.territory_id_arr =
    filtersStore.selectedTerritories;
  createOrdersStore.paramsForOrderRefund.consignation_filter_type =
    filtersStore.selectedConsignationFilterType;
  createOrdersStore.paramsForOrderRefund.trade_direction_id_arr =
    filtersStore.selectedTradeDirections;
  createOrdersStore.paramsForOrderRefund.product_category_id_arr =
    filtersStore.selectedProductCategorieis;
  createOrdersStore.paramsForOrderRefund.product_id_arr =
    filtersStore.selectedProducts;
  createOrdersStore.paramsForOrderRefund.warehouse_id_arr =
    filtersStore.selectedWarehouses;
  createOrdersStore.paramsForOrderRefund.date_filter_type =
    filtersStore.selectedDateFilterType;
  createOrdersStore.paramsForOrderRefund.date_range!.from =
    filtersStore.selectedDateRange?.fromDate;
  createOrdersStore.paramsForOrderRefund.date_range!.to =
    filtersStore.selectedDateRange?.toDate;
  createOrdersStore.paramsForOrderRefund.agent_id_arr = [
    ...filtersStore.selectedAgents,
  ];
  if (props.isWithClient) {
    createOrdersStore.paramsForOrderRefund.client_id =
      createOrdersStore.dataOrderRefundDetail?.client?.id;
  } else {
    createOrdersStore.paramsForOrderRefund.client_id = null;
  }
};

const onClearFilter = () => {
  createOrdersStore.setPageForOrderRefund(1);
  filtersStore.selectedAgents = [];
  filtersStore.selectedPriceTypes = [];
  filtersStore.selectedProductCategorieis = [];
  filtersStore.selectedWarehouses = [];
  filtersStore.selectedTradeDirections = [];
  filtersStore.selectedDateFilterType = OrderListDateFilterType.ByOrderDate;
  filtersStore.selectedProducts = [];
  filtersStore.selectedClientCategories = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedConsignationFilterType = 1;
  DropdownComponent.value!.onClearFilter();
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DatePickerComponent.value!.onReset();
  RadioBtnComponent.value!.onReset();
  onApplyFilter();
};
<\/script>
`;export{e as default};
