const e=`<template>
  <div class="custom-product-filter filter-content-container">
    <div class="filter-content">
      <DropdownsByFilterStates
        ref="DropdownComponent"
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
import { useI18n } from "vue-i18n";
import { useProductsAccess } from "~/composables/access/settings/products/products";
import type { DropdownsByFilterStates } from "#components";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";

// emits
type Emits = {
  (e: "clearFetchedTabs", isActive: boolean, filters: FilterParams[]): void;
};

const emits = defineEmits<Emits>();

// props
const props = defineProps<{
  isActive: boolean;
}>();

// stores
const { isActive } = toRefs(props);
const filtersStore = useFiltersStore("/settings/products");

// event-bus
const eventBus = useEventBus();
const updateListEventKey = SettingsEventKeys.PRODUCTS_TABLE_UPDATE;

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);

// State
const { hasAccess2ReplacementProductGroup } = useProductsAccess();
const { t } = useI18n();

const filterStates = ref([
  {
    name: t("column.category"),
    key: "product-category",
    required: true,
    get data() {
      return filtersStore.productCategory || [];
    },
    get getSelectedData() {
      return filtersStore.selectedProductCategorieis;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedProductCategorieis = value;
    },
  },
  {
    name: t("column.product_group"),
    key: "product-group",
    get data() {
      return filtersStore.productGroup || [];
    },
    get getSelectedData() {
      return filtersStore.selectedProductGroup;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedProductGroup = value;
    },
  },
]);

// hooks

const isFilterClearable = computed(() => {
  return !(
    filtersStore.selectedProductCategorieis.length ||
    filtersStore.selectedProductGroup.length
  );
});

// methods

const onSetFilters = () => {
  const filters = [
    {
      field: "product_group_id",
      value: filtersStore.selectedProductGroup
        ? filtersStore.selectedProductGroup
        : [],
    },
    {
      field: "category_id",
      value: filtersStore.selectedProductCategorieis
        ? filtersStore.selectedProductCategorieis
        : [],
    },
  ];

  emits("clearFetchedTabs", props.isActive, filters);

  eventBus.emit(updateListEventKey, {
    isActive: props.isActive,
    filters,
  });
};

const onClearFilter = () => {
  filtersStore.selectedProductGroup = [];
  filtersStore.selectedProductCategorieis = [];
  DropdownComponent.value!.onClearFilter();
  onSetFilters();
};
<\/script>

<style scoped>
.custom-product-filter {
  padding: 0;
  border: none;
}
</style>
`;export{e as default};
