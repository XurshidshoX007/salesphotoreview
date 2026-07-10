const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <div class="filter-content-title">
        <page-title size="xl" :title="t('filters.filter')" />
        <div class="create-button-mobile">
          <filter-checkbox-bar-btn
            device="mobile"
            :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
            :storage-key="orderCreateFilterStates"
            @update="filtersStore.updateFilterStates($event, filterStates)"
          />
        </div>
      </div>
      <div class="create-button-desktop">
        <filter-checkbox-bar-btn
          device="desktop"
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="orderCreateFilterStates"
          @update="filtersStore.updateFilterStates($event, filterStates)"
        />
      </div>
    </div>
    <div class="filter-content">
      <DropdownsByFilterStates
        ref="DropdownComponent"
        :filterStates="filtersStore.checkedFilterStates(filterStates)"
        storage-key="orderCreateFilterStates"
        @onOpenDropdown="filtersStore.onOpenDropdown"
        @search="filtersStore.onSearchDropdown"
      />
      <TerritoryTreeDropdowns
        ref="TerritoryTreeDropdownsComponent"
        :filter-storage-key="orderCreateFilterStates"
        @onSelect="setSelectedTerritories"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
      <flex-row class="submit-item">
        <m-btn
          :loading="
            createOrdersStore.isLoading && !createOrdersStore.isFilterLoading
          "
          class="w-full"
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
</template>

<script setup lang="ts">
import type {
  DropdownsByFilterStates,
  TerritoryTreeDropdowns,
} from "#components";
import { useI18n } from "vue-i18n";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { orderCreateFilterStates } from "~/variable/column-constants";

// Stores
const createOrdersStore = useCreateOrdersStore("main");
const filtersStore = useFiltersStore("/orders/orders?request=");

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// states
const { t } = useI18n();

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, orderCreateFilterStates);
};

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
    name: t("column.day"),
    key: "dayFilter",
    data: filtersStore.days,
    get getSelectedData() {
      return filtersStore.selectedDays;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedDays = value;
    },
    checked: isChecked("dayFilter"),
  },
]);

// methods
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[],
) => {
  filterStates.value.push(...territoryFilterStates);
};

const setSelectedTerritories = (selectedTerritories: string[]) => {
  filtersStore.selectedTerritories = selectedTerritories;
};

const onApplyFilter = () => {
  createOrdersStore.params.agent_id_arr = filtersStore.selectedAgents;
  createOrdersStore.params.territory_id_arr = [
    ...filtersStore.selectedTerritories,
  ];
  createOrdersStore.params.client_category_id_arr =
    filtersStore.selectedClientCategories;
  createOrdersStore.params.visit_day_arr = filtersStore.selectedDays;
};

const isFilterClearable = computed(() => {
  return !(
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedDays.length
  );
});

const onClearFilter = () => {
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedClientCategories = [];
  filtersStore.selectedDays = [];
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  DropdownComponent.value.onClearFilter();
  onApplyFilter();
};
<\/script>
`;export{e as default};
