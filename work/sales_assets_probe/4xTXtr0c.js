const n=`<template>
  <Card :classes="{ root: 'flex flex-col', content: '' }">
    <!-- Top bar -->
    <div
      v-if="props.total !== undefined"
      class="bg-neutral-150 rounded-lg p-4 flex items-center justify-between mb-4"
    >
      <span class="text-neutral-950 font-medium text-sm">{{
        props.totalLabel ?? t("column.total")
      }}</span>
      <span
        v-if="props.isLoading"
        class="h-7 w-20 animate-pulse bg-gray-200 rounded"
      />
      <span v-else class="text-neutral-950 font-semibold text-xl">{{
        getFormattedAmount(props.total)
      }}</span>
    </div>

    <div v-if="props.title" class="mb-4">
      <page-title :title="title" size="xl" weight="600" />
    </div>

    <!-- Two Panels -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <!-- Left Panel (target) -->
      <div class="bg-neutral-150 rounded-lg px-4 py-3">
        <div class="text-neutral-600 font-medium text-sm mb-1">
          {{ props.leftLabel ?? t("dashboard.okb_by_plan") }}
        </div>
        <div
          v-if="props.isLoading"
          class="h-7 animate-pulse bg-gray-200 rounded"
        />
        <div v-else class="text-neutral-950 font-semibold text-xl">
          {{ getFormattedAmount(props.targetValue) }}
        </div>
      </div>

      <!-- Right Panel (actual) -->
      <div
        class="rounded-lg px-4 py-3"
        :class="{ [props.rightPanelColor]: !!props.rightPanelColor }"
      >
        <div class="text-neutral-950 font-medium text-sm mb-1">
          {{ props.rightLabel ?? t("dashboard.akb_orders") }}
        </div>
        <div
          v-if="props.isLoading"
          class="h-7 animate-pulse bg-gray-200 rounded"
        />
        <div
          v-else
          class="font-semibold text-xl"
          :class="{
            [props.rightTextColor]: !!props.rightTextColor,
            'text-neutral-950': !props.rightTextColor,
          }"
        >
          {{ getFormattedAmount(props.actualValue) }}
        </div>
      </div>
    </div>

    <!-- Middle Section - Label -->
    <div class="text-neutral-600 font-medium text-sm mb-2">
      {{ props.progressLabel ?? t("dashboard.okb_percentage") }}
    </div>

    <!-- Bottom Section - Progress Bar -->
    <div
      v-if="props.isLoading"
      class="h-8 animate-pulse bg-gray-200 rounded-lg"
    />
    <div
      v-else
      class="relative w-full h-8 bg-neutral-150 rounded-lg overflow-visible"
    >
      <div class="absolute inset-0 rounded-lg overflow-hidden">
        <div
          class="absolute top-0 left-0 h-full bg-green-500 rounded-lg !rounded-r-none transition-all duration-300"
          :style="{ width: \`\${computedPercentage}%\` }"
        />
      </div>
      <span
        v-if="computedPercentage !== undefined"
        class="absolute top-1/2 -translate-y-1/2 font-semibold text-sm whitespace-nowrap pointer-events-none"
        :style="
          computedPercentage > 80
            ? {
                left: \`calc(\${computedPercentage}% - 8px)\`,
                transform: 'translate(-100%, -50%)',
                color: COLOR_WHITE,
              }
            : {
                left: \`calc(\${computedPercentage}% + 8px)\`,
                color: COLOR_GREEN_500,
              }
        "
      >
        {{ computedPercentage }}%
      </span>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getFormattedAmount } from "~/utils/filter";
import { getHexByTWColor } from "~/utils/helpers";

// Constants
const COLOR_WHITE = getHexByTWColor("text-white");
const COLOR_GREEN_500 = getHexByTWColor("bg-green-500");

// Types
type Props = {
  title?: string;
  total?: number;
  targetValue: number;
  actualValue: number;
  isLoading?: boolean;
  /** Override the computed progress percentage (0–100). If omitted, computed from targetValue/actualValue. */
  percentage?: number;
  /** Optional label overrides */
  totalLabel?: string;
  leftLabel?: string;
  rightLabel?: string;
  progressLabel?: string;
  rightPanelColor?: string;
  rightTextColor?: string;
};

// Props
const props = withDefaults(defineProps<Props>(), {
  rightPanelColor: "bg-neutral-150",
});

// Composables
const { t } = useI18n();

// Hooks
const computedPercentage = computed(() => {
  if (props.percentage !== undefined) {
    return Math.min(Math.max(props.percentage, 0), 100);
  }
  if (props.targetValue === 0) return 0;
  const percent = (props.actualValue / props.targetValue) * 100;
  return Math.min(Math.max(percent, 0), 100);
});
<\/script>
`;export{n as default};
