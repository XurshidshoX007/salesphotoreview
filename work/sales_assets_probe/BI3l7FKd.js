const n=`<template>
  <div>
    <card
      :classes="{
        ...props.classes,
        root: ['flex flex-col', props.classes?.root],
        header: ['mb-4 text-xl font-semibold', props.classes?.header],
        content: [
          '@container flex-1 flex flex-col justify-center',
          props.classes?.content,
        ],
      }"
    >
      <dashboard-chart-no-data-overlay :has-data="hasData" />
      <template #header> {{ props.title }} </template>

      <div class="relative">
        <div
          :class="[
            'flex flex-col @md:flex-row gap-6 items-center',
            { 'pointer-events-none': !hasData },
          ]"
        >
          <div class="w-full max-w-[250px]">
            <div
              v-if="props.isLoading"
              class="animate-pulse aspect-square bg-gray-200 dark:bg-gray-400 rounded-full flex items-center justify-center"
            >
              <div class="bg-white size-[88%] rounded-full" />
            </div>
            <Doughnut
              v-else
              ref="chartRef"
              :data="displayChartData"
              :options="displayOptions"
            />
          </div>

          <div class="space-y-2.5 w-full max-h-[220px] overflow-y-auto">
            <skeleton-block
              v-if="props.isLoading"
              v-for="i in 5"
              :key="i"
              height="36px"
            />
            <template v-else>
              <button
                v-for="(item, index) in displayData"
                :key="\`\${item.label}-\${index}\`"
                :class="
                  cn(
                    'flex items-center justify-between w-full h-9 px-3 py-2 rounded-lg bg-[#f2f5f5] transition-colors',
                    { 'opacity-50': hiddenIndices.has(index) },
                    { 'hover:bg-[#e6e9e9]': hasData },
                  )
                "
                :disabled="!hasData"
                @click="onItemClick(index, item)"
                @mouseenter="showTooltip(index)"
                @mouseleave="hideTooltip"
              >
                <span
                  class="size-4 rounded-full inline-block mr-3 flex-shrink-0"
                  :style="{
                    backgroundColor: hasData
                      ? getBackgroundColor(index)
                      : item.color,
                  }"
                />
                <span class="truncate">{{ item.label }}</span>
                <span class="ml-2 whitespace-nowrap flex items-center gap-1">
                  <span class="font-semibold">{{ item.percent }}</span>
                  %
                  <img
                    v-if="item.isOthers && props.modalTitle && hasData"
                    :src="ArrowRightIcon"
                    alt=""
                    class="w-[7px] h-[10px] ml-2"
                  />
                </span>
              </button>
            </template>
          </div>
        </div>
      </div>
    </card>

    <dashboard-doughnut-chart-modal
      v-if="props.modalTitle"
      v-model="isDetailsModalOpen"
      :modal-title="props.modalTitle"
      :items="allItemsSorted"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { Doughnut, type ChartComponentRef } from "vue-chartjs";
import { cn } from "#imports";
import { getFormattedAmount } from "~/utils/filter";
import ArrowRightIcon from "~/assets/svg/arrow-right.svg?url";
import type { cardVariants } from "~/components/global/Card/variants";
import type { ClassValue } from "clsx";

// Types
type DoughnutData = {
  label: string;
  value: number;
  percent: number;
  color?: string;
};

type ProcessedDoughnutData = DoughnutData & {
  isOthers?: boolean;
};

type Props = {
  data: DoughnutData[] | undefined;
  title: string;
  isLoading: boolean;
  modalTitle?: string;
  classes?: Partial<Record<keyof typeof cardVariants.slots, ClassValue>>;
};

// Props
const props = defineProps<Props>();

// Composables
const { t } = useI18n();

// States
const chartRef = ref<ChartComponentRef | null>(null);
const hiddenIndices = reactive(new Set<number>());
const isDetailsModalOpen = ref(false);

const defaultParams = {
  borderWidth: 0,
  spacing: 6,
  borderRadius: 4,
};

// Mock data for no-data state
const mockData: ProcessedDoughnutData[] = [
  { label: "Lorem ipsum", value: 35, percent: 35, color: "#d1d5db" },
  { label: "Dolor sit amet", value: 25, percent: 25, color: "#9ca3af" },
  { label: "Consectetur", value: 20, percent: 20, color: "#6b7280" },
  { label: "Adipiscing elit", value: 12, percent: 12, color: "#4b5563" },
  { label: "Sed do eiusmod", value: 8, percent: 8, color: "#374151" },
];

const mockChartData: ChartData<"doughnut", number[], string> = {
  labels: mockData.map((d) => d.label),
  datasets: [
    {
      data: mockData.map((d) => d.value),
      backgroundColor: mockData.map((d) => d.color || "#d1d5db"),
      hoverOffset: 0,
      ...defaultParams,
    },
  ],
};

const options = ref<ChartOptions<"doughnut">>({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "85%",
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true,
      callbacks: {
        label: (context) => {
          const dataIndex = context.dataIndex;
          const value = props.data?.at(dataIndex)?.value || 0;

          return getFormattedAmount(value).toString();
        },
      },
    },
  },
});

const noDataOptions = ref<ChartOptions<"doughnut">>({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "85%",
  events: [],
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: false,
    },
  },
});

const chartData = ref<ChartData<"doughnut", number[], string>>({
  labels: [],
  datasets: [
    {
      data: [],
      backgroundColor: [],
      hoverOffset: 0,
      ...defaultParams,
    },
  ],
});

// Hooks
const hasData = computed(() => {
  return !!(
    props.isLoading ||
    (chartData.value.labels?.length &&
      chartData.value.datasets?.[0]?.data?.length)
  );
});

const displayChartData = computed(() =>
  hasData.value ? chartData.value : mockChartData,
);

const displayData = computed(() =>
  hasData.value ? processedData.value : mockData,
);

const displayOptions = computed(() =>
  hasData.value ? options.value : noDataOptions.value,
);

const processedData = computed<ProcessedDoughnutData[]>(() => {
  const source = props.data ?? [];

  if (!props.modalTitle || source.length <= 5) {
    return source;
  }

  const visibleItems = source.slice(0, 4);
  const otherItems = source.slice(4);

  const othersValue = otherItems.reduce(
    (sum, item) => sum + (item.value || 0),
    0,
  );
  const othersPercent = otherItems.reduce(
    (sum, item) => sum + (item.percent || 0),
    0,
  );

  const othersItem: ProcessedDoughnutData = {
    label: t("dashboard.sales.others"),
    value: othersValue,
    percent: Number(othersPercent.toFixed(2)),
    color: "#22C55E",
    isOthers: true,
  };

  return [...visibleItems, othersItem];
});

const allItemsSorted = computed<DoughnutData[]>(() => {
  const items = props.data ?? [];
  return [...items].sort((a, b) => b.value - a.value);
});

ChartJS.register(ArcElement, Tooltip);

watch(
  () => processedData.value,
  (data) => {
    if (!data.length) {
      chartData.value = {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
            hoverOffset: 0,
            ...defaultParams,
          },
        ],
      };
      hiddenIndices.clear();
      return;
    }

    chartData.value = {
      labels: data.map((d) => d.label),
      datasets: [
        {
          data: data.map((d) => d.value),
          backgroundColor: data.map((d) => d.color || "#000"),
          hoverOffset: 0,
          ...defaultParams,
        },
      ],
    };
  },
  { immediate: true },
);

// Methods
function getBackgroundColor(index: number): string {
  const dataset = chartData.value.datasets?.[0];
  if (!dataset) return "#000";

  const bgColors = dataset.backgroundColor;
  if (Array.isArray(bgColors) && bgColors[index]) {
    return bgColors[index];
  }

  return "#000";
}

function toggle(index: number) {
  const chart = chartRef.value?.chart;
  if (!chart) return;

  chart.toggleDataVisibility(index);
  chart.update();

  if (hiddenIndices.has(index)) {
    hiddenIndices.delete(index);
  } else {
    hiddenIndices.add(index);
  }
}

function onItemClick(index: number, item: ProcessedDoughnutData) {
  if (item.isOthers && props.modalTitle) {
    openDetailsModal();
    return;
  }

  toggle(index);
}

function showTooltip(index: number) {
  const chart = chartRef.value?.chart;
  if (!chart) return;

  chart.tooltip?.setActiveElements(
    [
      {
        datasetIndex: 0,
        index: index,
      },
    ],
    {
      x: 0,
      y: 0,
    },
  );
  chart.update();
}

function hideTooltip() {
  const chart = chartRef.value?.chart;
  if (!chart) return;

  chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
  chart.update();
}

function openDetailsModal() {
  isDetailsModalOpen.value = true;
}
<\/script>

<style scoped>
canvas {
  width: 100% !important;
  height: 100% !important;
}

::-webkit-scrollbar {
  width: 6px;
}
</style>
`;export{n as default};
