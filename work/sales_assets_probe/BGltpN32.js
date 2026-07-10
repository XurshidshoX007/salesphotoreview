const n=`<template>
  <menu-btn-2
    without-padding
    size-free
    :content-z-index="contentZIndex"
    @on-change-is-active="isOpen = $event"
  >
    <template #btn>
      <slot
        name="trigger"
        :selected-option="selectedOption"
        :is-open="isOpen"
      />
    </template>

    <template #content>
      <div
        :class="cn(variantClasses.content(), contentClass)"
        :style="{ minWidth: \`\${contentWidth}px\` }"
      >
        <div :class="variantClasses.list()">
          <button
            v-for="option in options"
            :key="String(option[valueKey])"
            type="button"
            :disabled="option.disabled"
            :class="
              variantClasses.item({
                active: isActive(option),
                tone: getOptionTone(option),
              })
            "
            @click="selectOption(option)"
          >
            <slot
              name="item"
              :option="option"
              :is-active="isActive(option)"
              :select="() => selectOption(option)"
            >
              <span :class="variantClasses.itemMain()">
                <slot name="item-prefix" :option="option" />

                <span :class="variantClasses.label()">
                  {{ option[labelKey] }}
                </span>
              </span>

              <slot
                v-if="option.suffix"
                name="item-suffix"
                :option="option"
                :is-active="isActive(option)"
              >
                <component :is="option.suffix" />
              </slot>

              <icon-check
                v-if="checkable && isActive(option)"
                :class="variantClasses.check()"
                :color="checkColor"
              />
            </slot>
          </button>
        </div>
      </div>
    </template>
  </menu-btn-2>
</template>

<script setup lang="ts">
import type { ClassValue } from "clsx";
import { cn } from "#imports";
import { dropdownMenuVariants } from "./variants";

// Types
type DropdownOption = {
  label?: string;
  name?: string;
  value: string | number;
  disabled?: boolean;
  tone?: "default" | "danger";
  suffix?: unknown;
  onClick?: Function;
  [key: string]: unknown;
};

// Props
const props = withDefaults(
  defineProps<{
    options: DropdownOption[];
    modelValue?: string | number | null;
    variant?: keyof typeof dropdownMenuVariants.variants.variant;
    checkable?: boolean;
    contentWidth?: number;
    contentClass?: ClassValue;
    contentZIndex?: number;
    labelKey?: string;
    valueKey?: string;
    checkColor?: string;
  }>(),
  {
    variant: "action",
    contentWidth: 220,
    labelKey: "label",
    valueKey: "value",
    checkColor: "#525866",
  },
);

// Emits
const emit = defineEmits<{
  (e: "update:modelValue", value: string | number | null): void;
  (e: "select", option: DropdownOption): void;
}>();

// States
const isOpen = ref(false);

// Hooks
const variantClasses = computed(() =>
  dropdownMenuVariants({
    variant: props.variant,
  }),
);

const selectedOption = computed(() => {
  return (
    props.options?.find(
      (option) => option[props.valueKey] === props.modelValue,
    ) || null
  );
});

// Methods
const isActive = (option: DropdownOption) => {
  return props.checkable && option[props.valueKey] === props.modelValue;
};

const getOptionTone = (option: DropdownOption) => {
  return option.tone || "default";
};

const selectOption = (option: DropdownOption) => {
  if (option.disabled) return;

  emit("select", option);

  if (props.checkable) {
    emit("update:modelValue", option[props.valueKey] as string | number);
  }
};
<\/script>
`;export{n as default};
