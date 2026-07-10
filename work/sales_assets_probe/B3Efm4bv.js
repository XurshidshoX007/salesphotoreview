const s=`<template>
  <div :class="cn(variantClasses.list(), props.class)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { ClassValue } from "clsx";
import { tagVariants } from "./variants";
import { cn } from "#imports";

// Props
type Props = {
  class?: ClassValue;
};

const props = defineProps<Props>();

// States
const variantClasses = tagVariants();
<\/script>
`;export{s as default};
