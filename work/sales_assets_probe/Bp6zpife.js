const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="filter-content-header">
        <div class="filter-content-title">
          <page-title20 :title="t('cash.customer_payments')" />
          <div class="create-button-mobile">
            <filter-checkbox-bar-btn
              device="mobile"
              :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
              :storage-key="paymentCustomersFilterStates"
              @update="filtersStore.updateFilterStates($event, filterStates)"
            />
            <m-btn v-show="allowToCreate" @click="addPaymentModalOpen = true">
              {{ t("orders.add_payment") }}
            </m-btn>
          </div>
        </div>
        <div class="filter-btn-group">
          <RadioBtn
            ref="RadioBtnComponent"
            :label="t('labels.type_order')"
            :items="consignationFilterTypes"
            :selectedItem="filtersStore.selectedConsignationFilterType"
            @onSelectItemId="onSelectConsignationFilterType"
          />
          <DatePicker
            ref="DatePickerComponent"
            :initial-from-date="initialFromDate"
            :initial-to-date="initialToDate"
            default-preset="this-month"
            @onApply="onApplyDateRange"
          />
          <div class="create-button-desktop">
            <filter-checkbox-bar-btn
              device="desktop"
              :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
              :storage-key="paymentCustomersFilterStates"
              @update="filtersStore.updateFilterStates($event, filterStates)"
            />
            <m-btn v-show="allowToCreate" @click="addPaymentModalOpen = true">
              {{ t("orders.add_payment") }}
            </m-btn>
          </div>
        </div>
      </div>
      <div class="filter-content">
        <dropdowns-by-filter-states
          ref="DropdownComponent"
          :filter-states="filtersStore.checkedFilterStates(filterStates)"
          @onOpenDropdown="filtersStore.onOpenDropdown"
          @search="filtersStore.onSearchDropdown"
        />
        <TerritoryTreeDropdowns
          ref="TerritoryTreeDropdownsComponent"
          :filter-storage-key="paymentCustomersFilterStates"
          @onSelect="filtersStore.selectedTerritories = $event"
          @pass-territory-filter-states="addAdditionalFilterStates"
        />
        <div
          v-show="isChecked(sliderSummaFromToState)"
          class="md:col-span-2 col-span-1"
        >
          <FilterSlider
            :range-amount="filtersStore.paymentAmountRange"
            :min="filtersStore.price.min"
            :max="filtersStore.price.max"
            :filter-storage-key="paymentCustomersFilterStates"
            @on-range-amount="filtersStore.paymentAmountRange = $event"
            @addSliderFilterState="addAdditionalFilterStates"
          />
        </div>
        <flex-row class="submit-item">
          <m-btn
            :loading="
              clientsPaymentStore.isLoading &&
              !clientsPaymentStore.isFilterLoading
            "
            @click="onSetFilters"
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
      <DashboardCashboxPaymentCustomersAddPaymentDialog
        v-if="addPaymentModalOpen"
        @refresh="clientsPaymentStore.refresh()"
        @closeDialog="closePaymentDialog"
      />
    </transition>
  </div>
</template>

<script setup lang="ts">
import type {
  DatePicker,
  DropdownsByFilterStates,
  RadioBtn,
  TerritoryTreeDropdowns,
} from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import { useI18n } from "vue-i18n";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import {
  paymentCustomersFilterStates,
  sliderSummaFromToState,
} from "~/variable/column-constants";
import { ConsignationFilterType } from "~/variable/static-constants";

// props
const props = defineProps({
  allowToCreate: Boolean,
});

// Store
const clientsPaymentStore = useClientsPaymentStore("main");
const filtersStore = useFiltersStore("/dashboard/cashbox/payment-customers");

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const RadioBtnComponent = ref<typeof RadioBtn | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// states
const { t } = useI18n();
const dateRange = ref<DateRangeModel>({} as DateRangeModel);

const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);
const addPaymentModalOpen = ref(false);
const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, paymentCustomersFilterStates);
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
    name: t("column.status"),
    key: "payment-statuses",
    isSingleSelect: true,
    get data() {
      return filtersStore.paymentStatuses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedPaymentStatuses;
    },
    set setSelectedData(value: number) {
      filtersStore.selectedPaymentStatuses = value;
    },
    checked: isChecked("paymentStatuses"),
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

