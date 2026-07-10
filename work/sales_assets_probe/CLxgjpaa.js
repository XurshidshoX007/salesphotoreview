const a=`<template>
  <dashboard-sales-dashboard-line-chart-card
    :chart-data="chartData"
    :options="chartOptions"
    :has-data="hasData"
  >
    <template #header>{{ t("dashboard.sales.sales_dynamics") }}</template>
  </dashboard-sales-dashboard-line-chart-card>
</template>

<script setup lang="ts">
import type { ChartOptions } from "chart.js";
import { useI18n } from "vue-i18n";
import { getHexByTWColor, hexToRgba } from "~/utils/helpers";
import { getFormattedDate } from "~/utils/formatters";

// Composables
const { t } = useI18n();

// Stores
const dashboardStore = useSalesDashboardStore();

const LINE_COLOR = getHexByTWColor("bg-green-500");

const hasData = computed(() => {
  const apiData = dashboardStore.chartSummaryData;
  return !!apiData?.dates?.length;
});

// States
const chartOptions: ChartOptions<"line"> = {
  scales: {
    y: {
      ticks: {
        callback: (value: unknown) => Number(value).toLocaleString(),
      },
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (context: { dataset: { label?: string }; raw: unknown }) =>
          (context.dataset.label ?? "") +
          ": " +
          Number(context.raw).toLocaleString(),
      },
    },
  },
};

// Hooks
const chartData = computed(() => {
  const apiData = dashboardStore.chartSummaryData;

  if (!apiData?.dates?.length) {
    return {
      labels: [],
      datasets: [
        {
          label: t("dashboard.sales.sales_dynamics"),
          borderColor: LINE_COLOR,
          backgroundColor: hexToRgba(LINE_COLOR, 0.1),
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
  const salesData = apiData.dates.map((item) => item.sales_amount || 0);

  return {
    labels,
    datasets: [
      {
        label: t("dashboard.sales.sales_dynamics"),
        borderColor: LINE_COLOR,
        backgroundColor: hexToRgba(LINE_COLOR, 0.1),
        data: salesData,
        tension: 0.4,
        fill: true,
      },
    ],
  };
});
<\/script>
`;export{a as default};
