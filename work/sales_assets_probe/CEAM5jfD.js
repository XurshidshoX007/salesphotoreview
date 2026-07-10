const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title20 title=" Фильтр" />
      <div class="filter-btn-group">
        <MonthPicker />
      </div>
    </div>
    <div class="filter-content">
      <DropdownsByFilterStates
        :filterStates="filterStates"
        @onOpenDropdown="filtersStore.onOpenDropdown"
        @search="filtersStore.onSearchDropdown"
      />
      <flex-row class="submit-item">
        <m-btn @click="onSetFilters">
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
// Store
import type { DropdownsByFilterStates } from "#components";
import { useI18n } from "vue-i18n";
import { getCheckedItemsByKey } from "~/utils/local-storage";
import { clientFilterStates } from "~/variable/column-constants";

const filtersStore = useFiltersStore("/clients/clients");
const { t } = useI18n();

const savedFilterStatesByKey = computed(
  // not in hooks to avoid before-init error
  (): Record<string, { name: string; checked: boolean }> => {
    const checkedFilters = getCheckedItemsByKey(clientFilterStates);
    return checkedFilters || {};
  }
);

const isChecked = (key: string) => {
  // not in methods to avoid before-init error
  if (savedFilterStatesByKey.value[key]?.checked === undefined) return true;
  return savedFilterStatesByKey.value[key]?.checked;
};
const filterStates = ref([
  {
    name: t("users.agents.agent"),
    key: "agent-dropdown",
    get data() {
      return filtersStore.agents || [];
    },
    get getSelectedData() {
      return filtersStore.selectedAgents;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedAgents = value;
    },
    checked: isChecked("agents"),
  },
  {
    name: t("settings_sidebar.product_category"),
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
    name: t("settings_sidebar.products"),
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
]);
// State
// Methods
const onSetFilters = () => {};

const isFilterClearable = computed(() => {
  return !(filtersStore.selectedInn !== null);
});

const onClearFilter = () => {};
<\/script>
`;export{e as default};
