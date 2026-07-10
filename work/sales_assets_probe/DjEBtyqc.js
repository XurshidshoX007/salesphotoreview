const e=`<template>
  <div class="flex items-center justify-between">
    <div class="w-70">
      <DropdownsByFilterStates
        ref="DropdownComponent"
        :filterStates="filterStates"
        @onOpenDropdown="filtersStore.onOpenDropdown"
        @search="filtersStore.onSearchDropdown"
      />
    </div>

    <flex-row class="w-60 gap-x-2">
      <m-btn class="w-100" @click="onSetFilters">
        {{ t("apply") }}
      </m-btn>
      <ResetFilterBtn
        :is-filter-clearable="isFilterClearable"
        @onClearFilter="onClearFilter"
      />
    </flex-row>
  </div>
</template>

<script setup lang="ts">
import type { DropdownsByFilterStates } from "#components";
import { useI18n } from "vue-i18n";

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);

// Store
const filtersStore = useFiltersStore("/settings/assembly-invoice");
const invoiceAssemblyStore = useAssemblyInvoiceStore("main");

// props

// state
const { t } = useI18n();

const filterStates = ref([
  {
    name: t("sidebar.warehouse"),
    key: "warehouses",
    isSingleSelect: true,
    get data() {
      return filtersStore.warehouses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedSingleWarehouses;
    },
    set setSelectedData(value: string) {
      filtersStore.selectedSingleWarehouses = value;
    },
  },
]);

// hooks
const isFilterClearable = computed(() => {
  return !filtersStore.selectedSingleWarehouses;
});

// methods
const onSetFilters = () => {
  invoiceAssemblyStore.params.filter = [
    {
      field: "warehouse_id",
      value: [filtersStore.selectedSingleWarehouses],
    },
  ];
};

const onClearFilter = () => {
  filtersStore.selectedSingleWarehouses = null;
  DropdownComponent.value!.onClearFilter();
  onSetFilters();
};
<\/script>
`;export{e as default};
