const n=`<template>
  <div :class="cn(variantClasses.tag(), props.class)">
    <slot name="prefix" />
    <slot />
    <slot name="suffix" />
  </div>
</template>

<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { Slot } from "vue";
import { cn } from "#imports";
import { tagVariants } from "./variants";

export type TagProps = {
  variant?: keyof typeof tagVariants.variants.variant;
  color?: keyof typeof tagVariants.variants.color;
  size?: keyof typeof tagVariants.variants.size;
  class?: ClassValue;
};

type TagSlots = {
  default: Slot;
  prefix?: Slot;
  suffix?: Slot;
};

// Props
const props = defineProps<TagProps>();

// Slots
defineSlots<TagSlots>();

const slots = useSlots() as TagSlots;

// States
const variantClasses = computed(() =>
  tagVariants({
    variant: props.variant,
    color: props.color,
    size: props.size,
    withAffix: !!(slots.prefix || slots.suffix),
  }),
);
<\/script>
`;export{n as default};
