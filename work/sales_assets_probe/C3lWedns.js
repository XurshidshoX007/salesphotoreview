const n=`<template>
  <flex-col class="gap-4">
    <FlexibleItemsMenu
      indicator-mode
      :items-arr="productCategories"
      :invalid-item-ids="invalidBonusIdsWithMinReturn"
      :active-item-id="activeProductCategoriesId"
      :used-item-ids="usedCategoryIds"
      invalid-item-show-by-number
      @onChangeActiveItem="onSelectCategory"
    />
    <div v-if="forBonus" class="text-gray-3 font-semibold">
      {{ t("orders.minimum_return_quantity") }}:
      <span :class="{ 'text-red-5': minReturningBonusAmount > 0 }">{{
        minReturningBonusAmount
      }}</span>
    </div>
    <div v-if="isAnyProductExpandable">
      <RoundedIconBtn
        v-show="isAnyProductCollapsed"
        icon-file-name="Expand"
        type="outlined"
        icon-color="white"
        bg-color="white"
        @click="expandAllProducts"
      />
      <RoundedIconBtn
        v-show="!isAnyProductCollapsed"
        icon-file-name="Minimize"
        type="outlined"
        icon-color="white"
        bg-color="white"
        @click="collapseAllProducts"
      />
    </div>
    <div class="rounded-lg">
      <div
        v-if="activeProductCategoriesId"
        class="rounded-lg bg-white relative w-full rounded-lg border-grey"
      >
        <div class="rounded-lg overflow-auto">
          <data-table
            withInformationAboveHeader
            :headers="headers"
            :isEmpty="!products?.length"
            class="rounded-lg"
          >
            <template #body>
              <template
                v-for="(item, index) in products"
                :key="item.product.id"
              >
                <c-tr>
                  <c-td-no-edit
                    v-for="key in headers"
                    :key="key.key"
                    :style="\`width:calc(100%/\${headers?.length}\`"
                  >
                    <div v-if="key.key === 'total_price'" class="text-end">
                      {{
                        getFormattedAmount(item.returning_count * item.price)
                      }}
                    </div>
                    <div v-else-if="key?.view === 'input'" class="float-right">
                      <DInput
                        min="0"
                        type="number"
                        :value="item[key.key]"
                        :max="getMaxInputValue(item, key.key)"
                        :disabled="
                          readOnly ||
                          isProductExpanded(item.product.id) ||
                          disabledIsReplacementsCount(item)
                        "
                        @change="onAddValue(item.product.id, $event, key.key)"
                      />
                    </div>
                    <div
                      v-else-if="typeof item[key.key] === 'number'"
                      class="text-end"
                    >
                      {{ getFormattedAmount(item[key.key]) }}
                    </div>
                    <div v-else-if="key.key === 'product_name'">
                      <div
                        class="flex justify-start cursor-pointer items-center gap-x-3 select-none"
                        :class="
                          !item?.product.replacement_product_group_id &&
                          'pointer-events-none'
                        "
                        @click="
                          toggleProductExpansion(
                            item.product.id,
                            item?.product.replacement_product_group_id
                          )
                        "
                      >
                        <div class="w-7">
                          <IconLoading
                            v-if="isLoadingProduct(item.product.id)"
                            :loading="true"
                            :width="7"
                            :height="7"
                          />
                          <icon-replacement
                            v-else
                            :is-active="isProductExpanded(item.product.id)"
                            :disabled="
                              !item?.product.replacement_product_group_id
                            "
                          />
                        </div>
                        <div>
                          {{ item["product"]?.name }}
                          <show-more
                            :data="getReplacementNames(item?.replacements)"
                            :title="t('orders.replaced_by_products')"
                            :show-count="null"
                          />
                        </div>
                      </div>
                    </div>
                    <div v-else-if="key.key === 'total_summa'" class="text-end">
                      {{
                        getFormattedAmount(
                          item?.returning_count_as_payment * item?.price
                        )
                      }}
                    </div>
                    <div v-else>{{ item[key.key] }}</div>
                  </c-td-no-edit>
                </c-tr>
                <template v-if="isProductExpanded(item.product.id)">
                  <c-tr
                    v-if="isReplacementsEmpty(item)"
                    class="h-20 w-full font-semibold"
                  >
                    <td class="text-center w-full" colspan="100%">
                      {{
                        t(
                          "orders.replacement_products_are_not_available_for_this_price_type"
                        )
                      }}
                    </td>
                  </c-tr>

                  <c-tr
                    v-for="(product, chIndex) in item?.replacements"
                    :key="'children' + index + chIndex"
                    class="bg-[#FAFDFD] fs-12"
                  >
                    <c-td-no-edit
                      v-for="key in headers"
                      :key="key.key"
                      :class="key.borderX && 'border-r-1'"
                    >
                      <div v-if="key.key === 'total_price'" class="text-end">
                        {{
                          getFormattedAmount(product?.count * product.price) ||
                          ""
                        }}
                      </div>
                      <div
                        v-else-if="key?.view === 'input'"
                        class="float-right"
                      >
                        <DInput
                          min="0"
                          type="number"
                          :value="product[key.key]"
                          :max="
                            maxReplacementProductInput(item, product, key.key)
                          "
                          :disabled="
                            disabledReplacementProductInput(
                              item,
                              product,
                              key.key
                            )
                          "
                          @change="
                            updateReplacementProducts(
                              item.product.id,
                              product.id,
                              $event,
                              key.key
                            )
                          "
                        />
                      </div>
                      <div v-else-if="key.key === 'price'" class="text-end">
                        {{ getFormattedAmount(item[key.key]) }}
                      </div>
                      <div
                        v-else-if="typeof product[key.key] === 'number'"
                        class="text-end"
                      >
                        {{ getFormattedAmount(product[key.key]) }}
                      </div>
                      <div v-else-if="key.key === 'product_name'" class="pl-10">
                        {{ product["product"]?.name || product?.name }}
                      </div>
                      <div v-else-if="key.key === 'name'" class="pl-6">
                        {{ product[key.key] }}
                      </div>
                      <div
                        v-else-if="key.key === 'total_summa'"
                        class="text-end"
                      >
                        {{
                          getFormattedAmount(
                            product?.returning_count_as_payment * item?.price
                          ) || ""
                        }}
                      </div>
                      <div v-else>{{ product[key.key] }}</div>
                    </c-td-no-edit>
                  </c-tr>
                </template>
              </template>
            </template>
            <template #footer>
              <c-tr v-if="products?.length" class="bg-neutral-50 border-b-0">
                <c-td-no-edit v-for="key in headers" :key="key.key">
                  <div
                    v-if="key.key === 'name' || key.key === 'product_name'"
                    class="fw-6"
                  >
                    {{
                      forBonus
                        ? t("orders.total_by_bonus")
                        : t("orders.total_by_category")
                    }}
                  </div>
                  <div
                    v-else-if="key.key === 'returning_count'"
                    class="fw-6 pl-2 text-end"
                  >
                    {{ totalReturnedCount }}
                  </div>
                  <div
                    v-else-if="key.key === 'returning_count_as_payment'"
                    class="fw-6 pl-2 text-end"
                  >
                    {{ totalReturnedCountAsPayment }}
                  </div>
                  <div
                    v-else-if="key.key === 'total_price'"
                    class="text-end fw-6"
                  >
                    {{ getFormattedAmount(totalAmountByCategory(key.key)) }}
                  </div>
                </c-td-no-edit>
              </c-tr>
              <c-tr v-if="products?.length" class="bg-neutral-50 border-b-0">
                <c-td-no-edit v-for="key in headers" :key="key.key">
                  <div
                    v-if="key.key === 'name' || key.key === 'product_name'"
                    class="fw-6"
                  >
                    {{ t("column.total") }}
                  </div>
                  <div
                    v-else-if="key.key === 'returning_count'"
                    class="fw-6 pl-2 text-end"
                  >
                    {{ getFormattedAmount(totalAmount("returning_count")) }}
                  </div>
                  <div
                    v-else-if="key.key === 'returning_count_as_payment'"
                    class="fw-6 pl-2 text-end"
                  >
                    {{
                      getFormattedAmount(
                        totalAmount("returning_count_as_payment")
                      )
                    }}
                  </div>
                  <div
                    v-else-if="key.key === 'total_summa'"
                    class="text-end fw-6"
                  >
                    {{ getFormattedAmount(totalAmount("total_summa")) }}
                  </div>
                  <div
                    v-else-if="key.key === 'total_price'"
                    class="text-end fw-6"
                  >
                    {{ getFormattedAmount(totalAmount("total_price")) }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </data-table>
        </div>
      </div>
    </div>
  </flex-col>
</template>

<script setup lang="ts">
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";
import type {
  OrderRefundProductModel,
  OrderRefundCategoryModel,
  OrderRefundReplacementProductModel,
} from "~/interfaces/api/orders/order-refund-detail-model";

interface Props {
  headers?: Template[];
  products?: OrderRefundProductModel[];
  productCategories?: OrderRefundCategoryModel[];
  returningBonusProducts?: any[];
  readOnly?: boolean;
  isCreateIncome?: boolean;
  withoutTotal?: boolean;
  baseCurrency?: string;
  changeId?: string;
  indicatorModeWithBorder?: boolean;
  forBonus?: boolean;
  loadingProductId?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  isCreateIncome: false,
  withoutTotal: false,
  indicatorModeWithBorder: false,
  forBonus: false,
});

const emit = defineEmits<{
  updateProducts: [products: OrderRefundProductModel[], categoryId: string];
  onChangeActiveCategoryId: [categoryId: string];
  setReplacementProduct: [productId: string, replacementProductGroupId: string];
  updateReplacementProducts: [
    productId: string,
    replacementProductId: string,
    value: number,
    key: string | null,
  ];
}>();

const { t } = useI18n();
const activeProductCategoriesId = ref<string | null>(null);
const expandedProductIds = ref<string[]>([]);

const totalReturnedCount = computed(() =>
  getFormattedAmount(
    props.products?.reduce((sum, p) => sum + (p.returning_count || 0), 0) || 0
  )
);

const totalReturnedCountAsPayment = computed(() =>
  getFormattedAmount(
    props.products?.reduce(
      (sum, p) => sum + (p.returning_count_as_payment || 0),
      0
    ) || 0
  )
);

const usedCategoryIds = computed(() =>
  props.readOnly
    ? []
    : props.products?.map((p) => p.returning_count > 0 && p.category_id) || []
);

const invalidBonusIdsWithMinReturn = computed(() => {
  const invalidIds: string[] = [];
  props.productCategories?.forEach((bonus) => {
    const bonusProducts = props.returningBonusProducts?.filter(
      (product: any) => product.bonus_id === bonus.id
    );
    const totalAmount =
      bonusProducts?.reduce(
        (sum: number, product: any) =>
          sum + (product.count || 0) + (product.returned_count_as_payment || 0),
        0
      ) || 0;
    if (totalAmount < (bonus.min_returning_amount || 0)) {
      invalidIds.push(bonus.id);
    }
  });
  return invalidIds;
});

const minReturningAmount = computed(
  () =>
    props.productCategories?.find(
      (c) => c.id === activeProductCategoriesId.value
    )?.min_returning_amount
);

const minReturningBonusAmount = computed(() => {
  if (!props.forBonus || !props.returningBonusProducts) return 0;

  const totalReturning =
    props.products?.reduce(
      (sum, p) =>
        sum + (p.returning_count || 0) + (p.returning_count_as_payment || 0),
      0
    ) || 0;

  const remaining = (minReturningAmount.value || 0) - totalReturning;
  return remaining > 0 ? remaining : 0;
});

const isAnyProductCollapsed = computed(() => {
  return props.products?.some(
    (p) =>
      p.product.replacement_product_group_id &&
      !expandedProductIds.value.includes(p.product.id)
  );
});

const isAnyProductExpandable = computed(() => {
  return (
    activeProductCategoriesId.value &&
    props.products?.some(
      (p) =>
        p.product.replacement_product_group_id && p.available_count_for_return
    )
  );
});

const isLoadingProduct = (productId: string) =>
  productId === props.loadingProductId;

const isProductExpanded = (productId: string) =>
  expandedProductIds.value.includes(productId);

const isReplacementsEmpty = (item: OrderRefundProductModel) =>
  !isLoadingProduct(item.product.id) && !item.replacements?.length;

const getReplacementCount = (
  replacement: OrderRefundReplacementProductModel
) =>
  props.forBonus
    ? (replacement.returning_count_as_payment || 0) +
      (replacement.returning_count || 0)
    : replacement.returning_count || 0;

const totalAmountByCategory = (key: string) => {
  if (key === "returning_count") {
    return props.products?.reduce((sum, p) => sum + p.returning_count, 0);
  } else if (key === "total_price") {
    return props.products?.reduce(
      (sum, p) => sum + p.returning_count * p.price,
      0
    );
  }
  return 0;
};

const totalAmount = (key: string) => {
  const keyMap: Record<string, (p: OrderRefundProductModel) => number> = {
    returning_count: (p) => p.returning_count || 0,
    total_price: (p) => (p.returning_count || 0) * (p.price || 0),
    total_summa: (p) => (p.returning_count_as_payment || 0) * (p.price || 0),
    returning_count_as_payment: (p) => p.returning_count_as_payment || 0,
  };

  const calculator = keyMap[key];
  if (!calculator) return 0;

  return (
    props.productCategories?.reduce(
      (total, category) =>
        total +
        (category.products?.reduce(
          (sum, product) => sum + calculator(product),
          0
        ) || 0),
      0
    ) || 0
  );
};

const onAddValue = (id: string, value: number, key: string) => {
  const updatedProducts = props.products?.map((item) => {
    if (item.product.id !== id) return item;

    if (props.forBonus) {
      return key === "returning_count"
        ? { ...item, returning_count: value }
        : { ...item, returning_count_as_payment: value };
    }

    return {
      ...item,
      returning_count: value,
      total_price: value * item.price,
    };
  });

  if (updatedProducts && activeProductCategoriesId.value) {
    emit("updateProducts", updatedProducts, activeProductCategoriesId.value);
  }
};

const onSelectCategory = (categoryId: string) => {
  activeProductCategoriesId.value = categoryId;
  emit("onChangeActiveCategoryId", categoryId);
  expandedProductIds.value = [];
};

const getMaxInputValue = (
  product: OrderRefundProductModel,
  key: keyof OrderRefundProductModel
) => {
  if (!props.forBonus) return product.available_count_for_return;

  if (key === "returning_count") {
    return (
      product.available_count_for_return -
      (product.returning_count_as_payment || 0)
    );
  } else if (product.returning_count_as_payment) {
    return product.available_count_for_return - product.returning_count;
  }

  return 0;
};

const toggleProductExpansion = (
  productId: string,
  replacementGroupId?: string
) => {
  if (!replacementGroupId || isLoadingProduct(productId)) return;

  const index = expandedProductIds.value.indexOf(productId);

  if (index !== -1) {
    expandedProductIds.value.splice(index, 1);
  } else {
    expandedProductIds.value.push(productId);
    emit("setReplacementProduct", productId, replacementGroupId);
  }
};

const expandAllProducts = () => {
  props.products?.forEach((p) => {
    if (p.product.replacement_product_group_id) {
      expandedProductIds.value.push(p.product.id);
      emit(
        "setReplacementProduct",
        p.product.id,
        p.product.replacement_product_group_id
      );
    }
  });
};

const collapseAllProducts = () => {
  expandedProductIds.value = [];
};

const updateReplacementProducts = (
  productId: string,
  replacementProductId: string,
  value: number,
  key: string | null
) => {
  emit(
    "updateReplacementProducts",
    productId,
    replacementProductId,
    value,
    key
  );
};

const maxReplacementProductInput = (
  item: OrderRefundProductModel,
  replacementProduct: OrderRefundReplacementProductModel,
  key: string
) => {
  if (
    !item ||
    (!replacementProduct.is_replacement_available_for_the_price_type &&
      item.returning_count > 0)
  ) {
    return 0;
  }

  const replacementProductId = replacementProduct.id;

  const otherReplacementsTotal =
    item.replacements
      ?.filter((r) => r.id !== replacementProductId)
      ?.reduce((sum, r) => sum + getReplacementCount(r), 0) || 0;

  const currentReplacement = item.replacements?.find(
    (r) => r.id === replacementProductId
  );
  const currentOtherKey =
    key === "returning_count_as_payment"
      ? currentReplacement?.returning_count || 0
      : currentReplacement?.returning_count_as_payment || 0;

  return Math.max(
    0,
    item.available_count_for_return - otherReplacementsTotal - currentOtherKey
  );
};

const disabledReplacementProductInput = (
  item: OrderRefundProductModel,
  product: OrderRefundReplacementProductModel,
  key: string
): boolean => {
  if (props.readOnly || !item) return true;

  const productValue = (product as any)[key];
  if (productValue && productValue > 0) return false;

  const totalReplacementCount =
    item.replacements?.reduce((sum, r) => sum + getReplacementCount(r), 0) || 0;

  return item.available_count_for_return - totalReplacementCount <= 0;
};

const disabledIsReplacementsCount = (data: OrderRefundProductModel) => {
  if (data.available_count_for_return === 0) return true;
  if (!data?.replacements?.length) return false;

  const totalCount = data.replacements.reduce(
    (sum, r) => sum + getReplacementCount(r),
    0
  );
  return totalCount > 0;
};

const getReplacementNames = (
  replacements: OrderRefundReplacementProductModel[]
) => {
  if (!replacements?.length) return [];

  return replacements
    .filter((r) => {
      const count =
        (r.returning_count || 0) +
        (props.forBonus ? r.returning_count_as_payment || 0 : 0);
      return count > 0;
    })
    .map((r) => {
      const name = r.product_name || r.product?.name;
      const count =
        (r.returning_count || 0) +
        (props.forBonus ? r.returning_count_as_payment || 0 : 0);
      return \`\${name} => \${count} шт.\`;
    });
};

onMounted(() => {
  if (props.productCategories?.length) {
    activeProductCategoriesId.value = props.productCategories[0].id;
  }
});

watch(
  () => props.changeId,
  (newId) => {
    activeProductCategoriesId.value = newId || null;
  }
);
<\/script>
`;export{n as default};
