const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title20 :title="t('filters.filter')" />

      <div class="filter-btn-group">
        <DatePicker
          ref="DatePickerComponent"
          default-preset="today"
          :initial-from-date="initialFromDate"
          @onApply="onChangeDateRange"
        />
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="bonusRetailClientFilterStates"
          @update="filtersStore.updateFilterStates($event, filterStates)"
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
        :filter-storage-key="bonusRetailClientFilterStates"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
      <flex-row class="submit-item">
        <m-btn
          @click="onSetFilters"
          :loading="
            (clientsRemainsStore.isLoadingByCategory ||
              clientsRemainsStore.isLoadingByProduct) &&
            !clientsRemainsStore.isLoadingByFilter
          "
          >Применить</m-btn
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
// Stores

import type {
  DatePicker,
  DropdownsByFilterStates,
  TerritoryTreeDropdowns,
} from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import moment from "moment";
import { useI18n } from "vue-i18n";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { bonusRetailClientFilterStates } from "~/variable/column-constants";

const clientsRemainsStore = useClientsRemainsStore("main");
const filtersStore = useFiltersStore("clients/bonuses-retail-outlets/");

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates>(null);
const DatePickerComponent = ref<typeof DatePicker>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// props
const props = defineProps({
  filterByActiveTab: Number,
});

// States
const { t } = useI18n();

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, bonusRetailClientFilterStates);
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
    name: t("column.category"),
    key: "product-category",
    get data() {
      return filtersStore.productCategory || [];
    },
    get getSelectedData() {
      return filtersStore.selectedProductCategorieis;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedProductCategorieis = value;
    },
    checked: isChecked("product-category"),
  },
  {
    name: t("settings.products"),
    key: "products",
    get data() {
      return filtersStore.products || [];
    },
    get getSelectedData() {
      return filtersStore.selectedProducts;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedProducts = value;
    },
    checked: isChecked("products"),
  },
  {
    name: t("settings_sidebar.price_type"),
    key: "price-type",
    isSingleSelect: true,
    get data() {
      return filtersStore.priceTypes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedPriceTypes;
    },
    set setSelectedData(value: string) {
      filtersStore.selectedSinglePriceTypes = value;
    },
    checked: isChecked("price-type"),
  },
]);
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
// hooks
const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedBranches.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedProductCategorieis.length ||
    filtersStore.selectedProducts.length ||
    filtersStore.selectedSinglePriceTypes !== null
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
  clientsRemainsStore.setPageByProduct(1);
  filtersStore.selectedBranches = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedProducts = [];
  filtersStore.selectedProductCategorieis = [];
  filtersStore.selectedSinglePriceTypes = null;
  DropdownComponent.value.onClearFilter();
  DatePickerComponent.value?.onReset();
  TerritoryTreeDropdownsComponent.value!.clearSelectedItems();
  onSetFilters();
};

const onSetFilters = () => {
  // props.filterByActiveTab  1 - byproduct, 2 - byCategory
  const params =
    props.filterByActiveTab === 1
      ? clientsRemainsStore.byProductParams
      : clientsRemainsStore.byCategoryParams;

  params.branch_id_arr = filtersStore.selectedBranches;
  params.agent_id_arr = filtersStore.selectedAgents;
  params.territory_id_arr = filtersStore.selectedTerritories;
  params.product_category_id_arr = filtersStore.selectedProductCategorieis;
  params.product_id_arr = filtersStore.selectedProducts;
  params.price_type_id_arr = filtersStore.selectedPriceTypes;
  params.date_range["from_value"] = moment(
    filtersStore.selectedDateRange?.fromDate
  ).format("YYYY-MM-DD"); // TO-DO: Delete moment after backend updates to Z format
  params.date_range["to_value"] = moment(
    filtersStore.selectedDateRange?.toDate
  ).format("YYYY-MM-DD");
};
<\/script>
`;export{e as default};
