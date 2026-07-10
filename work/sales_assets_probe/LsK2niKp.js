const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="filter-content-header">
        <div class="filter-content-title">
          <page-title size="xl" :title="t('sidebar.orders')" />
          <div class="create-button-mobile">
            <OrdersOrdersOrderCreateBtn
              @on-open-clients-popup="onOpenClientsPopup"
            />
            <filter-checkbox-bar-btn
              :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
              :storage-key="orderFilterStates"
              device="mobile"
              @update="filtersStore.updateFilterStates($event, filterStates)"
            />
          </div>
        </div>
        <div class="filter-btn-group">
          <div v-show="hasAccess2GetList" class="filter-btn-group">
            <RadioBtn
              ref="RadioBtnComponent"
              :label="t('labels.date_applies_to')"
              :items="dateFilterTypes"
              :selectedItem="filtersStore.selectedDateFilterType"
              @onSelectItemId="onSelectDateFilterType"
            />
            <DatePicker
              ref="DatePickerComponent"
              :label="t('column.date')"
              default-preset="today"
              :initial-from-date="initialFromDate"
              :initial-to-date="initialToDate"
              tomorrow-preset
              disable-past-dates
              @onApply="onChangeDateRange"
            />
          </div>
          <div class="create-button-desktop">
            <filter-checkbox-bar-btn
              :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
              :storage-key="orderFilterStates"
              device="desktop"
              @update="filtersStore.updateFilterStates($event, filterStates)"
            />
            <OrdersOrdersOrderCreateBtn
              @on-open-clients-popup="onOpenClientsPopup"
            />
          </div>
        </div>
      </div>
      <div v-show="hasAccess2GetList" class="filter-content">
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filterStates="filtersStore.checkedFilterStates(filterStates)"
          @onOpenDropdown="filtersStore.onOpenDropdown"
          @search="filtersStore.onSearchDropdown"
        />
        <TerritoryTreeDropdowns
          ref="TerritoryTreeDropdownsComponent"
          :filter-storage-key="orderFilterStates"
          @onSelect="filtersStore.selectedTerritories = $event"
          @pass-territory-filter-states="addTerritoryFilterStates"
        />
        <flex-row class="submit-item">
          <m-btn
            :loading="orderStore.isLoading && orderStore.isFilterLoading"
            @click="onApplyFilter"
            >{{ t("apply") }}
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
    <transition name="modal">
      <div v-if="isCreateOrderOpenForRefund">
        <OrdersOrderRefundCreateOrderRefundDialog
          @closeDialog="isCreateOrderOpenForRefund = false"
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
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import { useI18n } from "vue-i18n";
import { orderFilterStates } from "~/variable/column-constants";
import { useOrdersAccess } from "~/composables/access/orders/orders";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { OrderListDateFilterType } from "~/variable/static-constants";

// stores
const orderStore = useOrdersStore("main");
const filtersStore = useFiltersStore("orders/orders");

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

const router = useRouter();
const route = useRoute();
const isClientsModalOpen = ref<boolean>(false);
const isCreateOrderOpenForRefund = ref(false);

const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);

const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const unAttachExpeditor = ref([
  {
    name: t("column.without_expeditor"),
    id: "00000000-0000-0000-0000-000000000000",
    is_active: true,
  },
]);

const unAttachAgent = ref([
  {
    name: t("column.without_agent"),
    id: "00000000-0000-0000-0000-000000000000",
    is_active: true,
  },
]);

const unAttachInvoices = ref([
  {
    name: t("column.without_invoices"),
    id: null,
  },
]);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, orderFilterStates);
};

const filterStates = ref<Array<FilterStateModel<object>>>([
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
      return withoutAgentsStates.value || [];
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
    name: t("sidebar.delivery"),
    key: "expeditors",
    get data() {
      return withoutExpeditorsStates.value || [];
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
    name: t("sidebar.clients"),
    key: "clients-dynamic",
    get data() {
      return filtersStore.clients || [];
    },
    get getSelectedData() {
      return filtersStore.selectedClients;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedClients = value;
    },
    onLoadElse: async () => {
      await filtersStore.onLoadElseClientsDynamic();
    },
    checked: isChecked("clients-dynamic"),
  },
  {
    name: t("column.day"),
    key: "day",
    data: filtersStore.days,
    get getSelectedData() {
      return filtersStore.selectedDays;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedDays = value;
    },
    checked: isChecked("day"),
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
    name: t("column.type"),
    key: "order-types-with-partial-return",
    get data() {
      return filtersStore.orderTypesWithPartialReturn || [];
    },
    get getSelectedData() {
      return filtersStore.selectedOrderTypesWithPartialReturn;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedOrderTypesWithPartialReturn = value;
    },
    checked: isChecked("order-types-with-partial-return"),
  },
  {
    name: t("column.order_invoice_type"),
    key: "order-invoice-type",
    get data() {
      return withoutInvoicesStates.value || [];
    },
    get getSelectedData() {
      return filtersStore.selectedOrderInvoicesType;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedOrderInvoicesType = value;
    },
    checked: isChecked("order-invoice-type"),
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
  {
    name: t("settings_sidebar.price_type"),
    key: "price-type-sale",
    get data() {
      return filtersStore.priceTypes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedPriceTypes;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedPriceTypes = value;
    },
    checked: isChecked("price-type-sale"),
  },
  {
    name: t("column.consignation"),
    key: "consignations",
    isSingleSelect: true,
    get data() {
      return filtersStore.consignations || [];
    },
    get getSelectedData() {
      return filtersStore.selectedConsignation;
    },
    set setSelectedData(value: number) {
      filtersStore.selectedConsignation = value;
    },
    checked: isChecked("consignations"),
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
]);

// hooks

const withoutExpeditorsStates = computed(() => {
  return {
    items: filtersStore.expeditors
      ? [...unAttachExpeditor.value, ...filtersStore.expeditors.items]
      : undefined,
  };
});

const withoutAgentsStates = computed(() => {
  return {
    items: filtersStore.agents
      ? [...unAttachAgent.value, ...filtersStore.agents.items]
      : undefined,
  };
});

const withoutInvoicesStates = computed(() => {
  return {
    items: filtersStore.orderInvoicesType.items
      ? [
          ...unAttachInvoices.value,
          ...(filtersStore.orderInvoicesType.items || []),
        ]
      : undefined,
  };
});

onMounted(async () => {
  await filtersStore.getDateFilterTypes();
  onApplyFilter();
  isQueryToOpenModalExist();
});

const dateFilterTypes = computed(() => {
  return filtersStore.dateFilterTypes || undefined;
});

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    RadioBtnComponent.value?.isClearable() ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedOrderStatuses.length ||
    filtersStore.selectedOrderTypesWithPartialReturn.length ||
    filtersStore.selectedPriceTypes.length ||
    filtersStore.selectedCurrencies.length ||
    filtersStore.selectedProductCategorieis.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedWarehouses.length ||
    filtersStore.selectedExpeditors.length ||
    filtersStore.selectedProducts.length ||
    filtersStore.selectedDays.length ||
    filtersStore.selectedTradeDirections.length ||
    filtersStore.selectedOrderInvoicesType.length ||
    filtersStore.selectedClients.length ||
    orderStore.params.date_filter_type !==
      OrderListDateFilterType.ByOrderDate ||
    filtersStore.selectedConsignation !== undefined
  );
});

