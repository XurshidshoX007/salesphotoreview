const e=`<template>
  <label
    :data-checked="props.checked || undefined"
    :data-inactive="props.inactive || undefined"
    :data-disabled="props.disabled || undefined"
    class="group inline-flex max-w-fit gap-2 items-center cursor-pointer data-[disabled]:opacity-50 data-[disabled]:cursor-default"
  >
    <input
      type="radio"
      class="sr-only"
      :disabled="props.disabled"
      :checked="props.checked"
    />

    <span class="relative inline-flex items-center justify-center shrink-0">
      <span
        class="rounded-full size-4.5 flex items-center justify-center border-[1.5px] border-neutral-200 transition-colors group-data-[checked]:border-2 group-data-[checked]:border-primary-600 group-data-[inactive]:!border-[var(--red-3)] group-[:not([data-disabled])]:group-hover:border-primary-700"
      >
        <span
          class="opacity-0 rounded-full size-2.5 bg-primary-600 transition-[opacity,background-color] group-data-[checked]:opacity-100 group-data-[inactive]:bg-[var(--red-3)]"
        />
      </span>
    </span>

    <span
      v-if="slots.default"
      class="select-none text-sm font-normal leading-5 group-data-[inactive]:text-[var(--red-3)]"
    >
      <slot />
    </span>
  </label>
</template>

<script setup lang="ts">
import type { Slot } from "vue";
import type { RadioProps } from "~/interfaces/ui/radio-types";

// Props
const props = defineProps<RadioProps>();

// Slots
defineSlots<{ default?: Slot }>();

const slots = useSlots();
<\/script>
`;export{e as default};
