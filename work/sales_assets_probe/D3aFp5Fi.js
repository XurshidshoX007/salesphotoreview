const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title20 :title="t('cash.customer_balance_by_consignation')" />
      <div class="filter-btn-group">
        <DatePicker
          ref="DatePickerComponent"
          :label="t('column.order_date')"
          default-preset="this-month"
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          @onApply="onApplyDateRange"
        />
        <div class="w-50">
          <d-input-date-picker
            without-time
            :value="dateTimeFrom"
            without-default
            :title="t('column.term_from')"
            @change="dateTimeFrom = $event"
          />
        </div>
        <div class="w-50">
          <d-input-date-picker
            without-time
            :value="dateTimeTo"
            without-default
            :title="t('column.term_to')"
            @change="dateTimeTo = $event"
          />
        </div>
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="clientBalancesByConsignationFilterStates"
          @update="filtersStore.updateFilterStates($event, filterStates)"
        />
      </div>
    </div>
    <div class="filter-content">
      <DropdownsByFilterStates
        :filter-states="filtersStore.checkedFilterStates(filterStates)"
        @onOpenDropdown="filtersStore.onOpenDropdown"
        @search="filtersStore.onSearchDropdown"
        ref="DropdownComponent"
      />
      <TerritoryTreeDropdowns
        ref="TerritoryTreeDropdownsComponent"
        :filter-storage-key="clientBalancesByConsignationFilterStates"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
      <flex-row class="submit-item">
        <m-btn
          @click="onSetFilters"
          :loading="
            clientsBalancesByConsignationStore.isDataLoading ||
            clientsBalancesByConsignationStore.loadingFilter
          "
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
} from "#components";
import { clientBalancesByConsignationFilterStates } from "~/variable/column-constants";
import { useI18n } from "vue-i18n";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { useClientsBalanceByConsignationStore } from "~/stores/dashboard/cashbox/client-balance-by-consignation/client-balance-by-consignation.store";

// Store
const clientsBalancesByConsignationStore =
  useClientsBalanceByConsignationStore("main");
const filtersStore = useFiltersStore(
  "/dashboard/cashbox/customer-balances/by-consignation",
);

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// emits
const emit = defineEmits(["refreshFilters"]);

// states
const { t } = useI18n();
const dateTimeFrom = ref<string | null>("");
const dateTimeTo = ref<string | null>("");
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);
const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(
    key,
    clientBalancesByConsignationFilterStates,
  );
};

const filterStates = ref([
  {
    name: t("settings_sidebar.branches"),
    key: "branches",
    get data() {
      return filtersStore.branches;
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
    name: t("column.category"),
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
    name: t("column.status"),
    key: "status",
    data: filtersStore.activeStatus,
    get getSelectedData() {
      return filtersStore.selectedActiveStatus;
    },
    set setSelectedData(value: boolean) {
      filtersStore.selectedActiveStatus = value;
    },
    isSingleSelect: true,
    checked: isChecked("status"),
  },
  {
    name: t("column.total_debt"),
    key: "totalBalance",
    get data() {
      return filtersStore.totalDebt || [];
    },
    get getSelectedData() {
      return filtersStore.selectedTotalBalance;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedTotalBalance = value;
    },
    checked: isChecked("totalBalance"),
  },
]);

// hooks
onMounted(() => {
  onApplyDateRangeForStTime();
  onSetFilters();
});

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedExpeditors.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedTradeDirections.length ||
    filtersStore.selectedTotalBalance.length > 1 ||
    !filtersStore.selectedTotalBalance.find((item) => item === 1) ||
    filtersStore.selectedActiveStatus !== null ||
    dateTimeTo.value !== "" ||
    dateTimeFrom.value !== ""
  );
});

// methods
const onApplyDateRange = (value: Record<"fromDate" | "toDate", string>) => {
  filtersStore.selectedDateRange = value;
};
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[],
) => {
  filterStates.value.push(...territoryFilterStates);
};

const onApplyDateRangeForStTime = () => {
  if (filtersStore.selectedDateRange) return;
  DatePickerComponent.value?.onApply();
};

const onClearFilter = () => {
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedTradeDirections = [];
  filtersStore.selectedExpeditors = [];
  filtersStore.selectedClientCategories = [];
  filtersStore.selectedTotalBalance = [1];
  filtersStore.selectedActiveStatus = null;
  dateTimeFrom.value = "";
  dateTimeTo.value = "";
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DropdownComponent.value.onClearFilter();
  DatePickerComponent.value?.onReset();
  onSetFilters();
};

const onSetFilters = () => {
  clientsBalancesByConsignationStore.filterParams.territory_id_arr =
    filtersStore.selectedTerritories;
  clientsBalancesByConsignationStore.filterParams.branch_id_arr =
    filtersStore.selectedBranches;
  clientsBalancesByConsignationStore.filterParams.agent_id_arr =
    clientsBalancesByConsignationStore.filterParams.client_category_id_arr =
      filtersStore.selectedClientCategories;
  clientsBalancesByConsignationStore.filterParams.trade_direction_id_arr =
    filtersStore.selectedTradeDirections;
  clientsBalancesByConsignationStore.filterParams.expeditor_id_arr =
    filtersStore.selectedExpeditors;
  clientsBalancesByConsignationStore.filterParams.total_balance_type_arr =
    filtersStore.selectedTotalBalance;
  clientsBalancesByConsignationStore.filterParams.is_active =
    filtersStore.selectedActiveStatus;
  clientsBalancesByConsignationStore.filterParams.agent_id_arr =
    filtersStore.selectedAgents;
  clientsBalancesByConsignationStore.filterParams.is_active =
    filtersStore.selectedActiveStatus;
  clientsBalancesByConsignationStore.filterParams.order_date_range.from =
    filtersStore.selectedDateRange?.fromDate;
  clientsBalancesByConsignationStore.filterParams.order_date_range.to =
    filtersStore.selectedDateRange?.toDate;
  clientsBalancesByConsignationStore.filterParams.term_range!.from_value =
    dateTimeFrom.value || null;
  clientsBalancesByConsignationStore.filterParams.term_range!.to_value =
    dateTimeTo.value || null;
};
<\/script>
`;export{e as default};
