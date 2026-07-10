const n=`<template>
  <div
    v-click-outside="closePopover"
    :class="cn(variantClasses.root(), props.classes?.root)"
  >
    <!-- Trigger -->
    <div
      ref="triggerRef"
      :class="
        cn(
          variantClasses.trigger(),
          props.classes?.trigger,
          props.disabled
            ? [variantClasses.triggerDisabled(), props.classes?.triggerDisabled]
            : [variantClasses.triggerEnabled(), props.classes?.triggerEnabled],
        )
      "
      @click="openPopover"
    >
      <span
        :class="cn(variantClasses.triggerText(), props.classes?.triggerText)"
      >
        {{ props.value }}
      </span>
      <IconTxtAreaSuffix
        :class="cn(variantClasses.triggerIcon(), props.classes?.triggerIcon)"
      />
    </div>

    <!-- Popover Content -->
    <div
      v-if="isOpen"
      ref="popoverRef"
      :class="
        cn(
          variantClasses.content(),
          props.classes?.content,
          placement === 'top'
            ? [variantClasses.contentTop(), props.classes?.contentTop]
            : [variantClasses.contentBottom(), props.classes?.contentBottom],
        )
      "
      @click.stop
    >
      <d-input
        focusable
        borderless
        pattern-type="comment"
        :class="cn(variantClasses.input(), props.classes?.input)"
        :value="editedValue"
        @change="editedValue = $event"
      />

      <div :class="cn(variantClasses.actions(), props.classes?.actions)">
        <m-btn
          group="outlined"
          :class="
            cn(variantClasses.cancelButton(), props.classes?.cancelButton)
          "
          @click="handleCancel"
        >
          {{ t("cancel") }}
        </m-btn>
        <m-btn
          :class="cn(variantClasses.saveButton(), props.classes?.saveButton)"
          @click="handleSave"
        >
          {{ t("save") }}
        </m-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from "#imports";
import type { ClassValue } from "clsx";
import { useI18n } from "vue-i18n";
import { textPopoverVariants } from "./TextPopover.variants";

type Props = {
  value: string;
  disabled?: boolean;
  variant?: keyof typeof textPopoverVariants.variants.variant;
  classes?: Partial<Record<keyof typeof textPopoverVariants.slots, ClassValue>>;
};

// props
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  variant: "default",
});

// emits
const emit = defineEmits<{
  (e: "save", value: string): void;
}>();

// states
const { t } = useI18n();
const triggerRef = ref<HTMLElement | null>(null);
const popoverRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const editedValue = ref("");
const placement = ref<"top" | "bottom">("bottom");
const variantClasses = computed(() =>
  textPopoverVariants({
    variant: props.variant,
  }),
);

// methods
const findScrollContainer = (element: HTMLElement): HTMLElement | null => {
  let parent = element.parentElement;

  while (parent) {
    const { overflow, overflowY } = getComputedStyle(parent);

    if (
      overflow === "auto" ||
      overflow === "scroll" ||
      overflowY === "auto" ||
      overflowY === "scroll"
    ) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
};

const calculatePlacement = () => {
  if (!triggerRef.value) return;

  const triggerRect = triggerRef.value.getBoundingClientRect();
  const popoverHeight = 220; // Approximate height of popover

  // Find the scrollable parent container
  const container = findScrollContainer(triggerRef.value);

  if (container) {
    // Calculate space relative to the container
    const containerRect = container.getBoundingClientRect();
    const spaceBelow = containerRect.bottom - triggerRect.bottom;
    const spaceAbove = triggerRect.top - containerRect.top;

    placement.value =
      spaceBelow < popoverHeight && spaceAbove > popoverHeight
        ? "top"
        : "bottom";
  } else {
    // Fallback to window if no scrollable container found
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    placement.value =
      spaceBelow < popoverHeight && spaceAbove > popoverHeight
        ? "top"
        : "bottom";
  }
};

const openPopover = () => {
  if (props.disabled) return;
  editedValue.value = props.value;
  isOpen.value = true;
  nextTick(() => {
    calculatePlacement();
  });
};

const closePopover = () => {
  isOpen.value = false;
};

const handleCancel = () => {
  closePopover();
};

const handleSave = () => {
  emit("save", editedValue.value);
  closePopover();
};
<\/script>
`;export{n as default};
