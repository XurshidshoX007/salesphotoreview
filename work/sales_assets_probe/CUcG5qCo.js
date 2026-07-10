const n=`<template>
  <transition :name="transitionName" appear>
    <div v-if="isOpen" :class="cn(classes.wrapper(), className)">
      <card
        size="none"
        :hide-close-icon="false"
        :classes="{
          root: classes.root(),
          content: classes.content(),
          closeIcon: classes.closeIcon(),
        }"
        @close="emit('close')"
      >
        <slot />
      </card>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { cn } from "#imports";
import { toolbarVariants } from "./variants";
import type { ClassValue } from "clsx";

// Types
type Position = "bottom" | "top" | "inline";

type Props = {
  isOpen: boolean;
  position?: Position;
  className?: ClassValue;
};

type Emits = {
  (e: "close"): void;
};

// Props
const props = withDefaults(defineProps<Props>(), {
  position: "bottom",
});

// Emits
const emit = defineEmits<Emits>();

// Hooks
const classes = computed(() => toolbarVariants({ position: props.position }));

const transitionName = computed(() => {
  const map: Record<Position, string> = {
    bottom: "toolbar-slide-up",
    top: "toolbar-slide-down",
    inline: "toolbar-fade",
  };
  return map[props.position];
});
<\/script>

<style scoped>
/* Slide Up (bottom) */
.toolbar-slide-up-enter-active,
.toolbar-slide-up-leave-active {
  transition:
    transform 300ms ease-out,
    opacity 300ms ease-out;
  will-change: transform, opacity;
}

.toolbar-slide-up-enter-from,
.toolbar-slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Slide Down (top) */
.toolbar-slide-down-enter-active,
.toolbar-slide-down-leave-active {
  transition:
    transform 300ms ease-out,
    opacity 300ms ease-out;
  will-change: transform, opacity;
}

.toolbar-slide-down-enter-from,
.toolbar-slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Fade (inline) */
.toolbar-fade-enter-active,
.toolbar-fade-leave-active {
  transition: opacity 300ms ease-out;
  will-change: opacity;
}

.toolbar-fade-enter-from,
.toolbar-fade-leave-to {
  opacity: 0;
}
</style>
`;export{n as default};
