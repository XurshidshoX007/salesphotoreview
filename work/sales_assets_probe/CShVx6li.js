const a=`<template>
  <dashboard-sales-dashboard-line-chart-card :chart-data="chartData">
    <template #header>{{ t("dashboard.plan_fact.daily_sale") }}</template>
  </dashboard-sales-dashboard-line-chart-card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getFormattedDate } from "~/utils/formatters";
import { getHexByTWColor, hexToRgba } from "~/utils/helpers";
import type { DailySalesReportModel } from "~/interfaces/api/dashboard/plan-task/daily-sales-report-model";

// Types
type Props = {
  data: DailySalesReportModel;
};

// Props
const props = defineProps<Props>();

// Composables
const { t } = useI18n();

// States
const COLOR_SALES = getHexByTWColor("bg-green-500");

// Hooks
const chartData = computed(() => {
  if (!props.data?.length) {
    return {
      labels: [],
      datasets: [
        {
          label: t("dashboard.daily_sales"),
          borderColor: COLOR_SALES,
          backgroundColor: hexToRgba(COLOR_SALES, 0.1),
          data: [],
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }

  const labels = props.data.map((item) =>
    getFormattedDate(item.date, "DD MMM"),
  );
  const salesData = props.data.map((item) => item.sales_amount?.amount || 0);

  return {
    labels,
    datasets: [
      {
        label: t("dashboard.daily_sales"),
        borderColor: COLOR_SALES,
        backgroundColor: hexToRgba(COLOR_SALES, 0.1),
        data: salesData,
        tension: 0.4,
        fill: true,
      },
    ],
  };
});
<\/script>
`;export{a as default};
