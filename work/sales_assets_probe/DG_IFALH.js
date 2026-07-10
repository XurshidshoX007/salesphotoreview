const e=`<template>
  <dashboard-sales-dashboard-line-chart-card
    :chart-data="filteredData"
    :has-data="hasData"
  >
    <template #header>{{ t("dashboard.sales.orders_and_refusals") }}</template>
    <template #actions>
      <div class="flex gap-4 items-center justify-center flex-wrap">
        <div
          class="orders-refusals-checkbox-wrapper"
          :style="{ '--cb-checked': COLOR_ORDERS }"
        >
          <Checkbox
            :checked="showOrders"
            :title="t('sidebar.orders')"
            @update:modelValue="showOrders = $event"
            class="!gap-2"
          />
        </div>
        <div
          class="orders-refusals-checkbox-wrapper"
          :style="{ '--cb-checked': COLOR_REFUSALS }"
        >
          <Checkbox
            :checked="showRefusals"
            :title="t('sidebar.rejections')"
            @update:modelValue="showRefusals = $event"
            class="!gap-2"
          />
        </div>
      </div>
    </template>
  </dashboard-sales-dashboard-line-chart-card>
</template>

<script setup lang="ts">
import { getFormattedDate } from "~/utils/formatters";
import { getHexByTWColor, hexToRgba } from "~/utils/helpers";
import { useI18n } from "vue-i18n";

// Composables
const { t } = useI18n();

// Stores
const dashboardStore = useSalesDashboardStore();

// States
const showOrders = ref(true);
const showRefusals = ref(true);

const COLOR_ORDERS = getHexByTWColor("bg-green-500");
const COLOR_REFUSALS = getHexByTWColor("bg-red-550");

const hasData = computed(() => {
  const apiData = dashboardStore.chartSummaryData;
  return !!apiData?.dates?.length;
});

// Hooks
const chartData = computed(() => {
  const apiData = dashboardStore.chartSummaryData;

  if (!apiData?.dates?.length) {
    return {
      labels: [],
      datasets: [
        {
          label: t("sidebar.orders"),
          borderColor: COLOR_ORDERS,
          backgroundColor: hexToRgba(COLOR_ORDERS, 0.1),
          data: [],
          tension: 0.4,
          fill: true,
        },
        {
          label: t("sidebar.rejections"),
          borderColor: COLOR_REFUSALS,
          backgroundColor: hexToRgba(COLOR_REFUSALS, 0.1),
          data: [],
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }

  const labels = apiData.dates.map((item) =>
    getFormattedDate(item.date, "DD MMM"),
  );
  const orderData = apiData.dates.map((item) => item.order_count || 0);
  const rejectionData = apiData.dates.map((item) => item.rejection_count || 0);

  return {
    labels,
    datasets: [
      {
        label: t("sidebar.orders"),
        borderColor: COLOR_ORDERS,
        backgroundColor: hexToRgba(COLOR_ORDERS, 0.1),
        data: orderData,
        tension: 0.4,
        fill: true,
      },
      {
        label: t("sidebar.rejections"),
        borderColor: COLOR_REFUSALS,
        backgroundColor: hexToRgba(COLOR_REFUSALS, 0.1),
        data: rejectionData,
        tension: 0.4,
        fill: true,
      },
    ],
  };
});

const filteredData = computed(() => {
  const datasets = [];
  const src = chartData.value;
  if (showOrders.value && src.datasets[0]) datasets.push(src.datasets[0]);
  if (showRefusals.value && src.datasets[1]) datasets.push(src.datasets[1]);
  return { ...src, datasets };
});
<\/script>

<style scoped>
.orders-refusals-checkbox-wrapper:has(input:checked) :deep(.custom-checkbox) {
  background-color: var(--cb-checked) !important;
  border-color: var(--cb-checked) !important;
}
</style>
`;export{e as default};
