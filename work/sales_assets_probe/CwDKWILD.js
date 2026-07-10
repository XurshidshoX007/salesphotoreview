const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title20 :title="t('settings.price_list')" />
    </div>
    <div class="filter-content">
      <DropdownsByFilterStates
        ref="DropdownComponent"
        :filterStates="filterStates"
        @onOpenDropdown="filtersStore.onOpenDropdown"
      />
      <flex-row class="submit-item">
        <m-btn
          @click="onSetFilters"
          :loading="priceTypesStore.loadingPriceList"
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
import type { DropdownsByFilterStates } from "#components";

// Store
import { useI18n } from "vue-i18n";
import { StateFilterType } from "~/variable/static-constants";

const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);

const priceTypesStore = usePriceStore("main");
const filtersStore = useFiltersStore("/settings/prices/list/filter");
// State
const { t } = useI18n();
let filterStates = ref([
  {
    name: t("filters.brand"),
    key: "brands",
    get data() {
      return filtersStore.brands || [];
    },
    get getSelectedData() {
      return filtersStore.selectedBrands;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedBrands = value;
    },
    checked: true,
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
    checked: true,
  },
  {
    name: t("active"),
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
    checked: true,
  },
]);

// methods

const onSetFilters = () => {
  priceTypesStore.priceListParams.category_id_arr = [
    ...filtersStore.selectedProductCategorieis,
  ];
  priceTypesStore.priceListParams.brand_id_arr = filtersStore.selectedBrands;
  priceTypesStore.priceListParams.state_filter_type =
    filtersStore.selectedStateFilterType;
};
const isFilterClearable = computed(() => {
  return !(
    filtersStore.selectedProductCategorieis.length ||
    filtersStore.selectedBrands.length ||
    filtersStore.selectedStateFilterType !== StateFilterType.OnlyActive
  );
});

const onClearFilter = () => {
  priceTypesStore.setPage(1);
  filtersStore.selectedProductCategorieis = [];
  filtersStore.selectedBrands = [];
  filtersStore.selectedStateFilterType = StateFilterType.OnlyActive;
  DropdownComponent.value.onClearFilter();
  onSetFilters();
};
onMounted(async () => {
  await filtersStore.getFilterTypes();
  onSetFilters();
});
<\/script>
`;export{e as default};
