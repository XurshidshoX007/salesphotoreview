const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <div class="filter-content-title">
        <page-title size="xl" :title="t('sidebar.clients')" />
        <div class="create-button-mobile">
          <nuxt-link
            v-show="allowToCreate"
            to="/clients/clients/create-clients"
          >
            <m-btn>
              {{ t("orders.add_client") }}
            </m-btn>
          </nuxt-link>
          <filter-checkbox-bar-btn
            device="mobile"
            :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
            :storage-key="clientFilterStates"
            @update="filtersStore.updateFilterStates($event, filterStates)"
          />
        </div>
      </div>
      <div class="filter-btn-group">
        <DatePicker
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          default-preset="past-3-year"
          ref="DatePickerComponent"
          @onApply="onChangeDateRange"
        />
        <div class="create-button-desktop">
          <filter-checkbox-bar-btn
            device="desktop"
            :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
            :storage-key="clientFilterStates"
            @update="filtersStore.updateFilterStates($event, filterStates)"
          />
          <nuxt-link
            v-show="allowToCreate"
            to="/clients/clients/create-clients"
          >
            <m-btn>
              {{ t("orders.add_client") }}
            </m-btn>
          </nuxt-link>
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
        ref="TerritoryTreeDropdownsComponent"
        :filter-storage-key="clientFilterStates"
        with-title
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
      <flex-row class="submit-item">
        <m-btn
          @click="onSetFilters"
          :loading="
            clientsStore.isDataTableLoading && !clientsStore.isDataFilterLoading
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
</template>

<script setup lang="ts">
import type {
  DatePicker,
  DropdownsByFilterStates,
  TerritoryTreeDropdowns,
} from "#components";
import { clientFilterStates } from "~/variable/column-constants";
import { useI18n } from "vue-i18n";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import { onAddFieldToFilter } from "~/utils/store-params";

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// Store
const clientsStore = useClientsStore("main");
const filtersStore = useFiltersStore("/clients/clients");

// props
const props = defineProps<{
  allowToCreate: boolean;
}>();

// state
const { t } = useI18n();
const isActiveClients = ref<number>(1);
const isWithPhone = ref<boolean | null>(null);
const isWithInventory = ref<boolean | null>(null);
const canOrderInDebt = ref<number>(0);
const canOrderWithConsignation = ref<number>(0);
const canOrderWithConsignationInDebtFilterType = ref<number>(0);
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);

const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const booleanIdSelectData = ref({
  items: [
    {
      name: t("filters.all"),
      id: null,
    },
    {
      name: t("filters.yes"),
      id: true,
    },
    {
      name: t("filters.no"),
      id: false,
    },
  ],
});

const activityData = ref({
  items: [
    {
      name: t("filters.all"),
      id: 2,
    },
    {
      name: t("active"),
      id: 1,
    },
    {
      name: t("not_active"),
      id: 0,
    },
  ],
});

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, clientFilterStates);
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
    name: t("settings.client_format"),
    key: "client-format",
    get data() {
      return filtersStore.clientFormat || [];
    },
    get getSelectedData() {
      return filtersStore.selectedClientFormat;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedClientFormat = value;
    },
    checked: isChecked("client-format"),
  },
  {
    name: t("settings_sidebar.sales_channel"),
    key: "sales-channel",
    get data() {
      return filtersStore.salesChanel || [];
    },
    get getSelectedData() {
      return filtersStore.selectedSalesChanel;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedSalesChanel = value;
    },
    checked: isChecked("sales-channel"),
  },
  {
    name: t("column.day"),
    key: "days",
    data: filtersStore.days,
    get getSelectedData() {
      return filtersStore.selectedDays;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedDays = value;
    },
    checked: isChecked("days"),
  },
  {
    name: t("settings_sidebar.client_type"),
    key: "client-types",
    isFilter: true,
    get data() {
      return filtersStore.clientTypes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedClientTypes;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedClientTypes = value;
    },
    checked: isChecked("client-types"),
  },
  {
    name: t("column.status"),
    key: "status",
    get data() {
      return activityData.value;
    },
    get getSelectedData() {
      return isActiveClients.value;
    },
    set setSelectedData(value: number) {
      isActiveClients.value = value;
    },
    isSingleSelect: true,
    checked: isChecked("status"),
  },
  {
    name: t("column.location"),
    key: "location",
    data: filtersStore.locations,
    get getSelectedData() {
      return filtersStore.selectedLocation;
    },
    set setSelectedData(value: boolean | null) {
      filtersStore.selectedLocation = value;
    },
    isSingleSelect: true,
    checked: isChecked("location"),
  },
  {
    name: t("column.type_equipment"),
    key: "inventory-types",
    get data() {
      return filtersStore.inventoryTypes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedInventoryTypes;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedInventoryTypes = value;
    },
    checked: isChecked("inventory-types"),
  },
  {
    name: t("column.inn"),
    key: "inn",
    data: filtersStore.inn,
    get getSelectedData() {
      return filtersStore.selectedInn;
    },
    set setSelectedData(value: boolean | null) {
      filtersStore.selectedInn = value;
    },
    isSingleSelect: true,
    checked: isChecked("inn"),
  },
  {
    name: t("filters.has_inventory"),
    key: "inventory",
    data: booleanIdSelectData.value,
    get getSelectedData() {
      return isWithInventory.value;
    },
    set setSelectedData(value: boolean | null) {
      isWithInventory.value = value;
    },
    isSingleSelect: true,
    checked: isChecked("inventory"),
  },
  {
    name: t("column.phone"),
    key: "phone",
    data: booleanIdSelectData.value,
    get getSelectedData() {
      return isWithPhone.value;
    },
    set setSelectedData(value: boolean | null) {
      isWithPhone.value = value;
    },
    isSingleSelect: true,
    checked: isChecked("phone"),
  },
  {
    name: t("filters.can_order_in_debt"),
    key: "in_debt",
    data: filtersStore.yesAllNoType,
    get getSelectedData() {
      return canOrderInDebt.value;
    },
    set setSelectedData(value: number) {
      canOrderInDebt.value = value;
    },
    isSingleSelect: true,
    checked: isChecked("in_debt"),
  },
  {
    name: t("column.can_order_with_consignation_in_debt_filter_type"),
    key: "can_order_with_consignation_in_debt_filter_type",
    data: filtersStore.yesAllNoType,
    get getSelectedData() {
      return canOrderWithConsignationInDebtFilterType.value;
    },
    set setSelectedData(value: number) {
      canOrderWithConsignationInDebtFilterType.value = value;
    },
    isSingleSelect: true,
    checked: isChecked("can_order_with_consignation_in_debt_filter_type"),
  },
  {
    name: t("filters.can_order_with_consignation"),
    key: "with_consignation",
    data: filtersStore.yesAllNoType,
    get getSelectedData() {
      return canOrderWithConsignation.value;
    },
    set setSelectedData(value: number) {
      canOrderWithConsignation.value = value;
    },
    isSingleSelect: true,
    checked: isChecked("with_consignation"),
  },
]);

