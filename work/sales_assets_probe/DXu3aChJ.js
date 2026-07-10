const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title :title="t('sidebar.tara_report')" />
      <div class="filter-btn-group">
        <DatePicker
          ref="DatePickerComponent"
          default-preset="today"
          @onApply="onChangeDateRange"
        />
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="containerReportsFilterStates"
          @update="filtersStore.updateFilterStates($event, filterStates)"
        />
      </div>
    </div>
    <div class="filter-content">
      <DropdownsByFilterStates
        ref="DropdownComponent"
        :filterStates="filtersStore.checkedFilterStates(filterStates)"
        @onOpenDropdown="filtersStore.onOpenDropdown"
      />
      <TerritoryTreeDropdowns
        ref="TerritoryTreeDropdownsComponent"
        :filter-storage-key="containerReportsFilterStates"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
      <flex-row class="submit-item">
        <m-btn @click="onApplyFilters" :loading="clientsTaraStore.isLoading">{{
          t("apply")
        }}</m-btn>
        <ResetFilterBtn
          :is-filter-clearable="isFilterClearable"
          @onClearFilter="onClearFilter"
        />
      </flex-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DatePicker, TerritoryTreeDropdowns } from "#components";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { useI18n } from "vue-i18n";
import { containerReportsFilterStates } from "~/variable/column-constants";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";

// store
const filtersStore = useFiltersStore("/clients/container-reports");

// store
const clientsTaraStore = useClientsTaraStore("main");

// child-components
const DatePickerComponent = ref<typeof DatePicker>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// states
const { t } = useI18n();

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, containerReportsFilterStates);
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
    name: t("settings_sidebar.tara"),
    key: "taras",
    get data() {
      return filtersStore.taras || [];
    },
    get getSelectedData() {
      return filtersStore.selectedTaras;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedTaras = value;
    },
    checked: isChecked("taras"),
  },
]);

// hooks
const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedTaras.length
  );
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

const onClearFilter = () => {
  clientsTaraStore.setPage(1);
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedTaras = [];
  DatePickerComponent.value?.onReset();
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  onApplyFilters();
};

const onApplyFilters = () => {
  clientsTaraStore.params.filter = [
    {
      field: "agent_id",
      value: filtersStore.selectedAgents,
    },
  ];
  clientsTaraStore.params.territory_id_arr = filtersStore.selectedTerritories;
  clientsTaraStore.params.tara_id_arr = filtersStore.selectedTaras;
  if (filtersStore.selectedDateRange) {
    clientsTaraStore.params.date_range.from_value =
      filtersStore.selectedDateRange.fromDate?.split("T")[0];
    clientsTaraStore.params.date_range.to_value =
      filtersStore.selectedDateRange.toDate?.split("T")[0];
  }
};
<\/script>
`;export{e as default};
