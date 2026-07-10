const a=`<template>
  <dashboard-doughnut-chart
    :title="t('dashboard.finance.debt')"
    :is-loading="isLoading"
    :data="chartData"
    :classes="{ root: 'h-full' }"
  />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { DashboardFinanceDebtChartSummaryModel } from "~/interfaces/api/dashboard/finance-model";

// Composables
const { t } = useI18n();

// Stores
const dashboardFinanceStore = useDashboardFinanceStore();

// States
const data = ref<DashboardFinanceDebtChartSummaryModel>();
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
  try {
    isLoading.value = true;

    const response = await dashboardFinanceStore.getDebtChartSummary();

    data.value = response.data;
  } catch (error) {
    console.error("Error loading debt chart data:", error);
  } finally {
    isLoading.value = false;
  }
}

const chartData = computed(() => {
  if (!data.value) return undefined;
  const total = data.value.total_paid + data.value.total_unpaid;

  return [
    {
      label: "Оплачено",
      value: data.value.total_paid,
      percent: total ? Math.round((data.value.total_paid / total) * 100) : 0,
      color: "#06b721",
    },
    {
      label: "Долг",
      value: data.value.total_unpaid,
      percent: total ? Math.round((data.value.total_unpaid / total) * 100) : 0,
      color: "#DE1F1F",
    },
  ];
});
<\/script>
`;export{a as default};
