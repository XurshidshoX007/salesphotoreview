const n=`<template>
  <form @submit.prevent="onSave">
    <d-modal
      :name="t('orders.select_bonus_for_return')"
      data-container-width="1500px"
      @closeDialog="closeDialog"
    >
      <OrdersOrdersProductTableWithCategoryTabsForOrderRefund
        :headers="productsBonusTemplates"
        :productCategories="productCategoriesConst"
        :products="orderRefundProducts"
        :returning-bonus-products="returningBonusProducts"
        indicatorModeWithBorder
        for-bonus
        @onChangeActiveCategoryId="onChangeActiveCategoryId"
        @updateProducts="updateProducts"
        @getReplacementProduct="getReplacementProduct"
        @updateReplacementProducts="updateReplacementProducts"
      />
      <template #footer>
        <div class="w-full flex justify-end">
          <m-btn
            :disabled="applyDisabled"
            :loading="isSaveLoading"
            type="submit"
            >{{ t("apply") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  forBonusEdit?: boolean;
  isSaveLoading?: boolean;
  headers: any;
  products: any;
  productCategories: any;
}>();

// store
const createOrdersStore = useCreateOrdersStore("main");

// emit
const emit = defineEmits([
  "closeDialog",
  "onSave",
  "onApplyBonus",
  "getBonusReplacementProduct",
]);

// hooks
const productCategoriesConst = ref(props.productCategories || []);
// states
const { t } = useI18n();
const orderRefundProducts = ref([]);
const returningBonusProducts = ref([]);

const productsBonusTemplates = ref([
  {
    name: t("column.product_name"),
    key: "product_name",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("settings.bonus_count"),
    key: "returning_count",
    checked: true,
    right: true,
    view: "input",
    is_sortable: false,
  },
  {
    name: t("column.bonus_amount_in_price_form"),
    key: "returning_count_as_payment",
    checked: true,
    right: true,
    view: "input",
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
    name: t("column.total_sum_form_payment"),
    key: "total_summa",
    checked: true,
    right: true,
    is_sortable: false,
  },
  {
    name: t("column.available_count_for_return"),
    key: "available_count_for_return",
    checked: true,
    right: true,
    is_sortable: false,
  },
  {
    name: t("column.total_delivered_count"),
    key: "total_delivered_count",
    checked: true,
    right: true,
    is_sortable: false,
  },
]);
// methods
const closeDialog = () => emit("closeDialog");

const onSave = () => {
  emit("onSave");
};

const applyDisabled = computed(() => {
  return productCategoriesConst.value?.some((item) => {
    const hasExceededReturnLimit = item.products?.some(
      (product) =>
        product.available_count_for_return <
        (product.returning_count || 0) +
          (product.returning_count_as_payment || 0),
    );

    if (hasExceededReturnLimit) {
      return true;
    }

    const totalReturningCount = item.products.reduce(
      (total, product) =>
        total +
        (product.returning_count || 0) +
        (product.returning_count_as_payment || 0),
      0,
    );

    return totalReturningCount < item.min_returning_amount;
  });
});

const onChangeActiveCategoryId = (categoryId: string) => {
  orderRefundProducts.value = productCategoriesConst.value?.find(
    (item) => item.id === categoryId,
  )?.products;
};

const updateProducts = (products, categoryId) => {
  if (!productCategoriesConst.value) return;
  productCategoriesConst.value = productCategoriesConst.value.map((category) =>
    category.id === categoryId ? { ...category, products } : category,
  );
  orderRefundProducts.value = products;

  const bonus_products = productCategoriesConst.value?.reduce(
    (acc, { id: bonus_id, products: items }) => {
      (items || []).forEach(
        ({
          product: { id: product_id },
          returning_count,
          returning_count_as_payment,
          price,
          replacements,
        }) => {
          const bonusProduct = {
            product_id,
            bonus_id,
            count: returning_count || 0,
            returned_count_as_payment: returning_count_as_payment || 0,
            replacements:
              replacements
                ?.filter(
                  (p) =>
                    p.returning_count > 0 || p.returning_count_as_payment > 0,
                )
                ?.map((nItem) => {
                  return {
                    bonus_id: bonus_id,
                    product_id: nItem.id,
                    count: nItem.returning_count || 0,
                    returned_count_as_payment:
                      nItem.returning_count_as_payment || 0,
                  };
                }) || [],
          };
          if (props.forBonusEdit) {
            bonusProduct.price = price;
          }
          if (
            bonusProduct.count > 0 ||
            bonusProduct.returned_count_as_payment > 0
          ) {
            acc.push(bonusProduct);
          }
        },
      );
      return acc;
    },
    [],
  );

  returningBonusProducts.value = bonus_products;

  emit("onApplyBonus", bonus_products);
};

const getReplacementProduct = async (
  id: string,
  replacementProductGroupId: string,
) => {
  const product = orderRefundProducts.value?.find(
    (item) => item.product.id === id,
  );
  if (!product?.replacements?.length) {
    const params = {
      agent_id: createOrdersStore.dataOrderRefundDetail?.agent?.id,
      warehouse_id: createOrdersStore.dataOrderRefundDetail?.warehouse?.id,
      price_type_id: createOrdersStore.dataOrderRefundDetail?.price_type?.id,
      state_filter_type: 1,
      filter: [
        {
          field: "replacement_product_group_id",
          value: [replacementProductGroupId],
        },
      ],
    };
    product.replacements =
      await createOrdersStore.getSharedDataProductsByAgent(params);
  }
};

const updateReplacementProducts = (
  productId: string,
  productReplacementId: string,
  value: number,
  key: string,
) => {
  const product = orderRefundProducts.value?.find(
    (item) => item.product.id === productId,
  );

  if (!product || !product.replacements) return;

  const replacementProduct = product.replacements.find(
    (item) => item.id === productReplacementId,
  );

  if (!replacementProduct) return;

  replacementProduct[key] = value;

  product[key] =
    product.replacements.reduce((total, rep) => total + (rep[key] || 0), 0) ||
    null;
};
<\/script>
`;export{n as default};
