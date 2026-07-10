const t=`<template>
  <div class="flex justify-end">
    <data-table
      :isEmpty="!discounts?.length"
      class="min-w-60 rounded-lg overflow-auto border-grey"
    >
      <template #header>
        <c-tr class="bg-neutral-50 border-t-0">
          <c-td-no-edit>
            <div class="secondary-gray-text">{{ t("column.discount") }}</div>
          </c-td-no-edit>
          <c-td-no-edit>
            <div class="secondary-gray-text text-right">
              {{ t("column.discount") }}
            </div>
          </c-td-no-edit>
          <c-td-no-edit>
            <div class="secondary-gray-text text-right">
              {{ t("column.quantity") }}
            </div>
          </c-td-no-edit>
        </c-tr>
      </template>

      <template #body>
        <c-tr
          v-for="item in discounts"
          :key="item.discount.id"
          class="border-b-0"
        >
          <c-td-no-edit>{{ item.discount.name }}</c-td-no-edit>
          <c-td-no-edit class="text-right">{{ item.rebate }}%</c-td-no-edit>
          <c-td-no-edit class="text-right">{{ item.count }}</c-td-no-edit>
        </c-tr>
      </template>
    </data-table>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ProductDiscountModel } from "~/interfaces/api/orders/order-detail-model";

defineProps<{
  discounts: ProductDiscountModel[];
}>();

const { t } = useI18n();
<\/script>
`;export{t as default};
