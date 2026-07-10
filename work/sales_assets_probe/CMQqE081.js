const e=`<template>
  <div>
    <div v-show="allowToCreate && !allowToList" class="w-full flex justify-end">
      <m-btn @click="addPaymentModalOpen = true" class="w-53">{{
        t("clients.add")
      }}</m-btn>
    </div>
    <div class="filter-content-container">
      <div class="filter-content-header">
        <page-title20 :title="t('cash.initial_client_balance')" />
        <div class="filter-btn-group">
          <m-btn group="outlined" @click="onOpenImportsDialog">
            <icon-imports />
            {{ t("clients.import_from_excel") }}
          </m-btn>
          <DatePicker
            ref="DatePickerComponent"
            tomorrow-preset
            default-preset="this-month"
            :initial-from-date="initialFromDate"
            :initial-to-date="initialToDate"
            @onApply="onChangeDateRange"
          />
          <filter-checkbox-bar-btn
            :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
            :storage-key="initialBalanceClientFilterStates"
            @update="filtersStore.updateFilterStates($event, filterStates)"
          />
          <m-btn v-show="allowToCreate" @click="addPaymentModalOpen = true"
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
        <flex-row class="submit-item">
          <m-btn
            :loading="
              clientsInitialBalanceStore.isLoading &&
              !clientsInitialBalanceStore.isFilterLoading
            "
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
      <div v-if="excelDialog">
        <DashboardCashboxInitialBalanceClientsExcelImportDialog
          @close-dialog="onCloseImportsDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="clientsInitialBalanceStore.excelErrorData">
        <DashboardCashboxInitialBalanceClientsExcelErrorDialog
          @close-dialog="closeErrorDialog"
        />
      </div>
    </transition>

    <transition name="modal">
      <div v-if="clientsInitialBalanceStore.excelFailedResponse">
        <DashboardCashboxInitialBalanceClientsExcelErrorConfirmDialog
          @close-dialog="closeExcelFailedDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="addPaymentModalOpen">
        <DashboardCashboxInitialBalanceClientsAddPaymentDialog
          :modal-name="t('clients.add')"
          @closeDialog="importAddPaymentDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import type { DatePicker, DropdownsByFilterStates } from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import { initialBalanceClientFilterStates } from "~/variable/column-constants";

// stores
const filtersStore = useFiltersStore("orders/orders");
const clientsInitialBalanceStore = useClientsInitialBalanceStore("main");
// child components
const DropdownComponent = ref<typeof DropdownsByFilterStates>(null);
const DatePickerComponent = ref<typeof DatePicker>(null);

// props
const props = defineProps({
  allowToCreate: Boolean,
  allowToList: Boolean,
});

// state
const { t } = useI18n();
const excelDialog = ref<boolean>(false);
const addPaymentModalOpen = ref<boolean>(false);

const initialFromDate = ref<string | null>(
  filtersStore.selectedDateRange?.fromDate || null,
);
const initialToDate = ref<string | null>(
  filtersStore.selectedDateRange?.toDate || null,
);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(
    key,
    initialBalanceClientFilterStates,
  );
};

let filterStates = ref([
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
    name: t("sidebar.clients"),
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
    key: "initial-payment",
    get data() {
      return filtersStore.initialBalancePaymentType || [];
    },
    get getSelectedData() {
      return filtersStore.selectedInitialPaymentTypes;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedInitialPaymentTypes = value;
    },
    checked: isChecked("initial-payment"),
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

onMounted(() => onApplyFilter());

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedClients.length ||
    filtersStore.selectedCashboxes.length ||
    filtersStore.selectedTradeDirections.length ||
    filtersStore.selectedCurrencies.length ||
    filtersStore.selectedInitialPaymentTypes.length
  );
});

// methods
function importAddPaymentDialog() {
  addPaymentModalOpen.value = false;
}

const onOpenImportsDialog = () => {
  excelDialog.value = true;
};

const closeErrorDialog = () => {
  clientsInitialBalanceStore.excelErrorData = null;
};

const closeExcelFailedDialog = () => {
  clientsInitialBalanceStore.excelFailedResponse = null;
};

const onCloseImportsDialog = () => {
  excelDialog.value = false;
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onApplyFilter = () => {
  clientsInitialBalanceStore.params.page = 1;
  clientsInitialBalanceStore.params.branch_id_arr = filtersStore.selectedBranches;
  clientsInitialBalanceStore.params.client_id_arr = [
    ...filtersStore.selectedClients,
  ];
  clientsInitialBalanceStore.params.agent_id_arr = filtersStore.selectedAgents;
  clientsInitialBalanceStore.params.trade_direction_id_arr =
    filtersStore.selectedTradeDirections;
  clientsInitialBalanceStore.params.cash_box_id_arr =
    filtersStore.selectedCashboxes;
  clientsInitialBalanceStore.params.currency_id_arr =
    filtersStore.selectedCurrencies;
  clientsInitialBalanceStore.params.type_arr =
    filtersStore.selectedInitialPaymentTypes;
  clientsInitialBalanceStore.params.date_range!.from =
    filtersStore.selectedDateRange?.fromDate;
  clientsInitialBalanceStore.params.date_range!.to =
    filtersStore.selectedDateRange?.toDate;
};

const onClearFilter = () => {
  clientsInitialBalanceStore.setPage(1);
  DatePickerComponent.value.onReset();
  filtersStore.selectedBranches = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedCurrencies = [];
  filtersStore.selectedCashboxes = [];
  filtersStore.selectedTradeDirections = [];
  filtersStore.selectedClients = [];
  filtersStore.selectedInitialPaymentTypes = [];
  DropdownComponent.value.onClearFilter();
  DatePickerComponent.value?.onReset();
  onApplyFilter();
};
<\/script>
`;export{e as default};
