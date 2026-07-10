const n=`<template>
  <flex-col class="gap-3">
    <skeleton-block v-if="isLoading" height="30vh" />
    <div v-for="(total, totalIdx) in totals" :key="total?.order_group_type">
      <page-title :title="total?.order_group_type_name" />
      <div
        class="rounded-lg bg-white border-grey overflow-auto table-containers"
      >
        <data-table
          with-information-above-header
          :headers="headers"
          class="relative"
          :loading="isLoading"
        >
          <template #body>
            <template
              v-for="(data, index) in total?.categories"
              :key="data.category?.id"
            >
              <c-tr
                class="border-b-0 b-bottom cursor-pointer"
                :class="{ 'bg-[#F5FBFB]': data?.is_bonus }"
              >
                <c-td-no-edit
                  v-for="key in headers"
                  :key="key"
                  :type="key.type"
                >
                  <div v-if="key.key === 'no'">
                    {{ data?.is_bonus ? t("column.bonus") : ++index }}
                  </div>

                  <div
                    v-else-if="key.key === 'category'"
                    class="flex min-w-max"
                    @click="
                      onToggleCategoryDropDown(
                        data?.is_bonus
                          ? data.category.id + 'bonus' + totalIdx
                          : data.category.id + totalIdx
                      )
                    "
                  >
                    <flex-row class="items-center gap-2">
                      <IconArrowBottom
                        class="cursor-pointer"
                        :class="[
                          (isCategoryOpen(
                            data?.is_bonus
                              ? data.category.id + 'bonus' + totalIdx
                              : data.category.id + totalIdx
                          ) &&
                            'rotate-180 transition-all') ||
                            'rotate-0 transition-all',
                        ]"
                      />
                      <div class="text-base text-primary-600">
                        {{ data[key.key]?.name }}
                      </div>
                    </flex-row>
                  </div>
                  <div v-else>
                    {{ getFormattedAmount(data[key.key]) }}
                  </div>
                </c-td-no-edit>
              </c-tr>
              <template
                v-if="
                  isCategoryOpen(
                    data?.is_bonus
                      ? data.category.id + 'bonus' + totalIdx
                      : data.category.id + totalIdx
                  )
                "
              >
                <c-tr
                  v-for="product in data.products_arr"
                  :key="product"
                  class="bg-[#F4F9F9]"
                >
                  <c-td-no-edit v-for="key in headers" :key="key">
                    <div
                      v-if="key.key === 'category'"
                      class="whitespace-nowrap"
                    >
                      {{ product.product.name }}
                    </div>
                    <div v-else class="text-end">
                      {{ getFormattedAmount(product[key.key]) }}
                    </div>
                  </c-td-no-edit>
                </c-tr>
              </template>
            </template>
          </template>
          <template #footer>
            <c-tr class="border-b-0 bg-neutral-50">
              <c-td-no-edit v-for="key in headers" :key="key.key">
                <div v-if="key.key === 'category'" class="fw-6">
                  {{ t("column.total") }}
                </div>
                <div v-else class="fw-6 text-end">
                  {{ getFormattedAmount(total?.total[key.key]) }}
                </div>
              </c-td-no-edit>
            </c-tr>
            <c-tr
              v-show="total?.show_total_with_bonuses"
              class="bg-neutral-50 border-b-0"
            >
              <c-td-no-edit v-for="key in headers" :key="key.key">
                <div v-if="key.key === 'category'" class="fw-6">
                  {{ t("orders.total_with_bonus") }}
                </div>
                <div v-else class="fw-6 text-end">
                  {{ getFormattedAmount(total?.total_with_bonuses[key.key]) }}
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
import { getFormattedAmount } from "~/utils/filter";
import type { TotalsByOrdersModel } from "~/interfaces/api/orders/totals-by-orders-model";
import type { Template } from "~/interfaces/ui/template";
import { useI18n } from "vue-i18n";
// store
const orderStore = useOrdersStore("main");

// State
const { t } = useI18n();
const totals = ref<TotalsByOrdersModel[] | undefined>([]);
const activeCategoryIds = ref<string[]>([]);
const isFirstTimeLoading = ref<boolean>(false);
const isLoading = ref<boolean>(false);

const headers = ref<Template[]>([
  {
    name: "№",
    checked: true,
    key: "no",
    is_sortable: false,
  },
  {
    name: t("column.category"),
    checked: true,
    key: "category",
    is_sortable: false,
  },
  {
    name: t("column.unit_count"),
    checked: true,
    key: "unit_count",
    type: "number",
    is_sortable: false,
  },
  {
    name: t("column.quantity"),
    checked: true,
    key: "count",
    type: "number",
    is_sortable: false,
  },
  {
    name: t("column.volume"),
    checked: true,
    key: "volume",
    type: "number",
    is_sortable: false,
  },
  {
    name: t("column.sum"),
    checked: true,
    key: "cost",
    type: "number",
    is_sortable: false,
  },
]);

watch(
  () => orderStore.orderIds.length,
  async () => await getTotals()
);

onMounted(async () => {
  isFirstTimeLoading.value = true;
  await getTotals();
  isFirstTimeLoading.value = false;
});

const onToggleCategoryDropDown = (categoryId: string) => {
  if (isCategoryOpen(categoryId)) {
    activeCategoryIds.value = activeCategoryIds.value.filter(
      (id) => id !== categoryId
    );
  } else {
    activeCategoryIds.value.push(categoryId);
  }
};

const isCategoryOpen = (categoryId: string) => {
  return activeCategoryIds.value.includes(categoryId);
};

const getTotals = async () => {
  isLoading.value = true;
  totals.value = await orderStore.getSeperateTotalsByOrders();
  isLoading.value = false;
};
<\/script>

<style scoped>
.b-bottom:last-child {
  border-bottom: 1px solid #e1e4e4;
}
.table-containers {
  padding-bottom: 0 !important;
}
</style>
`;export{n as default};
