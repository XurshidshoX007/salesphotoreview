const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <div class="filter-content-title">
        <page-title :title="t('sidebar.rejections')" />
        <div class="create-button-mobile">
          <filter-checkbox-bar-btn
            device="mobile"
            :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
            :storage-key="orderRefusalsFilterStates"
            @update="filtersStore.updateFilterStates($event, filterStates)"
          />
        </div>
      </div>
      <div class="filter-btn-group">
        <DatePicker
          ref="DatePickerComponent"
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          default-preset="today"
          @onApply="onApplyDate"
        />
        <div class="create-button-desktop">
          <filter-checkbox-bar-btn
            device="desktop"
            :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
            :storage-key="orderRefusalsFilterStates"
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
        :filter-storage-key="orderRefusalsFilterStates"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
      <flex-row class="submit-item">
        <m-btn
          @click="onApplyFilters"
          :loading="
            employeeRejectsStore.isLoading &&
            !employeeRejectsStore.isLoadingLoading
          "
          class="w-full h-10"
          >{{ t("apply") }}</m-btn
        >
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
import { useI18n } from "vue-i18n";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { orderRefusalsFilterStates } from "~/variable/column-constants";

// store
const employeeRejectsStore = useEmployeeRejectsStore("main");
const filtersStore = useFiltersStore("orders/refusals");

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// states
const { t } = useI18n();

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, orderRefusalsFilterStates);
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
    name: t("settings_sidebar.reasons_for_refusal"),
    key: "rejects",
    get data() {
      return filtersStore.rejects || [];
    },
    get getSelectedData() {
      return filtersStore.selectedRejects;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedRejects = value;
    },
    checked: isChecked("rejects"),
  },
]);

const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);

const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

// hooks
onMounted(async () => {
  onApplyFilters();
});

// methods
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[]
) => {
  filterStates.value.push(...territoryFilterStates);
};

const onApplyDate = (value: any) => {
  filtersStore.selectedDateRange = value;
};

const onApplyFilters = () => {
  employeeRejectsStore.params.branch_id_arr = filtersStore.selectedBranches;
  employeeRejectsStore.params.agent_id_arr = filtersStore.selectedAgents;
  employeeRejectsStore.params.territory_id_arr =
    filtersStore.selectedTerritories;
  employeeRejectsStore.params.client_category_id_arr =
    filtersStore.selectedClientCategories;
  employeeRejectsStore.params.reject_id_arr = filtersStore.selectedRejects;
  employeeRejectsStore.params.date_range!.from =
    filtersStore.selectedDateRange?.fromDate;
  employeeRejectsStore.params.date_range!.to =
    filtersStore.selectedDateRange?.toDate;
};

const onClearFilter = () => {
  filtersStore.selectedBranches = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedClientCategories = [];
  filtersStore.selectedRejects = [];
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DropdownComponent.value!.onClearFilter();
  DatePickerComponent.value?.onReset();
  onApplyFilters();
};

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedRejects.length
  );
});
<\/script>
`;export{e as default};
