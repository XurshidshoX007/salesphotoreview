const n=`<template>
  <card
    :classes="{
      root: 'w-full',
      header:
        'mb-4 flex gap-4 items-center justify-between text-xl font-semibold',
      content: '',
    }"
  >
    <dashboard-chart-no-data-overlay :has-data="hasData" />
    <template #header>{{ t("dashboard.sales.rejection_reason") }}</template>

    <div class="h-80 relative">
      <div
        ref="chartContainer"
        :class="[
          'absolute inset-0 overflow-x-auto overflow-y-hidden',
          { 'pointer-events-none': !hasData },
        ]"
      >
        <div style="width: 100%; height: 100%">
          <Bar :data="displayData" :options="displayOptions" />
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

// Composables
const { t } = useI18n();

// Stores
const dashboardStore = useSalesDashboardStore();

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

const noDataOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  events: [],
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
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: false,
    },
  },
});

const displayOptions = computed(() =>
  hasData.value ? options.value : noDataOptions.value,
);

// Hooks
const chartData = computed(() => {
  const apiData = dashboardStore.chartSummaryData;

  if (!apiData?.rejections?.length) {
    return {
      labels: [],
      datasets: [
        {
          label: t("count"),
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

  const labels = apiData.rejections.map((item) => item.key);
  const values = apiData.rejections.map((item) => item.value);

  const maxValue = Math.max(...values);
  const capHeight = Math.max(maxValue * 0.1, 1);

  return {
    labels,
    datasets: [
      {
        label: t("count"),
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

const hasData = computed(() => {
  const apiData = dashboardStore.chartSummaryData;
  return !!apiData?.rejections?.length;
});

const mockBarData = {
  labels: ["A", "B", "C", "D", "E"],
  datasets: [
    {
      label: "",
      backgroundColor: "#d1d5db",
      borderRadius: 0,
      data: [40, 30, 50, 20, 35],
    },
    {
      label: "Cap",
      backgroundColor: "#e5e7eb",
      borderRadius: 12,
      data: [5, 5, 5, 5, 5],
    },
  ],
};

const displayData = computed(() => (hasData.value ? data.value : mockBarData));

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
