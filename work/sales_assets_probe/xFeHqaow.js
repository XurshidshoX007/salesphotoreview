const e=`<template>
  <rounded-white-container without-padding class="p-5">
    <flex-row class="w-full gap-2.5 items-stretch">
      <flex-col class="flex-1 gap-5">
        <div class="text-neutral-950 font-medium">
          {{ t("settings.products") }}
        </div>

        <flex-col class="flex-1 gap-2.5">
          <div>
            {{ t("column.all_products") }}
          </div>
          <SharedProductsByCategorySelection
            :readonly="props.disabled"
            class="h-full flex-1"
            type="productCategories"
            :categories="filteredCategories?.items"
            :selected-products="selectedProducts"
            :products="products"
            :is-loading="isLoading"
            without-title
            height="600px"
            @on-search="onSearch"
            @on-all-select="onSelectAllByCategory"
            @on-select="onSelectProduct"
            @select-all-checkbox-function="onSelectAll"
          />
        </flex-col>
      </flex-col>

      <flex-col class="gap-2.5 items-center justify-self-center my-auto mx-0">
        <RoundedIconBtn
          icon-file-name="ArrowRight"
          type="primary"
          :icon-size="18"
        />
        <RoundedIconBtn
          icon-file-name="ArrowLeft"
          type="primary"
          disabled
          :icon-size="18"
        />
      </flex-col>

      <div class="flex-1 gap-5">
        <flex-col class="flex-1 gap-2.5 mt-18">
          <div>
            {{ t("settings.discount.products_for_discount") }}
          </div>

          <SettingsDiscountCreateSelectedProducts
            :selected-products="formattedSelectedProducts"
          />
        </flex-col>
      </div>
    </flex-row>
  </rounded-white-container>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type {
  IdNameModel,
  DropdownModel,
  DropdownItemsModelByType,
} from "#imports";

// store
const discountStore = useDiscountStore("main");

// props
const props = defineProps<{
  disabled?: boolean;
  initialSelectedProducts?: string[];
}>();

// emits
const emit = defineEmits<{
  (e: "updateSelectedProducts", value: string[]): void;
}>();

// states
const { t } = useI18n();

const selectedProducts = ref<Array<{ product_id: string; name: string }>>([]);

const isLoading = ref(false);
const productCategories = ref<DropdownItemsModelByType<DropdownModel>>();
const products =
  ref<DropdownItemsModelByType<DropdownModel & { category: IdNameModel }>>();
const searchingValue = ref("");

// hooks
const filteredCategories = computed(() => {
  const search = searchingValue.value.trim().toLowerCase();

  if (!search) {
    return productCategories.value;
  }

  const filtered = productCategories.value?.items?.filter((category) => {
    const isCategoryMatch = category.name.toLowerCase().includes(search);

    const hasMatchingProducts = products.value?.items?.some(
      (product) =>
        product.category.id === category.id &&
        product.name.toLowerCase().includes(search)
    );

    return isCategoryMatch || hasMatchingProducts;
  });

  return { items: filtered || [] };
});

const formattedSelectedProducts = computed(() => {
  return selectedProducts.value.map((selected) => {
    const product = products.value?.items.find(
      (prod) => prod.id === selected.product_id
    );
    return {
      id: selected.product_id,
      name: product ? product.name : "",
    };
  });
});

onMounted(async () => {
  isLoading.value = true;
  await Promise.all([fetchProductCategories(), fetchProducts()]);
  isLoading.value = false;
});

watch(
  selectedProducts,
  (newVal) => {
    const selectedIds = newVal.map((product) => product.product_id);
    emit("updateSelectedProducts", selectedIds);
  },
  { deep: true }
);

watch(
  () => props.initialSelectedProducts,
  (value) => {
    selectedProducts.value = (value || []).map((id) => ({
      product_id: id,
      name: "",
    }));
  },
  { immediate: true }
);

// methods
const { getProductCategories, getProducts } = discountStore;

const fetchProductCategories = async () => {
  productCategories.value = await getProductCategories();
};

const fetchProducts = async () => {
  products.value = await getProducts();
};

const onSelectAllByCategory = async (
  categoryId: string,
  type: string,
  isChecked: boolean
) => {
  const filteredProductIds = products.value?.items
    .filter((product) => product?.category?.id === categoryId)
    ?.map((product) => product?.id);

  if (!isChecked) {
    selectedProducts.value = selectedProducts.value?.filter(
      (product) => !filteredProductIds?.includes(product.product_id)
    );
  } else {
    selectedProducts.value = [
      ...selectedProducts.value,
      ...(filteredProductIds || [])?.map((id) => ({
        product_id: id,
      })),
    ];
  }
};

const onSelectProduct = (id: string, type: string, isChecked: boolean) => {
  if (!isChecked) {
    selectedProducts.value = selectedProducts.value?.filter(
      (product) => product.product_id !== id
    );
  } else {
    selectedProducts.value.push({ product_id: id });
  }
};

const onSelectAll = async (type: string, isChecked: boolean) => {
  productCategories?.value?.items?.map((item: any) => {
    onSelectAllByCategory(item.id, type, isChecked);
  });
};

const onSearch = (state: string, value: string) => {
  searchingValue.value = value;
};
<\/script>
`;export{e as default};
