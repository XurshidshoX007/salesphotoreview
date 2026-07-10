const n=`<template>
  <div
    class="tooltip-wrapper"
    v-tooltip="{
      text: tooltip,
      placement: position,
      maxWidth: maxWidth,
      nowrap: nowrap,
      disabled: disabled,
    }"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import type { TooltipPlacement } from "@/composables/useTooltipManager";

// Props
const props = defineProps<{
  tooltip?: string;
  position?: TooltipPlacement;
  maxWidth?: string;
  disabled?: boolean;
  nowrap?: boolean;
}>();
<\/script>

<style scoped>
/* The tooltip wrapper is a simple container for the slotted content */
.tooltip-wrapper {
  display: inline-block;
}

/* Tooltip Fade Animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
`;export{n as default};
