const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="filter-content-header">
        <page-title20 :title="t('cash.expenses')" />
        <div class="filter-btn-group">
          <DatePicker
            ref="DatePickerComponent"
            default-preset="past-30-days"
            :initial-from-date="initialFromDate"
            :initial-to-date="initialToDate"
            :label="t('cash.expense_date')"
            tomorrow-preset
            @onApply="onChangeDateRange"
          />
          <m-btn
            v-if="hasAccess2NavigateToExpenditure"
            group="blue"
            @click="navigateTo('/settings/expenditure')"
          >
            {{ t("column.add_category") }}
          </m-btn>
          <filter-checkbox-bar-btn
            :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
            :storage-key="expensesFilterStates"
            @update="filtersStore.updateFilterStates($event, filterStates)"
          />
          <m-btn
            v-if="hasAccess2CreateOtherExpense"
            @click="cashExpenditureStore.expensesShow = true"
            >{{ t("clients.add") }}</m-btn
          >
        </div>
      </div>

      <div class="filter-content">
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filterStates="filtersStore.checkedFilterStates(filterStates)"
          @onOpenDropdown="filtersStore.onOpenDropdown"
          @search="filtersStore.onSearchDropdown"
        />
        <flex-row class="submit-item">
          <m-btn
            @click="onSetFilters"
            :loading="
              cashExpenditureStore.isLoading &&
              !cashExpenditureStore.isFilterLoading
            "
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
      <div v-if="cashExpenditureStore.expensesShow">
        <DashboardCashboxExpensesDialog />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="cashExpenditureStore.modalErrorData">
        <DashboardCashboxExpensesErrorModal />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import type { DatePicker, DropdownsByFilterStates } from "#components";
import { useI18n } from "vue-i18n";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";
import { expensesFilterStates } from "~/variable/column-constants";
import { navigateTo } from "#app";

// Store
const cashExpenditureStore = useCashExpenses("main");
const filtersStore = useFiltersStore("/dashboard/cashbox/expenses");
const DropdownComponent = ref<typeof DropdownsByFilterStates>();
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate);
const DatePickerComponent = ref<typeof DatePicker | null>(null);

// accesses
const { hasAccess2CreateOtherExpense, hasAccess2NavigateToExpenditure } =
  useCashboxAccess();

// states
const { t } = useI18n();

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, expensesFilterStates);
};

const filterStates = ref([
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
  {
    name: t("column.category"),
    key: "fond",
    get data() {
      return filtersStore.fond || [];
    },
    get getSelectedData() {
      return filtersStore.selectedFond;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedFond = value;
    },
    checked: isChecked("fond"),
  },
  {
    name: t("settings.category_group"),
    key: "expenditure",
    get data() {
      return filtersStore.expenditure || [];
    },
    get getSelectedData() {
      return filtersStore.selectedExpenditure;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedExpenditure = value;
    },
    checked: isChecked("expenditure"),
  },
]);

const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);
// methods

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedCurrencies.length ||
    filtersStore.selectedExpenditure.length ||
    filtersStore.selectedFond.length ||
    filtersStore.selectedCashboxes.length
  );
});

const onClearFilter = () => {
  cashExpenditureStore.setPage(1);
  filtersStore.selectedCurrencies = [];
  filtersStore.selectedFond = [];
  filtersStore.selectedExpenditure = [];
  filtersStore.selectedCashboxes = [];
  DropdownComponent.value.onClearFilter();
  DatePickerComponent.value!.onReset();
  onSetFilters();
};

const onSetFilters = async () => {
  cashExpenditureStore.setNullExpenseIds();
  if (filtersStore.selectedDateRange) {
    cashExpenditureStore.params.date_time_range = {
      from: filtersStore.selectedDateRange.fromDate,
      to: filtersStore.selectedDateRange.toDate,
    };
  }
  onAddFieldToFilter(
    cashExpenditureStore.params,
    "currency_id",
    filtersStore.selectedCurrencies,
  );
  onAddFieldToFilter(
    cashExpenditureStore.params,
    "expense_type_id",
    filtersStore.selectedFond,
  );
  onAddFieldToFilter(
    cashExpenditureStore.params,
    "expense_category_id",
    filtersStore.selectedExpenditure,
  );
  onAddFieldToFilter(
    cashExpenditureStore.params,
    "cash_box_id",
    filtersStore.selectedCashboxes,
  );
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

// hooks

onMounted(() => {
  onSetFilters();
});
<\/script>

<style scoped>
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
}
</style>
`;export{e as default};
