const e=`<template>
  <transition
    name="expand"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @leave="onLeave"
  >
    <div
      v-if="destroyOnClose ? isOpen : true"
      v-show="isOpen"
      :class="cn(props.class)"
    >
      <slot />
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { ClassValue } from "clsx";
import { cn } from "#imports";

type Props = {
  isOpen: boolean | undefined;
  duration?: number;
  destroyOnClose?: boolean;
  maxDuration?: number;
  class?: ClassValue;
};

const props = withDefaults(defineProps<Props>(), {
  destroyOnClose: true,
});

const calculateDuration = (height: number): number => {
  if (props.duration !== undefined) {
    return props.duration;
  }

  // Limit duration between 300ms and 1200ms
  return Math.min(props.maxDuration || 1200, Math.max(300, height * 1.5));
};

const getEffectiveHeight = (
  element: HTMLElement,
  scrollHeight: number,
): number => {
  const maxHeight = parseFloat(getComputedStyle(element).maxHeight);
  return !isNaN(maxHeight) && maxHeight > 0
    ? Math.min(scrollHeight, maxHeight)
    : scrollHeight;
};

const onEnter = (el: Element) => {
  const element = el as HTMLElement;
  element.style.height = "0";
  element.style.overflow = "hidden";

  const effectiveHeight = getEffectiveHeight(element, element.scrollHeight);
  const duration = calculateDuration(effectiveHeight);

  element.style.transition = \`height \${duration}ms ease, opacity \${duration}ms ease\`;

  requestAnimationFrame(() => {
    element.style.height = effectiveHeight + "px";
  });
};

const onAfterEnter = (el: Element) => {
  const element = el as HTMLElement;
  element.style.height = "";
  element.style.overflow = "";
  element.style.transition = "";
};

const onLeave = (el: Element) => {
  const element = el as HTMLElement;
  const effectiveHeight = getEffectiveHeight(element, element.scrollHeight);
  const duration = calculateDuration(effectiveHeight);

  element.style.height = effectiveHeight + "px";
  element.style.overflow = "hidden";
  element.style.transition = \`height \${duration}ms ease, opacity \${duration}ms ease\`;

  requestAnimationFrame(() => {
    element.style.height = "0";
  });
};
<\/script>

<style scoped>
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
}
</style>
`;export{e as default};
