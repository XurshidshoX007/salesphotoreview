const n=`<template>
  <card
    :classes="{
      root: 'w-full',
      header:
        'mb-4 flex gap-4 items-center justify-between text-xl font-semibold',
      content: '',
    }"
  >
    <template #header>{{
      t("dashboard.plan_fact.sales_by_channels")
    }}</template>

    <div class="h-80 relative">
      <div
        ref="chartContainer"
        class="absolute inset-0 overflow-x-auto overflow-y-hidden"
      >
        <div style="width: 100%; height: 100%">
          <Bar :data="data" :options="options" />
        </div>
      </div>
    </div>
  </card>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ScriptableContext,
} from "chart.js";
import { Bar } from "vue-chartjs";
import { useI18n } from "vue-i18n";
import { getHexByTWColor } from "~/utils/helpers";
import type { SalesChannelReportModel } from "~/interfaces/api/dashboard/plan-task/sales-channel-report-model";

// Types
type Props = {
  data: SalesChannelReportModel;
};

// Props
const props = defineProps<Props>();

// Composables
const { t } = useI18n();

// States
const BAR_COLOR = getHexByTWColor("bg-primary-250");
const BAR_COLOR_LIGHT = getHexByTWColor("bg-primary-400");
const CAP_COLOR = getHexByTWColor("bg-primary-100");

const createBarGradient = (context: ScriptableContext<"bar">) => {
  const { ctx, chartArea } = context.chart;

  if (!chartArea) return BAR_COLOR;

  const gradient = ctx.createLinearGradient(
    0,
    chartArea.bottom,
    0,
    chartArea.top,
  );
  gradient.addColorStop(0, BAR_COLOR);
  gradient.addColorStop(1, BAR_COLOR_LIGHT);

  return gradient;
};

const options = ref({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: true,
      categoryPercentage: 0.8,
      barPercentage: 0.6,
      ticks: {
        autoSkip: false,
      },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      ticks: {
        callback: function (value: unknown) {
          return Number(value).toLocaleString();
        },
      },
    },
  },
  datasets: {
    bar: {
      barThickness: 56,
      maxBarThickness: 60,
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: function (context: { raw: unknown }) {
          return Number(context.raw).toLocaleString();
        },
      },
    },
  },
});

// Hooks
const chartData = computed(() => {
  if (!props.data?.length) {
    return {
      labels: [],
      datasets: [
        {
          label: t("column.total_sum"),
          backgroundColor: BAR_COLOR,
          borderRadius: 0,
          data: [],
        },
        {
          label: "Cap",
          backgroundColor: CAP_COLOR,
          borderRadius: 12,
          data: [],
        },
      ],
    };
  }

  const labels = props.data.map((item) => item.sales_channel?.name || "");
  const values = props.data.map((item) => item.sales_amount?.amount || 0);

  const maxValue = Math.max(...values);
  const capHeight = Math.max(maxValue * 0.1, 1);

  return {
    labels,
    datasets: [
      {
        label: t("column.total_sum"),
        backgroundColor: (ctx: ScriptableContext<"bar">) =>
          createBarGradient(ctx),
        borderRadius: 0,
        data: values,
      },
      {
        label: "Cap",
        backgroundColor: CAP_COLOR,
        borderRadius: 12,
        data: labels.map(() => capHeight),
      },
    ],
  };
});

const data = computed(() => chartData.value);

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);
<\/script>
`;export{n as default};
