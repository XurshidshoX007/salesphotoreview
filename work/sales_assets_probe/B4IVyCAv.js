const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <div class="filter-content-title">
        <page-title :title="t('clients.equipment_history')" />
      </div>
      <div class="filter-btn-group">
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="historyEquipmentFilterStates"
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
        :filter-storage-key="historyEquipmentFilterStates"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
      <flex-row class="submit-item">
        <m-btn
          @click="onSetFilters"
          :loading="equipmentStore.isHistoryListDataLoading"
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
import { historyEquipmentFilterStates } from "~/variable/column-constants";

// store
const equipmentStore = useClientsEquipmentStore("main");
const filtersStore = useFiltersStore("/clients/equipments/history-equipment");

// child-components
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
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedInventoryTypes.length
  );
});

// methods
function isChecked(key: string) {
  return filtersStore.isCheckedFilterState(key, historyEquipmentFilterStates);
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
  filtersStore.selectedInventoryTypes = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedAgents = [];
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DropdownComponent.value.onClearFilter();
  DatePickerComponent.value!.onReset();
  onSetFilters();
};

const onSetFilters = () => {
  equipmentStore.historyListParams.territory_id_arr =
    filtersStore.selectedTerritories;
  equipmentStore.historyListParams.inventory_type_id_arr =
    filtersStore.selectedInventoryTypes;
  equipmentStore.historyListParams.agent_id_arr = filtersStore.selectedAgents;
  equipmentStore.historyListParams.date_range!.from_value =
    filtersStore.selectedDateRange?.fromDate;
  equipmentStore.historyListParams.date_range!.to_value =
    filtersStore.selectedDateRange?.toDate;
};
<\/script>
`;export{e as default};
