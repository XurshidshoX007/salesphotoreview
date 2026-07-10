const n=`<template>
  <!-- View 1: Simple progress bar with percentage label -->
  <div v-if="variant === 'bar'" class="flex items-center gap-2 justify-end">
    <div class="relative h-1.25 w-24 bg-neutral-150 rounded-lg overflow-hidden">
      <div
        class="absolute top-0 left-0 h-full rounded-lg transition-all duration-300"
        :class="barFillPercentage > 100 ? 'bg-accent-600' : 'bg-green-500'"
        :style="{ width: \`\${clampedBarWidth}%\` }"
      />
    </div>
    <span class="text-xs font-semibold whitespace-nowrap min-w-10 text-end">
      {{ formattedValue }}%
    </span>
  </div>

  <!-- View 2: Growth indicator with arrow and marker -->
  <div v-else class="flex items-center gap-2 justify-end">
    <div class="relative h-1.25 w-24 bg-neutral-150 rounded-lg">
      <!-- Fill bar -->
      <div
        class="absolute top-0 h-full transition-all duration-300"
        :class="ui.bar"
        :style="growthBarStyle"
      />
      <!-- Center marker line -->
      <div
        class="absolute -top-1 h-[13px] w-0.25 rounded-full"
        :class="ui.marker"
        :style="{ left: '50%' }"
      />
    </div>

    <!-- Text  -->
    <div
      class="flex items-center gap-0.5 min-w-14 justify-end"
      :class="ui.text"
    >
      <template v-if="value != 0">
        <icon-top-order-by v-if="props.value > 0" :size="16" />
        <icon-bottom-order-by v-else :size="16" />
      </template>

      <span class="text-xs font-semibold whitespace-nowrap">
        {{ formattedValue }}%
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ClassValue } from "vue";

type Props = {
  /** The percentage value to display */
  value: number;
  /** Display variant: 'bar' for simple progress bar, 'growth' for growth indicator */
  variant?: "bar" | "growth";
};

const props = withDefaults(defineProps<Props>(), {
  variant: "bar",
});

const formattedValue = computed(() => Math.round(props.value));

/** For bar variant: clamp width between 0–100 for the visual bar */
const barFillPercentage = computed(() => Math.round(props.value));
const clampedBarWidth = computed(() =>
  Math.min(Math.max(barFillPercentage.value, 0), 100),
);

/** For growth variant: bar fills from center (50%) outward */
const growthBarStyle = computed(() => {
  const absVal = Math.min(Math.abs(props.value), 100);
  const halfWidth = absVal / 2;
  if (props.value >= 0) {
    return {
      left: "50%",
      width: \`\${halfWidth}%\`,
      borderRadius: "0 20px 20px 0",
    };
  }
  return {
    left: \`\${50 - halfWidth}%\`,
    width: \`\${halfWidth}%\`,
    borderRadius: "20px 0 0 20px",
  };
});

const ui = computed<{
  bar: ClassValue;
  marker: ClassValue;
  text: ClassValue;
}>(() => {
  if (props.value > 0)
    return {
      bar: "bg-green-300",
      marker: "bg-green-600",
      text: "text-green-600",
    };
  else if (props.value < 0)
    return {
      bar: "bg-red-300",
      marker: "bg-red-600",
      text: "text-red-600",
    };

  return {
    bar: "bg-gray-300",
    marker: "bg-gray-400",
    text: "text-gray-500",
  };
});
<\/script>
`;export{n as default};