// hooks

onMounted(async () => {
  await filtersStore.getYesNoAllFilterType();
  onSetFilters();
});

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

const withoutExpeditorsStates = computed(() => {
  return {
    items: filtersStore.expeditors
      ? [...unAttachExpeditor.value, ...filtersStore.expeditors.items]
      : [],
  };
});

const withoutAgentsStates = computed(() => {
  return {
    items: filtersStore.agents
      ? [...unAttachAgent.value, ...filtersStore.agents.items]
      : [],
  };
});

// methods
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[]
) => {
  filterStates.value.push(...territoryFilterStates);
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onSetFilters = () => {
  clientsStore.setNullMultipleDialog();
  clientsStore.params.branch_id_arr = filtersStore.selectedBranches;
  clientsStore.params.agent_id_arr = filtersStore.selectedAgents;
  clientsStore.params.territory_id_arr = filtersStore.selectedTerritories;
  clientsStore.params.client_format_id_arr = filtersStore.selectedClientFormat;
  clientsStore.params.client_category_id_arr =
    filtersStore.selectedClientCategories;
  clientsStore.params.days = filtersStore.selectedDays;
  clientsStore.params.expeditor_id_arr = filtersStore.selectedExpeditors;
  clientsStore.params.device_id_arr = filtersStore.selectedInventoryTypes;
  clientsStore.params.state_filter_type = isActiveClients.value;
  clientsStore.params.has_location = filtersStore.selectedLocation;
  clientsStore.params.has_inn = filtersStore.selectedInn;
  clientsStore.params.has_inventory = isWithInventory.value;
  clientsStore.params.can_order_with_consignation_filter_type =
    canOrderWithConsignation.value;
  clientsStore.params.can_order_with_consignation_in_debt_filter_type =
    canOrderWithConsignationInDebtFilterType.value;
  clientsStore.params.can_order_in_debt_filter_type = canOrderInDebt.value;
  clientsStore.params.sales_channel_id_arr = filtersStore.selectedSalesChanel;
  clientsStore.params.supervisor_id_arr = filtersStore.selectedSupervisors;
  clientsStore.params.has_phone = isWithPhone.value;
  onAddFieldToFilter(
    clientsStore.params,
    "type_id",
    filtersStore.selectedClientTypes
  );
  clientsStore.params.date_range!.from =
    filtersStore.selectedDateRange?.fromDate;
  clientsStore.params.date_range!.to = filtersStore.selectedDateRange?.toDate;
};

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedDays.length ||
    filtersStore.selectedExpeditors.length ||
    filtersStore.selectedInventoryTypes.length ||
    filtersStore.selectedClientFormat.length ||
    filtersStore.selectedSalesChanel.length ||
    filtersStore.selectedSupervisors.length ||
    filtersStore.selectedClientTypes.length ||
    filtersStore.selectedLocation !== null ||
    canOrderWithConsignationInDebtFilterType.value !== 0 ||
    canOrderWithConsignation.value !== 0 ||
    canOrderInDebt.value !== 0 ||
    isActiveClients.value !== 1 ||
    isWithPhone.value !== null ||
    isWithInventory.value !== null ||
    filtersStore.selectedInn !== null
  );
});

const onClearFilter = () => {
  clientsStore.setPage(1);
  filtersStore.selectedBranches = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedExpeditors = [];
  filtersStore.selectedInventoryTypes = [];
  filtersStore.selectedClientCategories = [];
  filtersStore.selectedClientFormat = [];
  filtersStore.selectedDays = [];
  filtersStore.selectedSalesChanel = [];
  filtersStore.selectedSupervisors = [];
  filtersStore.selectedClientTypes = [];
  filtersStore.selectedInn = null;
  filtersStore.selectedLocation = null;
  canOrderWithConsignationInDebtFilterType.value = 0;
  canOrderWithConsignation.value = 0;
  canOrderInDebt.value = 0;
  isActiveClients.value = 1;
  isWithPhone.value = null;
  isWithInventory.value = null;
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DropdownComponent.value.onClearFilter();
  DatePickerComponent.value?.onReset();
  onSetFilters();
};
<\/script>
`;export{e as default};
