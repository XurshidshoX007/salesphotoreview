const e=`<template>
  <div class="product-category-box">
    <div class="box-top">
      <div v-if="!props.withoutTitle" class="title">
        {{ getTitle() }}
      </div>
      <Checkbox
        :id="\`select-all-\${mode}\`"
        :checked="isAllSelected"
        :indeterminate="isSomeSelected"
        :disabled="readonly"
        :title="t('filters.choose_all')"
        @change="handleSelectAll"
      />
    </div>

    <div :style="{ height: props.height }" class="box-bottom">
      <div class="content-by-category">
        <div class="bottom-header">
          <search-input-border-none
            :disabled="isLoading"
            @updated="handleSearch"
          />
        </div>

        <div class="box-body">
          <SkeletonRows
            v-if="isLoading"
            class="mt-13"
            height="20px"
            :rows="9"
            :max-row-width="250"
          />

          <div v-else class="item">
            <div
              v-for="category in categories"
              :key="category.id"
              class="child-item"
              :class="{ 'bg-[#FAFDFD]': isCategoryExpanded(category.id) }"
            >
              <div class="flex gap-x-2">
                <Checkbox
                  :id="\`category-\${category.id}-\${mode}\`"
                  :checked="isCategoryFullySelected(category.id)"
                  :indeterminate="isCategoryPartiallySelected(category.id)"
                  :disabled="readonly"
                  @change="handleCategorySelect(category.id, $event)"
                />
                <div
                  class="flex items-center gap-2 cursor-pointer"
                  @click="toggleCategory(category.id)"
                >
                  <div>{{ category.name }}</div>
                  <ToggleDataViewBtn
                    no-border
                    :isOpen="isCategoryExpanded(category.id)"
                  />
                </div>
              </div>

              <div v-show="isCategoryExpanded(category.id)">
                <div
                  v-if="getCategoryProducts(category.id).length > 0"
                  class="flex flex-col gap-2 mt-2"
                >
                  <div
                    v-for="product in getCategoryProducts(category.id)"
                    :key="product.id"
                    class="flex"
                  >
                    <Checkbox
                      :id="\`product-\${product.id}-\${mode}\`"
                      :checked="isProductSelected(product.id)"
                      :disabled="readonly"
                      :title="product.name"
                      @change="handleProductSelect(product.id, $event)"
                    />
                  </div>
                </div>
                <div v-else class="ml-8 text-gray-500">
                  {{ t("users.not_product") }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductCategoriesModel } from "~/interfaces/api/orders/order-partial-return-detail-model";
import type { ProductsModel } from "~/interfaces/api/settings/products-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import { useI18n } from "vue-i18n";
import { computed, ref, watch } from "vue";

type SelectedProduct = {
  product_id: string;
  [key: string]: any;
};

interface Props {
  type?: "productCategories" | "bonusCategories";
  categories: ProductCategoriesModel[];
  products: DropdownItemsModelByType<ProductsModel>;
  selectedProducts: SelectedProduct[];
  isLoading: boolean;
  readonly?: boolean;
  withoutTitle?: boolean;
  height?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: "productCategories",
  readonly: false,
});

const emit = defineEmits<{
  onSearch: [type: string, searchTerm: string];
  onAllSelect: [categoryId: string, mode: string, isChecked: boolean];
  onSelect: [productId: string, mode: string, isChecked: boolean];
  selectAllCheckboxFunction: [mode: string, isChecked: boolean];
}>();

const { t } = useI18n();

// Local state
const expandedCategoryIds = ref<string[]>([]);
const selectedProductIds = ref<Set<string>>(new Set());

// Computed: mode identifier
const mode = computed(() => {
  return props.type === "productCategories" ? "productFrom" : "productTo";
});

// Computed: all product items
const allProducts = computed(() => {
  return props.products?.items || [];
});

// Computed: all category items
const allCategories = computed(() => {
  return props.categories || [];
});

// Sync selected products from props to local state
watch(
  () => props.selectedProducts,
  (newSelected) => {
    if (!newSelected) {
      selectedProductIds.value = new Set();
      return;
    }
    selectedProductIds.value = new Set(
      newSelected.map((item) => item.product_id).filter(Boolean)
    );
  },
  { immediate: true, deep: true }
);

// Title based on type
function getTitle(): string {
  if (props.withoutTitle) {
    return "";
  }
  return props.type === "productCategories"
    ? t("settings_sidebar.products")
    : t("column.bonus_products");
}

// Get products for a specific category
function getCategoryProducts(categoryId: string): ProductsModel[] {
  return allProducts.value.filter(
    (product) => product.category?.id === categoryId
  );
}

// Get all product IDs for a category
function getCategoryProductIds(categoryId: string): string[] {
  return getCategoryProducts(categoryId).map((product) => product.id);
}

// Check if product is selected
function isProductSelected(productId: string): boolean {
  return selectedProductIds.value.has(productId);
}

// Check if category is expanded
function isCategoryExpanded(categoryId: string): boolean {
  return expandedCategoryIds.value.includes(categoryId);
}

// Check if all products in category are selected
function isCategoryFullySelected(categoryId: string): boolean {
  const categoryProductIds = getCategoryProductIds(categoryId);
  if (categoryProductIds.length === 0) return false;

  return categoryProductIds.every((id) => selectedProductIds.value.has(id));
}

// Check if some (but not all) products in category are selected
function isCategoryPartiallySelected(categoryId: string): boolean {
  const categoryProductIds = getCategoryProductIds(categoryId);
  if (categoryProductIds.length === 0) return false;

  const selectedCount = categoryProductIds.filter((id) =>
    selectedProductIds.value.has(id)
  ).length;

  return selectedCount > 0 && selectedCount < categoryProductIds.length;
}

// Check if all products are selected
const isAllSelected = computed(() => {
  const totalProducts = allProducts.value.length;
  if (totalProducts === 0) return false;

  return selectedProductIds.value.size === totalProducts;
});

// Check if some (but not all) products are selected
const isSomeSelected = computed(() => {
  const totalProducts = allProducts.value.length;
  const selectedCount = selectedProductIds.value.size;

  return selectedCount > 0 && selectedCount < totalProducts;
});

// Toggle category expansion
function toggleCategory(categoryId: string): void {
  if (isCategoryExpanded(categoryId)) {
    expandedCategoryIds.value = expandedCategoryIds.value.filter(
      (id) => id !== categoryId
    );
  } else {
    expandedCategoryIds.value = [...expandedCategoryIds.value, categoryId];
  }
}

// Handle search input
function handleSearch(searchTerm: string): void {
  emit("onSearch", props.type || "productCategories", searchTerm);
}

// Handle select all checkbox
function handleSelectAll(isChecked: boolean): void {
  emit("selectAllCheckboxFunction", mode.value, isChecked);

  if (isChecked) {
    allProducts.value.forEach((product) => {
      selectedProductIds.value.add(product.id);
    });
  } else {
    selectedProductIds.value.clear();
  }
}

// Handle category checkbox
function handleCategorySelect(categoryId: string, isChecked: boolean): void {
  emit("onAllSelect", categoryId, mode.value, isChecked);

  const categoryProductIds = getCategoryProductIds(categoryId);

  if (isChecked) {
    categoryProductIds.forEach((id) => {
      selectedProductIds.value.add(id);
    });
  } else {
    categoryProductIds.forEach((id) => {
      selectedProductIds.value.delete(id);
    });
  }
}

// Handle individual product checkbox
function handleProductSelect(productId: string, isChecked: boolean): void {
  emit("onSelect", productId, mode.value, isChecked);

  if (isChecked) {
    selectedProductIds.value.add(productId);
  } else {
    selectedProductIds.value.delete(productId);
  }
}
<\/script>

<style scoped lang="scss">
.product-category-box {
  .box-top {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-weight: 600;
      font-family: "Inter", sans-serif;
      font-size: 18px;
      color: #424f4f;
    }
  }

  .box-bottom {
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid #e1e4e4;
    position: relative;
    background: white;
    width: 100%;
    height: 344px;
    margin-top: 12px;

    .content-by-category {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;

      .bottom-header {
        padding: 4px;
        width: 100%;
        border-bottom: 1px solid #e1e4e4;
        flex-shrink: 0;
      }

      .box-body {
        width: 100%;
        flex: 1;
        overflow: hidden;

        .item {
          overflow: auto;
          height: 100%;

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

          .child-item {
            border-bottom: 1px solid #e1e4e4;
            padding: 10px;

            &:last-child {
              border-bottom: none;
            }
          }
        }
      }
    }
  }
}
</style>
`;export{e as default};
