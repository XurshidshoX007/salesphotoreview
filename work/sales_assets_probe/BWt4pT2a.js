const n=`<template>
  <flex-col class="w-full min-h-30 gap-2">
    <FlexibleItemsMenu
      indicator-mode
      :items-arr="productCategories"
      :active-item-id="selectedProductCategoryId"
      @onChangeActiveItem="onSelectCategory"
    />
    <div
      v-if="!loading"
      class="rounded-lg border-grey overflow-hidden"
      :class="isScrollingTable && 'pr-1'"
    >
      <div class="overflow-auto">
        <data-table
          withInformationAboveHeader
          :isEmpty="!products?.length"
          class="table-content"
          :class="isScrollingTable && 'pr-1'"
        >
          <template #header>
            <tr class="sticky top-0 left-0">
              <th
                class="th-style"
                v-for="key in headers"
                :key="key.key"
                :class="[
                  key?.right && 'text-end',
                  isScrollingTable && key.key === 'total_price' && 'border-r-1',
                ]"
              >
                {{ key.name }}
              </th>
            </tr>
          </template>
          <template #body>
            <tr
              v-for="item in products"
              :key="item.id"
              class="border-t-1 tr-order-detail"
            >
              <th
                v-for="key in headers"
                :key="key.key"
                :class="
                  isScrollingTable && key.key === 'total_price' && 'border-r-1'
                "
                class="td-style"
              >
                <div v-if="typeof item[key.key] === 'number'" class="text-end">
                  {{ getFormattedAmount(item[key.key]) }}
                  {{ key?.prefix || "" }}
                </div>
                <div v-else-if="key.key === 'total_price'" class="text-end">
                  {{ getFormattedAmount(item.cost) }}
                </div>
                <div v-else>{{ item[key.key] }}</div>
              </th>
            </tr>
          </template>
          <template #footer>
            <c-tr
              v-if="products?.length > 0"
              class="border-b-0 sticky bottom-0 bg-[#f1fefe]"
            >
              <c-td-no-edit class="fw-6">
                <div class="fw-6">
                  {{ t("column.total") }}
                </div>
              </c-td-no-edit>
              <c-td-no-edit></c-td-no-edit>
              <c-td-no-edit>
                <div class="fw-6 text-end">
                  {{ getFormattedAmount(productTotals?.unit_count) }}
                </div>
              </c-td-no-edit>
              <c-td-no-edit>
                <div class="fw-6 text-end">
                  {{ getFormattedAmount(productTotals?.count) }}
                </div>
              </c-td-no-edit>
              <c-td-no-edit>
                <div class="fw-6 text-end">
                  {{ getFormattedAmount(productTotals?.volume) }}
                </div>
              </c-td-no-edit>
              <c-td-no-edit></c-td-no-edit>
              <c-td-no-edit
                class="text-end"
                :class="isScrollingTable && 'border-r-1'"
              >
                <div class="fw-6">
                  {{ getFormattedAmount(productTotals?.cost) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
    </div>
    <div v-show="loading" class="absolute top-1/3 left-1/2">
      <icon-loading :width="15" :height="15" loading />
    </div>
  </flex-col>
</template>

<script setup lang="ts">
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";
import { ref, type Ref } from "vue";
import type { Template } from "~/interfaces/ui/template";
import type { ProductCategoryModel } from "~/interfaces/api/settings/product-category-model";
import type { ProductsModel } from "~/interfaces/api/settings/products-model";
import type { ProductCategoriesModel } from "~/interfaces/api/orders/order-detail-model";

// props
const props = defineProps<{
  productCategories: ProductCategoriesModel[];
  loading: boolean;
}>();

// emits
const emit = defineEmits(["updateProducts", "onChangeActiveCategoryId"]);

// states
const { t } = useI18n();
const headers: Ref<(Template & { prefix?: string })[]> = ref([
  {
    name: t("column.product_name"),
    key: "product_name",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("column.price"),
    key: "price",
    checked: true,
    right: true,
    is_sortable: false,
  },
  {
    name: t("column.block_count"),
    key: "unit_count",
    checked: true,
    right: true,
    is_sortable: false,
  },
  {
    name: t("column.quantity"),
    key: "count",
    checked: true,
    right: true,
    is_sortable: false,
  },
  {
    name: t("column.volume"),
    key: "volume",
    checked: true,
    right: true,
    is_sortable: false,
  },
  {
    name: t("column.discount"),
    key: "rebate",
    checked: true,
    right: true,
    prefix: "%",
    is_sortable: false,
  },
  {
    name: t("column.total_sum"),
    key: "total_price",
    checked: true,
    right: true,
    borderX: true,
    is_sortable: false,
  },
]);
const selectedProductCategoryId = ref<null | string>(null);
const productCategories = ref<ProductCategoryModel[]>();
const products = ref<ProductCategoriesModel["products"]>();
const productTotals = ref<ProductCategoriesModel["total"]>();
// hooks

watch(
  () => props.productCategories,
  () => {
    setProductCategories();
    onSelectCategory(props?.productCategories[0]?.category?.id);
  },
);

onMounted(() => {
  setProductCategories();
  onSelectCategory(props?.productCategories?.[0]?.category?.id);
});

const isScrollingTable = computed(() => {
  return products.value?.length > 10;
});

// methods

const setProductCategories = () => {
  productCategories.value = [];
  props.productCategories?.map((item) => {
    productCategories.value?.push(item.category);
  });
};

const onSelectCategory = (id: string) => {
  products.value = props.productCategories?.find(
    (item) => item.category.id === id,
  )?.products;
  productTotals.value = props.productCategories?.find(
    (item) => item.category.id === id,
  )?.total;
  selectedProductCategoryId.value = id;
};
<\/script>

<style lang="scss" scoped>
.table-content {
  max-height: 500px;
  position: relative;
}

.th-style {
  color: #8fa0a0;
  font-size: 14px;
  font-weight: 400;
  font-family: "Inter", sans-serif;
  padding: 10px;
  background: #fafdfd;
}

.td-style {
  font-size: 14px;
  color: #424f4f;
  font-family: "Inter", sans-serif;
  font-weight: 400;
  padding: 10px;
  background: white;
}

tbody {
  .tr-order-detail:hover {
    .td-style {
      background: #f1fefe !important;
    }
  }
}

::-webkit-scrollbar {
  width: 6px;
  margin-top: 0 !important;
  border-radius: 28px;
  margin-right: 10px;
  height: 8px;
}

::-webkit-scrollbar-track {
  height: 8px;
  background: #fff;
  border-radius: 28px;
}

::-webkit-scrollbar-thumb {
  background: #299b9b;
  border-radius: 28px;
  height: 8px;
  margin-top: 0 !important;
}
</style>
`;export{n as default};
