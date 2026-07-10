const t=`<template>
  <flex-col class="gap-3">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <page-title v-show="title" :title="title" />
      <div
        v-show="type === 'bonus'"
        @click="onEditBonus"
        class="underline cursor-pointer hover:text-[#299B9B]"
      >
        {{ t("edit") }}
      </div>
    </div>
    <div class="table-content-container info-table">
      <div class="table-content-body info-table-body">
        <data-table :headers="headers" :is-empty="!data?.length">
          <template #body>
            <c-tr v-for="item in data" :key="item">
              <c-td-no-edit
                v-for="key in headers"
                :key="key"
                :is-checked="key.checked"
              >
                <div>
                  <div v-if="typeof item[key.key] === 'object'">
                    {{ item[key.key]?.name }}
                  </div>
                  <div
                    v-else-if="typeof item[key.key] === 'number'"
                    class="text-end"
                  >
                    {{ getFormattedAmount(item[key.key]) }}
                  </div>
                  <div v-else-if="key.key === 'product-count'" class="text-end">
                    {{ getProductsTotalCount(item?.products) }}
                  </div>
                  <div v-else-if="key.key === 'totalSum'" class="text-end">
                    {{ getProductsTotalCost(item?.products) }}
                  </div>
                  <div
                    v-else-if="key.key === 'total_summa'"
                    class="text-end mr-1"
                  >
                    {{ getTotalSumma(item) }}
                  </div>
                  <div v-else>
                    {{ item[key.key] }}
                  </div>
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
          <template #footer>
            <c-tr v-if="data?.length" class="bg-neutral-50 border-b-0">
              <c-td-no-edit v-for="(key, index) in headers" :key="key.key">
                <div v-if="index === 0" class="fw-6 text-black">
                  {{ t("column.total") }}
                </div>
                <div
                  v-else-if="key.key === 'product-count'"
                  class="text-end fw-6 text-black"
                >
                  {{ getFormattedAmount(totalCount) }}
                </div>
                <div
                  v-else-if="key.key === 'count'"
                  class="text-end fw-6 text-black"
                >
                  {{ getFormattedAmount(totalCount) }}
                </div>
                <div
                  v-else-if="key.key === 'returned_count_as_payment'"
                  class="text-end fw-6 text-black"
                >
                  {{ getFormattedAmount(totalReturnedCount) }}
                </div>
                <div
                  v-else-if="key.key === 'totalSum'"
                  class="text-end fw-6 text-black"
                >
                  {{ getFormattedAmount(totalCost) }}
                </div>
                <div
                  v-else-if="key.key === 'total_summa'"
                  class="text-end fw-6 text-black"
                >
                  {{ getFormattedAmount(totalCost) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
    </div>
  </flex-col>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  data: {
    count: number;
    category_name: string;
    total_cost: number;
  }[];
  headers: Template[];
  totalCount?: number | string;
  totalCost?: number | string;
  totalReturnedCount?: number | null;
  title?: string;
  type?: string;
}>();
// emits
const emit = defineEmits(["onEditBonus"]);

const { t } = useI18n();
// methods
const getProductsTotalCount = (productsArr: unknown[]) => {
  if (!productsArr?.length) return;
  let totalCount = 0;
  for (let product of productsArr) {
    totalCount += product?.count;
  }
  return getFormattedAmount(totalCount);
};

const isReturnedCountColumn = computed(() => {
  return !!props.headers?.find(
    (item) => item?.key === "returned_count_as_payment"
  );
});

const getProductsTotalCost = (productsArr: unknown[]) => {
  if (!productsArr?.length) return;
  let totalSum = 0;
  for (let product of productsArr) {
    totalSum += product?.cost;
  }
  return getFormattedAmount(totalSum);
};

const getTotalSumma = (item: {
  price: number;
  count: number;
  returned_count_as_payment: number;
}) => {
  return getFormattedAmount(
    item.price *
      (isReturnedCountColumn.value
        ? item?.returned_count_as_payment
        : item?.count)
  );
};

const onEditBonus = () => emit("onEditBonus");
<\/script>
<style lang="scss">
.table-content-body {
  overflow: hidden;
}
.info-table-body {
  padding-bottom: 0 !important;
}
.info-table {
  overflow: hidden;

  thead {
    tr {
      border-top: none !important;
    }
  }
}
</style>
`;export{t as default};
