const n=`<template>
  <tr :class="computedClasses">
    <slot />
  </tr>
</template>

<script setup lang="ts">
import { cn } from "@/utils/helpers";

const props = defineProps<{
  trBg?: boolean;
  isChecked?: boolean | string;
  class?: string;
  unhoverable?: boolean;
}>();

const computedClasses = computed(() =>
  cn(
    "w-full border-y border-[var(--primary-border)]", // default border
    props.trBg && "bg", // if trBg=true apply bg
    props.isChecked && "bg-[#F5FBFB]", // selected state
    props.unhoverable && "unhoverable", // unhoverable state
    props.class, // merge passed classes
  ),
);
<\/script>

<style scoped>
.bg:nth-child(1),
.bg:nth-child(2) {
  background: #f1fefe;
}
</style>
`;export{n as default};
