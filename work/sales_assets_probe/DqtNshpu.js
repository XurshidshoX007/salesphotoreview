const e=`<template>
  <label :class="cn('flex gap-3 items-center', props.class)">
    <!-- Hidden native checkbox -->
    <input
      type="checkbox"
      class="peer hidden"
      :id="\`\${id}\${title}\` || 'custom-checkbox'"
      :checked="checked"
      :disabled="disabled"
      v-model="isChecked"
      :indeterminate="indeterminate"
      @change="onChange"
    />

    <!-- Custom checkbox square -->
    <span class="custom-checkbox" :class="checkBoxClass"></span>

    <label
      v-if="title"
      :for="\`\${id}\${title}\` || 'custom-checkbox'"
      :class="[
        'w-full select-none text-start font-inter text-sm leading-5 font-normal',
        disabled ? 'opacity-50' : 'cursor-pointer',
        isInActiveItem ? 'text-[var(--red-3)]' : '',
      ]"
    >
      {{ title }}
    </label>
    <slot name="suffix" />
  </label>
</template>

<script setup lang="ts">
import type { ClassValue } from "clsx";
import { cn } from "~/utils/helpers";

// props
interface Props {
  checked: boolean;
  title?: string | number;
  id?: string | number;
  disabled?: boolean;
  isInActiveItem?: boolean;
  indeterminate?: boolean;
  class?: ClassValue;
}
const props = withDefaults(defineProps<Props>(), {
  checked: false,
  disabled: false,
  isInActiveItem: false,
  indeterminate: false,
});

// emit
const emit = defineEmits(["update:modelValue", "change"]);

// states
const isChecked = ref(!!props.checked);

const checkBoxClass = computed(() => {
  return [
    props.disabled ? "custom-checkbox--disabled" : "custom-checkbox--active",
    !isChecked && !props.disabled
      ? "custom-checkbox--hover-off"
      : isChecked && !props.disabled
        ? "custom-checkbox--hover-on"
        : "",
    props.isInActiveItem && isChecked.value && "custom-checkbox--red",
  ];
});

// methods
const onChange = () => {
  emit("change", isChecked.value);
};

// hooks
watch(isChecked, () => {
  emit("update:modelValue", isChecked.value);
});

watch(
  () => props.checked,
  (val) => {
    isChecked.value = val;
  },
);
<\/script>

<style scoped>
.custom-checkbox {
  @apply relative inline-block min-h-5 min-w-5 rounded-sm border
         before:content-[''] before:absolute before:font-bold before:text-transparent
         bg-neutral-0 border-neutral-200 hover:border-neutral-300 hover:text-teal-600 cursor-pointer
         peer-checked:bg-teal-600 peer-checked:border-teal-600
         peer-indeterminate:bg-teal-600 peer-indeterminate:border-teal-600
         peer-checked:before:left-1.5 peer-checked:before:top-0.5
         peer-checked:before:w-1.5 peer-checked:before:h-[11px]
         peer-checked:before:border-solid peer-checked:before:border-r-2 peer-checked:before:border-b-2 peer-checked:before:border-neutral-0
         peer-checked:before:rotate-45
         peer-indeterminate:before:left-2 peer-indeterminate:before:top-1
         peer-indeterminate:before:w-[1px] peer-indeterminate:before:h-[11px]
         peer-indeterminate:before:border-solid peer-indeterminate:before:border-neutral-0 peer-indeterminate:before:border-l
         peer-indeterminate:before:rotate-90;
}

.custom-checkbox--disabled {
  @apply cursor-default opacity-50 bg-neutral-200 border-neutral-200 hover:border-neutral-200
         peer-checked:bg-neutral-200 peer-checked:border-neutral-200
         peer-indeterminate:bg-neutral-200 peer-indeterminate:border-neutral-200;
}

.custom-checkbox--active {
  @apply bg-neutral-0 border-neutral-200;
}

.custom-checkbox--hover-off {
  @apply hover:border-neutral-300;
}

.custom-checkbox--hover-on {
  @apply hover:peer-checked:bg-teal-700 hover:peer-checked:border-teal-700
         hover:peer-indeterminate:bg-teal-700 hover:peer-indeterminate:border-teal-700;
}

.custom-checkbox--red {
  @apply peer-checked:bg-[var(--red-3)] peer-checked:border-[var(--red-3)]
         hover:peer-checked:bg-[var(--red-3)] hover:peer-checked:border-[var(--red-3)];
}
</style>
`;export{e as default};
