const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <div class="filter-content-title">
        <page-title :title="t('sidebar.equipment')" />
      </div>
      <div class="filter-btn-group">
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="equipmentsFilterStates"
          @update="filtersStore.updateFilterStates($event, filterStates)"
        />
        <DatePicker
          ref="DatePickerComponent"
          :label="t('column.date')"
          default-preset="this-month"
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          without-time
          @onApply="onChangeDateRange"
        />
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
        :filter-storage-key="equipmentsFilterStates"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
      <flex-row class="submit-item">
        <m-btn
          @click="onSetFilters"
          :loading="
            equipmentStore.isDataLoading && !equipmentStore.isDataFilterLoading
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
// Store
import type {
  DatePicker,
  DropdownsByFilterStates,
  TerritoryTreeDropdowns,
} from "#components";
import { useI18n } from "vue-i18n";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { equipmentsFilterStates } from "~/variable/column-constants";

// store
const equipmentStore = useClientsEquipmentStore("main");
const filtersStore = useFiltersStore("/clients/equipments");

// Child-components
const DropdownComponent = ref<InstanceType<
  typeof DropdownsByFilterStates
> | null>(null);

const DatePickerComponent = ref<InstanceType<typeof DatePicker> | null>(null);

const TerritoryTreeDropdownsComponent = ref<InstanceType<
  typeof TerritoryTreeDropdowns
> | null>(null);

// States
const { t } = useI18n();

const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);

const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

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
]);

// hooks
const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedInventoryTypes.length
  );
});

onMounted(() => onSetFilters());

// methods
function isChecked(key: string) {
  return filtersStore.isCheckedFilterState(key, equipmentsFilterStates);
}

const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[]
) => {
  filterStates.value.push(...territoryFilterStates);
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onClearFilter = () => {
  equipmentStore.setPage(1);
  filtersStore.selectedBranches = [];
  filtersStore.selectedInventoryTypes = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedAgents = [];
  DropdownComponent.value.onClearFilter();
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DatePickerComponent.value!.onReset();
  onSetFilters();
};

const onSetFilters = () => {
  equipmentStore.params.branch_id_arr = filtersStore.selectedBranches;
  equipmentStore.params.territory_id_arr = filtersStore.selectedTerritories;
  equipmentStore.params.inventory_type_id_arr =
    filtersStore.selectedInventoryTypes;
  equipmentStore.params.agent_id_arr = filtersStore.selectedAgents;
  equipmentStore.params.date_range!.from_value =
    filtersStore.selectedDateRange?.fromDate;
  equipmentStore.params.date_range!.to_value =
    filtersStore.selectedDateRange?.toDate;
};
<\/script>
`;export{e as default};