// methods
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[]
) => {
  filterStates.value.push(...territoryFilterStates);
};

const isQueryToOpenModalExist = () => {
  const queryParams = route.query;
  if (Object.keys(queryParams).length) {
    const queryKey = Object.keys(queryParams)[0];
    onOpenClientsPopup(queryKey);
  }
};

const onOpenClientsPopup = (type: string) => {
  if (type === "refundable-order") {
    isCreateOrderOpenForRefund.value = true;
  } else {
    isClientsModalOpen.value = !isClientsModalOpen.value;
  }
  router.push({ query: { [type]: "" } });
};

const onSelectDateFilterType = (newValue: number) => {
  filtersStore.selectedDateFilterType = newValue;
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onApplyFilter = () => {
  if (!hasAccess2GetList.value) return;
  orderStore.setNullOrderIds();
  orderStore.isFilterLoading = true;
  orderStore.params.branch_id_arr = filtersStore.selectedBranches;
  orderStore.params.status_arr = filtersStore.selectedOrderStatuses;
  orderStore.params.type_arr = filtersStore.selectedOrderTypesWithPartialReturn;
  orderStore.params.price_type_id_arr = filtersStore.selectedPriceTypes;
  orderStore.params.currency_id_arr = filtersStore.selectedCurrencies;
  orderStore.params.day_arr = filtersStore.selectedDays;
  orderStore.params.trade_direction_id_arr =
    filtersStore.selectedTradeDirections;
  orderStore.params.territory_id_arr = filtersStore.selectedTerritories;
  orderStore.params.product_category_id_arr =
    filtersStore.selectedProductCategorieis;
  orderStore.params.product_id_arr = filtersStore.selectedProducts;
  orderStore.params.client_category_id_arr =
    filtersStore.selectedClientCategories;
  orderStore.params.warehouse_id_arr = filtersStore.selectedWarehouses;
  orderStore.params.expeditor_id_arr = filtersStore.selectedExpeditors;
  orderStore.params.date_filter_type = filtersStore.selectedDateFilterType;
  orderStore.params.invoice_type_id_arr =
    filtersStore.selectedOrderInvoicesType;
  orderStore.params.date_range!.from = filtersStore.selectedDateRange?.fromDate;
  orderStore.params.date_range!.to = filtersStore.selectedDateRange?.toDate;
  orderStore.params.agent_id_arr = [...filtersStore.selectedAgents];
  orderStore.params.filter = [
    {
      field: "for_consignation",
      value: filtersStore.selectedConsignation?.toString()
        ? [(!!filtersStore.selectedConsignation)?.toString()]
        : [],
    },
    {
      field: "client_id",
      value: filtersStore.selectedClients,
    },
  ];
};

const onClearFilter = () => {
  orderStore.setPage(1);
  filtersStore.selectedBranches = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedOrderStatuses = [];
  filtersStore.selectedOrderTypesWithPartialReturn = [];
  filtersStore.selectedPriceTypes = [];
  filtersStore.selectedCurrencies = [];
  filtersStore.selectedClients = [];
  filtersStore.selectedProductCategorieis = [];
  filtersStore.selectedClientCategories = [];
  filtersStore.selectedWarehouses = [];
  filtersStore.selectedExpeditors = [];
  filtersStore.selectedTradeDirections = [];
  filtersStore.selectedDateFilterType = OrderListDateFilterType.ByOrderDate;
  filtersStore.selectedDays = [];
  filtersStore.selectedProducts = [];
  filtersStore.selectedOrderInvoicesType = [];
  filtersStore.selectedConsignation = undefined;
  DropdownComponent.value!.onClearFilter();
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DatePickerComponent.value!.onReset();
  RadioBtnComponent.value!.onReset();
  onApplyFilter();
};
<\/script>
`;export{e as default};
