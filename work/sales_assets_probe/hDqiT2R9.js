const n=`<template>
  <card
    :classes="{
      root: 'w-full',
      header: 'text-xl font-semibold',
    }"
  >
    <dashboard-chart-no-data-overlay :has-data="hasData" />
    <template #header>
      <slot name="header" />
    </template>

    <div class="h-80 relative">
      <div
        ref="chartContainer"
        :class="[
          'absolute inset-0 overflow-x-auto overflow-y-hidden',
          { 'pointer-events-none': !hasData },
        ]"
      >
        <div
          :style="{
            minWidth: hasData ? minChartWidth : undefined,
            width: '100%',
            height: '100%',
          }"
        >
          <Line :data="displayData" :options="mergedOptions" />
        </div>
      </div>
    </div>

    <div
      v-if="$slots.actions"
      class="flex gap-4 items-center justify-center my-4 flex-wrap"
    >
      <slot name="actions" />
    </div>
  </card>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Line } from "vue-chartjs";

// Types
type ChartData = {
  labels: string[];
  datasets: Array<{
    label?: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    tension?: number;
    fill?: boolean;
    pointRadius?: number;
    pointHoverRadius?: number;
  }>;
};

type Props = {
  chartData: ChartData;
  options?: Partial<ChartOptions<"line">>;
  minChartWidth?: string;
  hasData?: boolean;
};

// Props
const props = withDefaults(defineProps<Props>(), {
  minChartWidth: "1200px",
  hasData: true,
});

// Mock data for no-data state
const mockData: ChartData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
  datasets: [
    {
      label: "",
      data: [30, 50, 40, 60, 45, 70, 55],
      borderColor: "#d1d5db",
      backgroundColor: "rgba(209, 213, 219, 0.2)",
      tension: 0.4,
      fill: true,
    },
  ],
};

const displayData = computed(() =>
  props.hasData ? props.chartData : mockData,
);

// States
const defaultOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      display: true,
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: unknown) => Number(value).toLocaleString(),
      },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: "index",
      intersect: false,
      callbacks: {
        label: (context: { dataset: { label?: string }; raw: unknown }) =>
          (context.dataset.label ?? "") +
          ": " +
          Number(context.raw).toLocaleString(),
      },
    },
  },
  interaction: {
    mode: "nearest",
    axis: "x",
    intersect: false,
  },
};

const noDataOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  events: [],
  scales: {
    x: {
      display: true,
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: unknown) => Number(value).toLocaleString(),
      },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
  },
};

// Hooks
const mergedOptions = computed((): ChartOptions<"line"> => {
  if (!props.hasData) {
    return noDataOptions;
  }
  const opts = props.options || {};
  return deepMerge(defaultOptions, opts) as ChartOptions<"line">;
});

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const srcVal = source[key];
    if (srcVal && typeof srcVal === "object" && !Array.isArray(srcVal)) {
      (result as any)[key] = deepMerge(
        (target[key] as object) || {},
        srcVal as object,
      );
    } else if (srcVal !== undefined) {
      (result as any)[key] = srcVal;
    }
  }
  return result;
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);
<\/script>
`;export{n as default};
