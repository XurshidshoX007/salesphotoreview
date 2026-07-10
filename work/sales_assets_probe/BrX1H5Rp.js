const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="filter-content-header">
        <div class="filter-content-title">
          <page-title size="xl" :title="t('dashboard.dashboard_supervisor')" />
          <div class="create-button-mobile">
            <filter-checkbox-bar-btn
              device="mobile"
              :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
              :storage-key="dashboardFilterStates"
              @update="filtersStore.updateFilterStates($event, filterStates)"
            />
          </div>
        </div>
        <div class="filter-btn-group">
          <d-input-date-picker
            ref="DatePickerComponent"
            :value="selectedDate"
            without-time
            @change="onSelectDate"
          />
          <div class="create-button-desktop">
            <filter-checkbox-bar-btn
              device="desktop"
              :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
              :storage-key="dashboardFilterStates"
              @update="filtersStore.updateFilterStates($event, filterStates)"
            />
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
          :filter-storage-key="dashboardFilterStates"
          @onSelect="filtersStore.selectedTerritories = $event"
          @pass-territory-filter-states="addTerritoryFilterStates"
        />
        <flex-row class="submit-item">
          <m-btn @click="onApplyFilter">
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
      <div v-if="isClientsModalOpen">
        <OrdersCreateOrdersClientsTableWithFilter
          @closeDialog="isClientsModalOpen = false"
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
import { useI18n } from "vue-i18n";
import { dashboardFilterStates } from "~/variable/column-constants";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import moment from "moment/moment";

// stores
const filtersStore = useFiltersStore("dashboard/supervisor/filter");
//emits
const emit = defineEmits(["onSetFilters"]);
// child components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const RadioBtnComponent = ref<typeof RadioBtn | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// state
const { t } = useI18n();
const selectedDate = ref(moment().format("YYYY-MM-DD"));

const isClientsModalOpen = ref<boolean>(false);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, dashboardFilterStates);
};

const filterStates = ref<Array<FilterStateModel<object>>>([
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
    name: t("users.supervisors"),
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

onMounted(async () => {
  await filtersStore.getDateFilterTypes();
  onApplyFilter();
});

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    RadioBtnComponent.value?.isClearable() ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedSupervisors.length ||
    filtersStore.selectedTradeDirections.length ||
    filtersStore.selectedPriceTypes.length ||
    filtersStore.selectedCurrencies.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedWarehouses.length
  );
});

// methods
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel<object>[],
) => {
  filterStates.value.push(...territoryFilterStates);
};

const onSelectDate = (newDate: string) => {
  if (newDate === selectedDate.value) return;
  selectedDate.value = newDate;
};

const onApplyFilter = () => {
  const filterParams = {
    currency_id_arr: [...filtersStore.selectedCurrencies],
    territory_id_arr: filtersStore.selectedTerritories,
    supervisor_id_arr: filtersStore.selectedSupervisors,
    agent_id_arr: filtersStore.selectedAgents,
    trade_direction_id_arr: filtersStore.selectedTradeDirections,
    client_category_id_arr: filtersStore.selectedClientCategories,
    branch_id_arr: filtersStore.selectedBranches,
    date_range: {
      from: moment(selectedDate.value)
        .startOf("day")
        .utc()
        .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
      to: moment(selectedDate.value)
        .endOf("day")
        .utc()
        .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
    },
  };
  emit("onSetFilters", filterParams);
};

const onClearFilter = () => {
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedCurrencies = [];
  filtersStore.selectedClientCategories = [];
  filtersStore.selectedBranches = [];
  filtersStore.selectedSupervisors = [];
  filtersStore.selectedTradeDirections = [];
  DropdownComponent.value!.onClearFilter();
  DatePickerComponent.value?.onReset();
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  onApplyFilter();
};
<\/script>
`;export{e as default};
