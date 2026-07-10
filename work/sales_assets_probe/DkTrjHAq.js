const n=`<template>
  <div
    :class="
      cn(
        'relative flex gap-3',
        props.title && 'rounded-[10px] p-2.5 border border-neutral-200',
        props.orientation === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col',
      )
    "
  >
    <span
      v-if="props.title"
      class="absolute -top-3 left-3 px-1.5 bg-white text-xs text-neutral-600"
    >
      {{ props.title }}
    </span>

    <radio
      v-for="item in props.items"
      v-bind="item"
      :key="item.id"
      :disabled="props.disabled || item.disabled"
      :checked="model === item.id"
      @change="model = item.id"
    >
      {{ item.name }}
    </radio>
  </div>
</template>

<script setup lang="ts">
import type { RadioGroupProps } from "~/interfaces/ui/radio-types";
import { cn } from "~/utils/helpers";

// Props
const props = withDefaults(defineProps<RadioGroupProps>(), {
  orientation: "vertical",
});

// Model
const model = defineModel<string | number>();
<\/script>
`;export{n as default};
