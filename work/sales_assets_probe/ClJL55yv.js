const n=`<template>
  <div v-if="type === 'bonus'" class="text-gray-3 font-semibold">
    {{ t("orders.minimum_return_quantity") }}:
    <span :class="{ 'text-red-5': minReturningBonusAmount > 0 }">{{
      minReturningBonusAmount
    }}</span>
  </div>
  <div class="border-1 rounded-large max-h-[38vh] overflow-auto">
    <data-table
      :headers="headers"
      :isEmpty="!products?.length"
      :loading="isLoading"
      withInformationAboveHeader
      border-b
      class="whitespace-nowrap"
    >
      <template #body>
        <c-tr
          v-for="product in products"
          :key="product.product_id + product?.bonus_id"
          class="last-border-none"
        >
          <c-td-no-edit v-for="key in headers" :key="key.key">
            <div v-if="key.view === 'input'">
              <d-input
                :min="isReturningCount(key.key) && 0"
                type="number"
                :value="getInputValue(product, key.key)"
                :max="isReturningCount(key.key) && product?.total_count"
                :disabled="isInputDisabled(key.key)"
                :required="typeof getInputValue(product, key.key) !== 'number'"
                :class="!isReturningCount(key.key) && 'w-1/2'"
                @change="
                  isReturningCount(key.key) &&
                  onChangeReturnCount(product, $event)
                "
              />
            </div>
            <div v-else class="py-4">
              {{ product[key.key] }}
            </div>
          </c-td-no-edit>
        </c-tr>
      </template>
    </data-table>
  </div>
</template>

<script setup lang="ts">
import type { OrderPartialReturnBonusProductModel } from "~/interfaces/api/orders/order-partial-return-bonus-model";
import type { OrderPartialReturnProductModel } from "~/interfaces/api/orders/order-partial-return-detail-model";
import type { Template } from "~/interfaces/ui/template";
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  type: "product" | "bonus";
  headers: Template[];
  products?:
    | OrderPartialReturnProductModel[]
    | OrderPartialReturnBonusProductModel[];
  isLoading?: boolean;
  minReturningAmount?: number;
  allInputsDisabled?: boolean;
}>();

//states

const { t } = useI18n();

// emits
const emit = defineEmits(["updateProduct"]);

// hooks
const minReturningBonusAmount = computed(() => {
  if (props.type === "bonus" && props.minReturningAmount !== undefined) {
    const totalReturningAmount = props.products?.reduce(
      (acc, product) => acc + product.returning_count,
      0,
    );
    const currentMinReturningAmount =
      props.minReturningAmount - totalReturningAmount!;

    return currentMinReturningAmount > 0 ? currentMinReturningAmount : 0;
  }
});

// methods
const isReturningCount = (key: string) => {
  return key === "returning_count";
};

const isInputDisabled = (key: keyof OrderPartialReturnProductModel) => {
  return !isReturningCount(key) || props.allInputsDisabled;
};

const getInputValue = (
  product: OrderPartialReturnProductModel,
  key: keyof OrderPartialReturnProductModel,
) => {
  return product[key];
};

const onCalculateDeliverCount = (
  deliveringCount: number,
  returningCount: number,
): number => {
  return deliveringCount - returningCount;
};

const onChangeReturnCount = (
  product: OrderPartialReturnProductModel | OrderPartialReturnBonusProductModel,
  returningCount: number,
) => {
  const { product_id: productId, price, total_count: totalCount } = product;

  const deliveringCountAfterReturn = onCalculateDeliverCount(
    totalCount,
    returningCount,
  );
  emit(
    "updateProduct",
    productId,
    returningCount,
    deliveringCountAfterReturn,
    price,
    product?.bonus_id,
  );
};
<\/script>

<style scoped>
::-webkit-scrollbar {
  width: 9px;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
}
</style>
`;export{n as default};
