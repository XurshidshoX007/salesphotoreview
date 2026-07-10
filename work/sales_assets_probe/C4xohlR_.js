const e=`<template>
  <div>
    <div v-if="isSearchVisible" class="dropdown-content-search">
      <search-input
        ref="searchInputComponent"
        :key="stateKey"
        :no-debounce="isSearchWithoutDebounce"
        :auto-focus="props.autoFocus"
        :items-total-count="totalCount"
        :value="searchingValue"
        has-placeholder
        @change="searchHandler"
      />
    </div>
    <div v-if="isTreeView" class="px-2">
      <TreeView
        class="max-h-71 overflow-auto scrollbar-default !gap-0 !py-1"
        :items="items"
        dropdown-view
        :single-select="isSingleSelect"
        :selected-items="selectedData"
        @on-select-items="selectItemsHandler"
        @on-single-select="selectItemsHandler"
      />
    </div>
    <div v-else>
      <FilterItems
        v-if="!customFilterItems"
        ref="FilterItemsComponent"
        :data="{ ...data, items: items }"
        :selectedItems="selectedData"
        :singleSelect="isSingleSelect"
        :state-key="stateKey"
        :isItemsDisabled="isItemsDisabled"
        :maxSelectionLimit="maxSelectionLimit"
        @onSelectItems="selectItemsHandler"
        @onSingleItemSelect="selectItemsHandler"
        @onLoadElse="onLoadElse"
      />
      <component
        v-else
        ref="FilterItemsComponent"
        :is="customFilterItems"
        :data="{ ...data, items: items }"
        :selectedItems="selectedData"
        :singleSelect="isSingleSelect"
        :state-key="stateKey"
        :isItemsDisabled="isItemsDisabled"
        :maxSelectionLimit="maxSelectionLimit"
        @onSelectItems="selectItemsHandler"
        @onSingleItemSelect="selectItemsHandler"
        @onLoadElse="onLoadElse"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick } from "vue";
import type { FilterItems } from "#components";

// props
const props = defineProps({
  items: Array,
  isTreeView: Boolean,
  isSingleSelect: Boolean,
  selectedData: [Array, Object, String, Number],
  totalCount: Number,
  stateKey: [String, Number],
  data: Object,
  maxSelectionLimit: Number,
  onLoadElse: Function,
  searchHandler: Function,
  selectItemsHandler: Function,
  isItemsDisabled: Function,
  customFilterItems: String,
  autoFocus: Boolean,
});

// states
const searchingValue = ref("");

// child-components
const FilterItemsComponent = ref<typeof FilterItems | null>(null);
const searchInputComponent = ref<{ focus?: () => void } | null>(null);

// hooks
const isSearchWithoutDebounce = computed(
  () => props.stateKey !== "clients" && props.stateKey !== "clients-dynamic",
);

const isSearchVisible = computed(() => {
  if (props.stateKey?.toString().includes("clients")) return true;
  if (props.isTreeView) return true;
  return props?.data?.items?.length > 9;
});

const onClearFilter = () => {
  if (FilterItemsComponent.value) {
    FilterItemsComponent.value.onClearFilter();
  }
};

const focusSearchInput = () => {
  if (!isSearchVisible.value) return;
  nextTick(() => {
    searchInputComponent.value?.focus?.();
  });
};

defineExpose({
  onClearFilter,
  focusSearchInput,
});
<\/script>

<style lang="scss">
.dropdown-content-search {
  border-bottom: 1px solid #e1e4e4;

  .search-input {
    border: none !important;
  }
}
</style>
`;export{e as default};
