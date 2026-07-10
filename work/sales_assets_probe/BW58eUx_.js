const e=`<template>
  <dashboard-sales-dashboard-line-chart-card
    :chart-data="filteredData"
    :has-data="hasData"
  >
    <template #header>{{
      t("dashboard.sales.rejection_reasons_dynamics")
    }}</template>
    <template #actions>
      <div class="flex gap-4 items-center justify-center flex-wrap">
        <div
          v-for="(dataset, index) in chartData?.datasets || []"
          :key="dataset.label || index"
          class="rejection-checkbox-wrapper"
          :style="{
            '--cb-checked': dataset.borderColor || dataset.backgroundColor,
          }"
        >
          <Checkbox
            :checked="visibleReasons.has(dataset.label ?? '')"
            :title="dataset.label"
            @update:modelValue="onReasonChange(dataset.label, $event)"
            class="!gap-2"
          />
        </div>
      </div>
    </template>
  </dashboard-sales-dashboard-line-chart-card>
</template>

<script setup lang="ts">
import { getFormattedDate } from "~/utils/formatters";
import { useI18n } from "vue-i18n";

// Composables
const { t } = useI18n();

// Stores
const dashboardStore = useSalesDashboardStore();

// States
const visibleReasons = ref<Set<string>>(new Set());

const hasData = computed(() => {
  const apiData = dashboardStore.chartSummaryData;
  return !!apiData?.rejections?.length;
});

// Methods
const getColorForIndex = (index: number, total: number): string => {
  if (total <= 0) return getHexByTWColor("bg-gray-50");
  const hue = (index * (360 / Math.max(total, 1))) % 360;
  const saturation = 52;
  const lightness = 58;
  return \`hsl(\${hue}, \${saturation}%, \${lightness}%)\`;
};

const onReasonChange = (label: string | undefined, checked: boolean) => {
  if (!label) return;
  const next = new Set(visibleReasons.value);
  if (checked) next.add(label);
  else next.delete(label);
  visibleReasons.value = next;
};

// Hooks
const chartData = computed(() => {
  const apiData = dashboardStore.chartSummaryData;

  if (!apiData?.dates?.length) {
    return { labels: [], datasets: [] };
  }

  const labels = apiData.dates.map((item) =>
    getFormattedDate(item.date, "DD MMM"),
  );

  const allRejectionKeys = new Set<string>();
  apiData.dates.forEach((dateItem) => {
    dateItem.rejections?.forEach((rejection) => {
      allRejectionKeys.add(rejection.key);
    });
  });

  const rejectionKeys = Array.from(allRejectionKeys);

  const total = rejectionKeys.length;
  const datasets = rejectionKeys.map((key, index) => {
    const values = apiData.dates.map((dateItem) => {
      const rejection = dateItem.rejections?.find((r) => r.key === key);
      return rejection?.value || 0;
    });
    const color = getColorForIndex(index, total);
    return {
      label: key,
      borderColor: color,
      backgroundColor: color,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      data: values,
    };
  });

  return { labels, datasets };
});

const filteredData = computed(() => {
  if (!chartData.value?.datasets?.length) {
    return { labels: [], datasets: [] };
  }
  const filteredDatasets = chartData.value.datasets.filter(
    (dataset: { label?: string }) =>
      visibleReasons.value.has(dataset.label ?? ""),
  );
  return {
    labels: chartData.value.labels,
    datasets: filteredDatasets,
  };
});

watch(
  chartData,
  (newData) => {
    if (newData?.datasets?.length) {
      const next = new Set(visibleReasons.value);
      newData.datasets.forEach((dataset: { label?: string }) => {
        if (dataset.label) next.add(dataset.label);
      });
      visibleReasons.value = next;
    }
  },
  { immediate: true },
);
<\/script>

<style scoped>
.rejection-checkbox-wrapper:has(input:checked) :deep(.custom-checkbox) {
  background-color: var(--cb-checked) !important;
  border-color: var(--cb-checked) !important;
}
</style>
`;export{e as default};
