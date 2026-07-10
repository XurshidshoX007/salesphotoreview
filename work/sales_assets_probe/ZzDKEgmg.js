const e=`<!-- components/clients/customer-maps/FilterColumn.vue -->
<template>
  <flex-col class="gap-5">
    <DropdownsByFilterStates
      ref="dropdownRef"
      :filter-states="filterStates"
      @onOpenDropdown="filtersStore.onOpenDropdown"
    />

    <TerritoryTreeDropdowns
      ref="territoryRef"
      @onSelect="filtersStore.selectedTerritories = $event"
      @pass-territory-filter-states="addTerritoryFilterStates"
    />

    <flex-row class="h-full justify-end items-end gap-2">
      <m-btn
        class="w-full"
        :loading="clientsMapStore.loading"
        @click="applyFilters"
      >
        {{ t("apply") }}
      </m-btn>

      <ResetFilterBtn
        :is-filter-clearable="!hasActiveFilters"
        @onClearFilter="clearFilters"
      />
    </flex-row>
  </flex-col>
</template>

<script setup lang="ts">
import type {
  DropdownsByFilterStates,
  TerritoryTreeDropdowns,
} from "#components";
import { useI18n } from "vue-i18n";
import { useClientMapStore } from "~/stores/clients/clients-map/clients-map.store";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { StateFilterType } from "~/variable/static-constants";

const clientsMapStore = useClientMapStore("main");
const filtersStore = useFiltersStore("clients/customer-maps/");
const { t } = useI18n();

// Refs
const dropdownRef = ref<typeof DropdownsByFilterStates | null>(null);
const territoryRef = ref<typeof TerritoryTreeDropdowns | null>(null);

// State
const isEquipment = ref<boolean>(false);

const equipmentOptions = {
  items: [
    { name: t("labels.with_equipment"), id: true },
    { name: t("labels.without_equipment"), id: false },
  ],
};

const filterStates = ref<FilterStateModel[]>([
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
  },
  {
    name: t("dashboard.agents"),
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
  },
  {
    name: t("labels.categories"),
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
  },
  {
    name: t("settings_sidebar.client_type"),
    key: "client-types",
    get data() {
      return filtersStore.clientTypes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedClientTypes;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedClientTypes = value;
    },
  },
  {
    name: t("labels.days"),
    key: "days",
    get data() {
      return filtersStore.days || [];
    },
    get getSelectedData() {
      return filtersStore.selectedDays;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedDays = value;
    },
  },
  {
    name: t("column.status"),
    key: "filter-type",
    isSingleSelect: true,
    get data() {
      return filtersStore.stateFilterType || [];
    },
    get getSelectedData() {
      return filtersStore.selectedStateFilterType;
    },
    set setSelectedData(value: number) {
      filtersStore.selectedStateFilterType = value;
    },
  },
  {
    name: t("labels.equipment"),
    key: "isEquipment",
    isSingleSelect: true,
    data: equipmentOptions,
    get getSelectedData() {
      return isEquipment.value;
    },
    set setSelectedData(value: boolean) {
      isEquipment.value = value;
    },
  },
]);

// Computed
const hasActiveFilters = computed(() => {
  return (
    filtersStore.selectedBranches.length > 0 ||
    filtersStore.selectedDays.length > 0 ||
    filtersStore.selectedTerritories.length > 0 ||
    filtersStore.selectedAgents.length > 0 ||
    filtersStore.selectedClientCategories.length > 0 ||
    filtersStore.selectedClientTypes.length > 0 ||
    filtersStore.selectedStateFilterType !== StateFilterType.All ||
    isEquipment.value !== false
  );
});

// Methods
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[],
) => {
  filterStates.value.push(...territoryFilterStates);
};

const applyFilters = () => {
  clientsMapStore.params.branch_id_arr = [...filtersStore.selectedBranches];
  clientsMapStore.params.agent_id_arr = [...filtersStore.selectedAgents];
  clientsMapStore.params.visit_day_arr = [...filtersStore.selectedDays];
  clientsMapStore.params.territory_id_arr = [
    ...filtersStore.selectedTerritories,
  ];
  clientsMapStore.params.client_category_id_arr = [
    ...filtersStore.selectedClientCategories,
  ];
  clientsMapStore.params.client_type_id_arr = [
    ...filtersStore.selectedClientTypes,
  ];
  clientsMapStore.params.state_filter_type =
    filtersStore.selectedStateFilterType;
  clientsMapStore.params.has_inventory = isEquipment.value;
};

const clearFilters = () => {
  filtersStore.selectedBranches = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedDays = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedClientCategories = [];
  filtersStore.selectedClientTypes = [];
  filtersStore.selectedStateFilterType = StateFilterType.All;
  isEquipment.value = false;

  dropdownRef.value?.onClearFilter();
  territoryRef.value?.clearSelectedItems();

  applyFilters();
};

// Lifecycle
onMounted(async () => {
  filtersStore.selectedStateFilterType = StateFilterType.All;
  await filtersStore.getFilterTypes();
});
<\/script>
`;export{e as default};