// hooks
const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedCashboxes.length ||
    filtersStore.selectedCurrencies.length ||
    filtersStore.selectedExpeditors.length ||
    filtersStore.selectedPaymentStatuses !== null ||
    filtersStore.selectedTradeDirections.length ||
    filtersStore.paymentAmountRange[0] !== 0 ||
    filtersStore.paymentAmountRange[1] !== filtersStore.maxPaymentAmount ||
    filtersStore.selectedConsignationFilterType !== ConsignationFilterType.All
  );
});

const consignationFilterTypes = computed(() => {
  return filtersStore.consignationFilterTypes || undefined;
});

onMounted(async () => {
  await Promise.all([
    filtersStore.getConsignationFilterTypes(),
    filtersStore.getPaymentStatuses(),
    getMaxPaymentAmount(),
  ]);
  onSetFilters();
});

// methods
const closePaymentDialog = async () => {
  addPaymentModalOpen.value = false;
};

const addAdditionalFilterStates = (
  additionalFilterStates: FilterStateModel[],
) => {
  filterStates.value.push(...additionalFilterStates);
};

const onSelectConsignationFilterType = (newValue: number) => {
  filtersStore.selectedConsignationFilterType = newValue;
};

const onApplyDateRange = (value: Record<"fromDate" | "toDate", string>) => {
  dateRange.value = value;
  filtersStore.selectedDateRange = value;
};

const onSetFilters = () => {
  clientsPaymentStore.setPage(1);
  clientsPaymentStore.params.payment_amount.from_value =
    filtersStore.paymentAmountRange[0];
  clientsPaymentStore.params.payment_amount.to_value =
    filtersStore.paymentAmountRange[1];
  clientsPaymentStore.params.consignation_filter_type =
    filtersStore.selectedConsignationFilterType;
  clientsPaymentStore.setNullPaymentIdentities();
  clientsPaymentStore.params.filter = [
    {
      field: "branch_id",
      value: filtersStore.selectedBranches,
    },
    {
      field: "agent_id",
      value: filtersStore.selectedAgents,
    },
    {
      field: "territory_id",
      value: filtersStore.selectedTerritories,
    },
    {
      field: "payment_courier_id",
      value: filtersStore.selectedExpeditors,
    },
    {
      field: "trade_direction_id",
      value: filtersStore.selectedTradeDirections,
    },
    {
      field: "currency_id",
      value: filtersStore.selectedCurrencies,
    },
    {
      field: "cash_box_id",
      value: filtersStore.selectedCashboxes,
    },
    {
      field: "payment_status",
      value: [filtersStore.selectedPaymentStatuses?.toString() || null],
    },
  ];
  clientsPaymentStore.params.date_range.from =
    filtersStore.selectedDateRange?.fromDate;
  clientsPaymentStore.params.date_range.to =
    filtersStore.selectedDateRange?.toDate;
};

const onClearFilter = () => {
  filtersStore.selectedBranches = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedCurrencies = [];
  filtersStore.selectedExpeditors = [];
  filtersStore.selectedCashboxes = [];
  filtersStore.selectedPaymentStatuses = null;
  filtersStore.selectedTradeDirections = [];
  filtersStore.paymentAmountRange[0] = 0;
  filtersStore.paymentAmountRange[1] = filtersStore.maxPaymentAmount;
  filtersStore.selectedConsignationFilterType = ConsignationFilterType.All;
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DropdownComponent.value.onClearFilter();
  DatePickerComponent.value?.onReset();
  onSetFilters();
};

const setMaxPaymentAmount = () => {
  filtersStore.paymentAmountRange[1] =
    filtersStore.maxPaymentAmount || 100000000;
  filtersStore.price.max = filtersStore.maxPaymentAmount;
};

const getMaxPaymentAmount = async () => {
  if (!filtersStore.maxPaymentAmount) {
    filtersStore.maxPaymentAmount = await clientsPaymentStore.getMaxAmount();
    setMaxPaymentAmount();
  }
};
<\/script>
`;export{e as default};
