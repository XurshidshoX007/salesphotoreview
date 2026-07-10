const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title20 :title="t('customer_balances.customer_balances')" />
      <div class="filter-btn-group">
        <d-input-date-picker
          :value="balanceAsOfDate || undefined"
          :label="t('labels.balance_as_of_date')"
          without-default
          clearable
          @change="onSelectBalanceDate"
        />
        <div class="wdr-fit">
          <d-input-date-picker
            without-time
            :value="dateTimeFrom || undefined"
            without-default
            :title="t('column.term_from')"
            :label="t('column.consignment_deadline_date')"
            @change="dateTimeFrom = $event"
          />
        </div>
        <div class="w-fit">
          <d-input-date-picker
            without-time
            :value="dateTimeTo || undefined"
            without-default
            :label="t('column.consignment_deadline_date')"
            :title="t('column.term_to')"
            @change="dateTimeTo = $event"
          />
        </div>
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="clientBalancesFilterStates"
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
        :filter-storage-key="clientBalancesFilterStates"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
      <flex-row class="submit-item">
        <m-btn
          :loading="
            clientsBalancesStore.loading ||
            clientsBalancesStore.loadingFilter ||
            clientsBalancesStore.isSubBalanceCardsLoading
          "
          @click="onSetFilters"
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
  DropdownsByFilterStates,
  TerritoryTreeDropdowns,
} from "#components";
import { clientBalancesFilterStates } from "~/variable/column-constants";
import { useI18n } from "vue-i18n";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";

// Store
const clientsBalancesStore = useClientsBalancesStore("main");
const filtersStore = useFiltersStore("/dashboard/cashbox/customer-balances");

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// emits
const emit = defineEmits(["refreshFilters"]);

// states
const { t } = useI18n();
const dateTimeFrom = ref<string | null>(null);
const dateTimeTo = ref<string | null>(null);
const balanceAsOfDate = ref<string | null>(null);

const booleanIdSelectData = ref({
  items: [
    {
      name: t("column.all_bills"),
      id: null,
    },
    {
      name: t("column.valid_bills"),
      id: true,
    },
    {
      name: t("column.invalid_bills"),
      id: false,
    },
  ],
});

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, clientBalancesFilterStates);
};

const filterStates = ref<FilterStateModel[]>([
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
    name: t("sidebar.supervisor"),
    key: "supervisors",
    get data() {
      return filtersStore.supervisors || [];
    },
    get getSelectedData() {
      return filtersStore.selectedSupervisors;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedSupervisors = value;
    },
    checked: isChecked("supervisors"),
  },
  {
    name: t("users.agents.agent"),
    key: "agent-dropdown",
    get data() {
      return filtersStore.agents;
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
    name: t("column.total_balance"),
    key: "totalBalance",
    get data() {
      return filtersStore.totalBalance || [];
    },
    get getSelectedData() {
      return filtersStore.selectedTotalBalance;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedTotalBalance = value;
    },
    checked: isChecked("totalBalance"),
  },
  {
    name: t("column.agents_with_invalid_accounts"),
    key: "invalid_bill",
    data: booleanIdSelectData.value,
    get getSelectedData() {
      return filtersStore.selectedClientEmployee;
    },
    set setSelectedData(value: boolean | null) {
      filtersStore.selectedClientEmployee = value;
    },
    isSingleSelect: true,
    checked: isChecked("invalid_bill"),
  },
]);

// hooks

const isFilterClearable = computed(() => {
  return !(
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedExpeditors.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedTradeDirections.length ||
    filtersStore.selectedSupervisors.length ||
    filtersStore.selectedTotalBalance.length > 1 ||
    filtersStore.selectedActiveStatus !== null ||
    filtersStore.selectedClientEmployee !== null ||
    dateTimeTo.value !== null ||
    dateTimeFrom.value !== null ||
    balanceAsOfDate.value !== null
  );
});

// methods
const onSelectBalanceDate = (val: string) => {
  balanceAsOfDate.value = val;
};

const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[],
) => {
  filterStates.value.push(...territoryFilterStates);
};

const onClearFilter = () => {
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedExpeditors = [];
  filtersStore.selectedClientCategories = [];
  filtersStore.selectedTradeDirections = [];
  filtersStore.selectedSupervisors = [];
  filtersStore.selectedTotalBalance = [1];
  filtersStore.selectedActiveStatus = null;
  filtersStore.selectedClientEmployee = null;
  dateTimeFrom.value = null;
  dateTimeTo.value = null;
  balanceAsOfDate.value = null;
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DropdownComponent.value?.onClearFilter();
  onSetFilters();
};

const onSetFilters = () => {
  clientsBalancesStore.setNullMultipleDialog();
  clientsBalancesStore.tableForClientParams.page = 1;
  clientsBalancesStore.filterParams.territory_id_arr =
    filtersStore.selectedTerritories;
  clientsBalancesStore.filterParams.branch_id_arr =
    filtersStore.selectedBranches;
  clientsBalancesStore.filterParams.agent_id_arr =
    clientsBalancesStore.filterParams.client_category_id_arr =
      filtersStore.selectedClientCategories;
  clientsBalancesStore.filterParams.trade_direction_id_arr =
    filtersStore.selectedTradeDirections;
  clientsBalancesStore.filterParams.expeditor_id_arr =
    filtersStore.selectedExpeditors;
  clientsBalancesStore.filterParams.total_balance_type_arr =
    filtersStore.selectedTotalBalance;
  clientsBalancesStore.filterParams.is_active =
    filtersStore.selectedActiveStatus;
  clientsBalancesStore.filterParams.agent_id_arr = filtersStore.selectedAgents;
  clientsBalancesStore.filterParams.is_active =
    filtersStore.selectedActiveStatus;
  clientsBalancesStore.filterParams.balance_as_of_date = balanceAsOfDate.value;
  clientsBalancesStore.filterParams.supervisor_id_arr =
    filtersStore.selectedSupervisors;

  clientsBalancesStore.filterParams.term_range.from_value =
    dateTimeFrom.value || null;
  clientsBalancesStore.filterParams.term_range.to_value =
    dateTimeTo.value || null;

  const filter =
    clientsBalancesStore.filterParams!.filter?.filter(
      (item) => item.field !== "is_client_employee",
    ) || [];

  if (typeof filtersStore.selectedClientEmployee === "boolean") {
    filter.push({
      field: "is_client_employee",
      value: [String(filtersStore.selectedClientEmployee)],
    });
  }

  clientsBalancesStore.filterParams!.filter = filter;

  emit("refreshFilters");
};

onMounted(() => {
  onSetFilters();
});
<\/script>
`;export{e as default};
