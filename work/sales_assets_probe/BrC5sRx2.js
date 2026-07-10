const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="filter-content-header">
        <page-title20 :title="t('cash.client_expenses')" />
        <div class="filter-btn-group">
          <DatePicker
            ref="DatePickerComponent"
            default-preset="today"
            tomorrow-preset
            :initial-from-date="initialFromDate"
            :initial-to-date="initialToDate"
            @onApply="onChangeDateRange"
          />
          <filter-checkbox-bar-btn
            :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
            :storage-key="expensesPaymentFilterStates"
            @update="filtersStore.updateFilterStates($event, filterStates)"
          />
          <m-btn
            v-if="hasAccess2CreateClientExpensePayment"
            @click="openExpenseModal"
            >{{ t("clients.add") }}
          </m-btn>
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
          :filterStorageKey="expensesPaymentFilterStates"
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
            :filter-storage-key="expensesPaymentFilterStates"
            @on-range-amount="filtersStore.paymentAmountRange = $event"
            @addSliderFilterState="addAdditionalFilterStates"
          />
        </div>
        <flex-row class="submit-item">
          <m-btn
            :loading="
              cashExpenditureStore.isDataTableLoading &&
              !cashExpenditureStore.isDataFilterLoading
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
      <div v-if="isOpenExpensesDialog">
        <ClientsExpensePaymentClientExpensesDialog
          @closeDialog="closeExpenseModal"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="cashExpenditureStore.modalErrorData">
        <ClientsExpensePaymentExpenseErrorModal
          @refresh="cashExpenditureStore.refresh()"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import type {
  DropdownsByFilterStates,
  DatePicker,
  TerritoryTreeDropdowns,
} from "#components";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { useI18n } from "vue-i18n";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";
import {
  expensesPaymentFilterStates,
  sliderSummaFromToState,
} from "~/variable/column-constants";

// Store
const cashExpenditureStore = useClientsExpensePaymentStore("main");
const filtersStore = useFiltersStore("clients/expense-payment");

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// states
const { hasAccess2CreateClientExpensePayment } = useCashboxAccess();
const { t } = useI18n();
const isOpenExpensesDialog = ref<boolean>(false);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, expensesPaymentFilterStates);
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
    name: t("dashboard.forwarders"),
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
    name: t("column.client"),
    key: "clients",
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
      await filtersStore.onLoadElseClients();
    },
    checked: isChecked("clients"),
  },
  {
    name: t("column.type"),
    key: "operation",
    get data() {
      return filtersStore.dateOperations || [];
    },
    get getSelectedData() {
      return filtersStore.selectedDateOperation;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedDateOperation = value;
    },
    isSingleSelect: true,
    checked: isChecked("operation"),
  },
  {
    name: t("column.cash"),
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
    isFilter: true,
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
]);

const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);

const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

// hooks
onMounted(async () => {
  await getMaxPaymentAmount();
  await filtersStore.getProductMoveDate();
  filtersStore.selectedDateOperation = filtersStore.dateOperations.items[0].id;
  await onSetFilters();
});

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedCurrencies.length ||
    filtersStore.selectedExpeditors.length ||
    filtersStore.selectedCashboxes.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.paymentAmountRange[0] !== 0 ||
    filtersStore.paymentAmountRange[1] !== filtersStore.maxPaymentAmount
  );
});

// methods
const addAdditionalFilterStates = (
  additionalFilterStates: FilterStateModel[],
) => {
  filterStates.value.push(...additionalFilterStates);
};

const onClearFilter = () => {
  cashExpenditureStore.setPage(1);
  filtersStore.selectedBranches = [];
  filtersStore.selectedCurrencies = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedCashboxes = [];
  filtersStore.selectedExpeditors = [];
  filtersStore.selectedAgents = [];
  filtersStore.paymentAmountRange[0] = 0;
  filtersStore.paymentAmountRange[1] = filtersStore.maxPaymentAmount;
  DropdownComponent.value.onClearFilter();
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DatePickerComponent.value?.onReset();
  onSetFilters();
};

const onSetFilters = async () => {
  if (filtersStore.selectedDateRange) {
    cashExpenditureStore.params.date_filter = {
      range: {
        from: filtersStore.selectedDateRange?.fromDate,
        to: filtersStore.selectedDateRange?.toDate,
      },
      filter_type: filtersStore.selectedDateOperation,
    };
  }
  cashExpenditureStore.params.payment_amount_range.from_value =
    filtersStore.paymentAmountRange[0];
  cashExpenditureStore.params.payment_amount_range.to_value =
    filtersStore.paymentAmountRange[1];
  cashExpenditureStore.params.branch_id_arr = filtersStore.selectedBranches;
  cashExpenditureStore.params.agent_id_arr = filtersStore.selectedAgents;
  cashExpenditureStore.params.client_id_arr = filtersStore.selectedClients;
  cashExpenditureStore.params.territory_id_arr =
    filtersStore.selectedTerritories;
  cashExpenditureStore.params.cash_box_id_arr = filtersStore.selectedCashboxes;
  cashExpenditureStore.params.currency_id_arr = filtersStore.selectedCurrencies;
  cashExpenditureStore.params.expeditor_id_arr =
    filtersStore.selectedExpeditors;
};

const setMaxPaymentAmount = () => {
  filtersStore.paymentAmountRange[1] = filtersStore.maxPaymentAmount;
  filtersStore.price.max = filtersStore.maxPaymentAmount;
};

const getMaxPaymentAmount = async () => {
  if (!filtersStore.maxPaymentAmount) {
    filtersStore.maxPaymentAmount = await cashExpenditureStore.getMaxAmount();
    setMaxPaymentAmount();
  }
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const openExpenseModal = () => {
  isOpenExpensesDialog.value = true;
};
const closeExpenseModal = () => {
  isOpenExpensesDialog.value = false;
};
<\/script>
`;export{e as default};
