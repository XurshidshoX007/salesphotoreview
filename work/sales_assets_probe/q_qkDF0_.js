const n=`<template>
  <div :class="cn(variantClasses.root(), props.classes?.root)">
    <div
      v-if="slots.header"
      :class="
        cn(variantClasses.header(), headerExtraClass, props.classes?.header)
      "
      @click="onHeaderClick"
    >
      <slot name="header" :is-open="isExpanded" />
    </div>

    <template v-if="props.expandable">
      <transition-expand :is-open="isExpanded">
        <div :class="cn(variantClasses.content(), props.classes?.content)">
          <slot />
        </div>
      </transition-expand>
    </template>
    <div v-else :class="cn(variantClasses.content(), props.classes?.content)">
      <slot />
    </div>
    <div
      v-if="slots.footer"
      :class="cn(variantClasses.footer(), props.classes?.footer)"
    >
      <slot name="footer" />
    </div>

    <div
      :class="
        cn(
          variantClasses.closeIcon(),
          props.classes?.closeIcon,
          (props.hideCloseIcon || props.expandable) && 'hidden',
        )
      "
      @click="handleClose"
    >
      <icon-x v-if="!slots.closeIcon" color="#525866" />
      <slot v-else name="closeIcon" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Slot } from "vue";
import { cn } from "#imports";
import { cardVariants } from "./variants";
import type { ClassValue } from "clsx";

type Props = {
  hideCloseIcon?: boolean;
  /** Collapses the default slot (body) with a height transition; use with #header and v-model. */
  expandable?: boolean;
  variant?: keyof typeof cardVariants.variants.variant;
  size?: keyof typeof cardVariants.variants.size;
  classes?: Partial<Record<keyof typeof cardVariants.slots, ClassValue>>;
};

type Emits = {
  (e: "close"): void;
};

type CardSlots = {
  default?: Slot;
  header?: Slot<{ isOpen: boolean }>;
  footer?: Slot;
  closeIcon?: Slot;
};

// Props
const props = withDefaults(defineProps<Props>(), {
  hideCloseIcon: true,
  expandable: false,
});

const expanded = defineModel<boolean>({ default: false });

// Emits
const emit = defineEmits<Emits>();

// Slots
defineSlots<CardSlots>();

const slots = useSlots() as CardSlots;

const isExpanded = computed(() => !!expanded.value);

const headerExtraClass = computed(() =>
  props.expandable && slots.header ? "cursor-pointer" : "",
);

// States
const variantClasses = cardVariants({
  variant: props.variant,
  size: props.size,
  withoutBody: !slots.default,
});

// Methods
const handleClose = () => emit("close");

const onHeaderClick = (event: MouseEvent) => {
  if (!props.expandable) {
    return;
  }
  event.stopPropagation();
  expanded.value = !expanded.value;
};
<\/script>
`;export{n as default};
