const n=`<template>
  <div class="rounded-lg border h-[600px] flex flex-col overflow-hidden">
    <div class="border-b shrink-0 p-1">
      <SearchInputBorderNone @updated="onSearch" />
    </div>

    <div class="flex-1 overflow-auto scrollable-content">
      <template v-for="product in filteredProducts" :key="product.id">
        <div class="p-2.5 border-b last:border-0">
          <div class="text-neutral-900">{{ product.name }}</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
// props
const props = defineProps<{
  selectedProducts: Array<IdNameModel>;
}>();

// states
const searchingValue = ref("");

// hooks
const filteredProducts = computed(() => {
  const search = searchingValue.value.trim().toLowerCase();

  if (!search) {
    return props.selectedProducts;
  }

  return props.selectedProducts.filter((product) =>
    product.name.toLowerCase().includes(search)
  );
});

// methods
const onSearch = (value: string) => {
  searchingValue.value = value;
};
<\/script>

<style scoped lang="scss">
.scrollable-content {
  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: #fafafa;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    margin-top: 10px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    border: 3px solid transparent;
    background-clip: padding-box;
  }
}
</style>
`;export{n as default};
