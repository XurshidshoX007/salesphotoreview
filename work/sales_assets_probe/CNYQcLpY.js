const n=`<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isVisible && tooltipText"
        class="global-tooltip"
        :style="tooltipStyles"
        ref="tooltipRef"
        @mouseenter.stop.prevent
        @mouseleave.stop.prevent="onTooltipLeave"
        @mousemove.stop.prevent
        @mousedown.stop.prevent
        @mouseup.stop.prevent
        @click.stop.prevent
      >
        <div
          class="global-tooltip-arrow"
          :class="arrowClass"
          :style="arrowStyle"
          ref="arrowRef"
          @mouseenter.stop.prevent
          @mouseleave.stop.prevent
          @mousemove.stop.prevent
          @mousedown.stop.prevent
          @mouseup.stop.prevent
          @click.stop.prevent
        ></div>
        {{ tooltipText }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  onUnmounted,
  nextTick,
} from "vue";
import {
  computePosition,
  offset,
  flip,
  shift,
  arrow,
  autoUpdate,
  type Placement,
} from "@floating-ui/dom";
import { tooltipManager } from "~/composables/useTooltipManager";
import { useRouter } from "vue-router";

const isVisible = tooltipManager.isVisible;
const tooltipText = tooltipManager.tooltipText;
const placement = tooltipManager.placement;
const maxWidth = tooltipManager.maxWidth;
const nowrap = tooltipManager.nowrap;

const tooltipRef = ref<HTMLElement | null>(null);
const arrowRef = ref<HTMLElement | null>(null);

const x = ref(0);
const y = ref(0);
const arrowX = ref(0);
const arrowY = ref(0);
const middlewarePlacement = ref("top");

let cleanup: (() => void) | null = null;

const updatePosition = async () => {
  const reference = tooltipManager.triggerEl.value;
  const floating = tooltipRef.value;
  if (!reference || !floating) return;
  const arrowEl = arrowRef.value;
  const middleware = [
    offset(6),
    flip(),
    shift({ padding: 8 }),
    ...(arrowEl ? [arrow({ element: arrowEl })] : []),
  ];
  const {
    x: fx,
    y: fy,
    placement: p,
    middlewareData,
  } = await computePosition(reference, floating, {
    placement: placement.value as Placement,
    middleware,
  });
  x.value = fx;
  y.value = fy;
  middlewarePlacement.value = p;
  if (middlewareData.arrow) {
    arrowX.value = middlewareData.arrow.x ?? 0;
    arrowY.value = middlewareData.arrow.y ?? 0;
  }
};

watch([isVisible, placement], async ([vis]) => {
  if (vis) {
    await nextTick();
    updatePosition();
    const reference = tooltipManager.triggerEl.value;
    const floating = tooltipRef.value;
    if (reference && floating) {
      cleanup = autoUpdate(reference, floating, updatePosition);
    }
  } else if (cleanup) {
    cleanup();
    cleanup = null;
  }
});

const router = useRouter();

onMounted(() => {
  if (isVisible.value) {
    updatePosition();
    const reference = tooltipManager.triggerEl.value;
    const floating = tooltipRef.value;
    if (reference && floating) {
      cleanup = autoUpdate(reference, floating, updatePosition);
    }
  }
  router.afterEach(() => {
    tooltipManager.hide();
  });
});

function onDocumentMouseLeave(e: MouseEvent) {
  if (e.relatedTarget === null) {
    tooltipManager.hide();
  }
}

function onTooltipLeave() {
  tooltipManager.hide();
}

let rafId: number | null = null;
function checkTriggerElInDOM() {
  if (isVisible.value && tooltipManager.triggerEl.value) {
    // check if the trigger element is still in the document
    if (!document.body.contains(tooltipManager.triggerEl.value)) {
      tooltipManager.hide();
      return;
    }
    rafId = requestAnimationFrame(checkTriggerElInDOM);
  }
}

// function to hide tooltip on any mouse movement when not over a tooltip trigger
function onDocumentMouseMove(e: MouseEvent) {
  if (!isVisible.value) return;

  const triggerElement = tooltipManager.triggerEl.value;
  const tooltipElement = tooltipRef.value;

  if (triggerElement && tooltipElement) {
    const overTrigger = triggerElement.contains(e.target as Node);
    const overTooltip = tooltipElement.contains(e.target as Node);

    if (!overTrigger && !overTooltip) {
      tooltipManager.hide();
    }
  }
}

onMounted(() => {
  document.addEventListener("mouseleave", onDocumentMouseLeave);
  document.addEventListener("mousemove", onDocumentMouseMove);

  watch(isVisible, (vis) => {
    if (vis) {
      rafId = requestAnimationFrame(checkTriggerElInDOM);
    } else if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  });
});

onBeforeUnmount(() => {
  if (cleanup) cleanup();
});

onUnmounted(() => {
  document.removeEventListener("mouseleave", onDocumentMouseLeave);
  document.removeEventListener("mousemove", onDocumentMouseMove);
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
});

const tooltipStyles = computed(() => ({
  position: "fixed" as const,
  top: \`\${y.value}px\`,
  left: \`\${x.value}px\`,
  maxWidth: maxWidth.value,
  whiteSpace: nowrap.value ? "nowrap" : "normal",
  zIndex: 9999,
  transform: "translateZ(0)",
}));

const arrowClass = computed(() => {
  const [basePos, align] = middlewarePlacement.value.split("-");
  return \`arrow-\${basePos} \${align ? \`arrow-\${align}\` : "arrow-center"}\`;
});

const arrowStyle = computed(() => {
  const [basePos] = middlewarePlacement.value.split("-");
  if (basePos === "top" || basePos === "bottom") {
    return {
      left: \`\${arrowX.value}px\`,
      top: undefined,
      bottom: undefined,
    };
  } else {
    return {
      top: \`\${arrowY.value}px\`,
      left: undefined,
      right: undefined,
    };
  }
});
<\/script>

<style scoped>
.global-tooltip {
  position: fixed;
  background: white;
  color: #299b9b;
  border: 1px solid #299b9b;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-family: "Inter", sans-serif;
  pointer-events: none !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  -webkit-user-drag: none !important;
  -webkit-touch-callout: none !important;
  text-align: start;
  max-width: 250px;
  will-change: transform;
}
.global-tooltip-arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  background: white;
  border: 1px solid #299b9b;
  transform: rotate(45deg);
  pointer-events: none !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  -webkit-user-drag: none !important;
  -webkit-touch-callout: none !important;
  touch-action: none !important;
  z-index: -1;
}
.arrow-top {
  bottom: -5px;
  transform: rotate(45deg);
  border-left: none;
  border-top: none;
}
.arrow-bottom {
  top: -5px;
  transform: rotate(45deg);
  border-bottom: none;
  border-right: none;
}
.arrow-left {
  right: -5px;
  transform: rotate(45deg);
  border-bottom: none;
  border-left: none;
}
.arrow-right {
  left: -5px;
  transform: rotate(45deg);
  border-top: none;
  border-right: none;
}
.arrow-top.arrow-start {
  left: 16px;
}
.arrow-top.arrow-end {
  left: calc(100% - 24px);
}
.arrow-bottom.arrow-start {
  left: 16px;
}
.arrow-bottom.arrow-end {
  left: calc(100% - 24px);
}
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.12s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.12s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
`;export{n as default};
