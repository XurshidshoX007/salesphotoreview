const n=`<template>
  <div class="flex flex-col gap-2.5 pb-2.5 w-max min-w-full">
    <div
      v-for="item in props.categories"
      :key="item.category.id"
      class="p-2.5 bg-neutral-50 rounded-lg space-y-2.5"
    >
      <div class="grid grid-cols-[auto_auto_1fr] items-center gap-2">
        <span class="font-medium min-w-[150px]">
          {{ item.category.name }}
        </span>
        <span class="h-7 py-1 px-2 bg-white rounded-lg font-semibold">
          {{ item.total.count }} {{ t("count") }}
        </span>
        <span class="h-7 py-1 px-2 bg-white rounded-lg ml-auto font-semibold">
          {{ getFormattedAmount(getOriginalPrice(item.products)) }} {{ baseCurrency }}
        </span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-neutral-600"> {{ t("column.discount") }} </span>
        <span
          class="h-7 py-1 px-2 bg-white rounded-lg text-primary-600 ml-auto font-semibold"
        >
          {{ getDiscountPercent(item.products) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getFormattedAmount, type OrderDetailModel } from "#imports";
import { useI18n } from "vue-i18n";

// Types
type Props = {
  categories: OrderDetailModel["product_categories"];
  baseCurrency?: string;
};

// Props
const props = defineProps<Props>();

// Composables
const { t } = useI18n();

// Methods
type CategoryProducts =
  OrderDetailModel["product_categories"][number]["products"];

const getOriginalPrice = (products: CategoryProducts) => {
  return products.reduce((sum, p) => sum + p.price * p.count, 0);
};

const getDiscountPercent = (products: CategoryProducts) => {
  const originalPrice = getOriginalPrice(products);
  if (!originalPrice) return 0;

  const discountSum = products.reduce(
    (sum, p) => sum + (p.price * p.count * (p.rebate || 0)) / 100,
    0,
  );

  return ((discountSum / originalPrice) * 100).toFixed(2);
};
<\/script>
`;export{n as default};
