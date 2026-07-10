const n=`<template>
  <card :classes="{ header: 'mb-4', content: '@container' }">
    <template #header> {{ t("dashboard.finance.sale") }} </template>

    <div class="grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3 gap-4">
      <skeleton-block
        v-if="isLoading"
        v-for="i in 5"
        :key="i"
        height="76px"
        width="200px"
      />
      <div
        v-else
        v-for="(item, index) in items"
        :key="index"
        class="bg-[#F2F5F5] rounded-lg py-3 px-4 space-y-1"
      >
        <div class="text-neutral-600 font-medium text-sm">
          {{ item.key }}
        </div>
        <div class="text-neutral-950 font-semibold text-xl">
          {{ getFormattedAmount(item.value) }}
        </div>
      </div>
    </div>
  </card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getFormattedAmount } from "~/utils/filter";

// Composables
const { t } = useI18n();

// Stores
const dashboardFinanceStore = useDashboardFinanceStore();

// States
const items = ref<KeyValue[]>([]);
const isLoading = ref(false);

// Hooks
watch(
  () => dashboardFinanceStore.params,
  (params) => {
    if (!params.date_filter) return;

    loadData();
  },
  { immediate: true, deep: true },
);

// Methods
async function loadData() {
  isLoading.value = true;

  try {
    const response = await dashboardFinanceStore.loadSales();

    items.value = [
      ...response.data.items.map((item) => ({
        key: item.currency_code,
        value: item.amount,
      })),
      {
        key: response.data.total.base_currency_code,
        value: response.data.total.amount,
      },
    ];
  } catch (error) {
    console.error("Error loading sales data:", error);
  } finally {
    isLoading.value = false;
  }
}
<\/script>
`;export{n as default};
