const n=`<template>
  <div :class="cn(variantClasses.root(), classes?.root)">
    <ul ref="listRef" :class="cn(variantClasses.list(), classes?.list)">
      <li
        v-for="item in tabs"
        :key="item.key"
        :ref="(el) => setItemRef(item.key, el as HTMLElement)"
        :class="
          cn(
            variantClasses.tab(),
            classes?.tab,
            activeTab === item.key && [
              variantClasses.active(),
              classes?.active,
            ],
          )
        "
        @click="setActiveTab(item.key)"
      >
        <slot :name="\`tab-content-prefix-\${item.key}\`" />
        {{ item.title }}
        <slot :name="\`tab-content-suffix-\${item.key}\`" />
      </li>

      <div
        :class="cn(variantClasses.indicator(), classes?.indicator)"
        :style="indicatorStyle"
      />
    </ul>

    <transition-fade
      :show="hasOverflowLeft"
      class="absolute z-30 top-0 left-0 w-3.5 h-full bg-gradient-to-r from-white to-transparent md:w-7"
    />
    <transition-fade
      :show="hasOverflowRight"
      class="absolute z-30 top-0 right-0 w-3.5 h-full bg-gradient-to-l from-white to-transparent md:w-7"
    />
  </div>
</template>

<script setup lang="ts">
import { cn } from "#imports";
import { multiTabVariants } from "./variants";
import type { MultiTabListProps } from "~/interfaces/ui/MultiTabTypes";

// Props
const props = defineProps<MultiTabListProps>();

// Emits
const emit = defineEmits<{
  (e: "update:activeTab", value: string | number): void;
}>();

// States
const listRef = ref<HTMLElement | null>(null);
const itemRefs = ref<Map<string | number, HTMLElement>>(new Map());
const indicatorStyle = ref<string | null>(null);
const resizeObserver = ref<ResizeObserver | null>(null);
const mutationObserver = ref<MutationObserver | null>(null);
const hasOverflowLeft = ref(false);
const hasOverflowRight = ref(false);

const variantClasses = computed(() =>
  multiTabVariants({ variant: props.variant }),
);

// Methods
const setItemRef = (id: string | number, el: HTMLElement | null) => {
  if (el) {
    itemRefs.value.set(id, el);
  }
};

const setActiveTab = (tabKey: string | number) => {
  emit("update:activeTab", tabKey);
};

const checkOverflow = () => {
  if (!listRef.value) {
    hasOverflowLeft.value = false;
    hasOverflowRight.value = false;
    return;
  }

  const element = listRef.value;
  const scrollLeft = element.scrollLeft;
  const scrollWidth = element.scrollWidth;
  const clientWidth = element.clientWidth;

  hasOverflowLeft.value = scrollLeft > 1;
  hasOverflowRight.value = scrollLeft + clientWidth < scrollWidth - 1;
};

const updateIndicator = (skipTransition = false) => {
  if (!props.activeTab) {
    indicatorStyle.value = null;
    return;
  }

  const activeElement = itemRefs.value.get(props.activeTab);
  const listElement = listRef.value;

  if (!activeElement || !listElement) {
    indicatorStyle.value = null;
    return;
  }

  const listRect = listElement.getBoundingClientRect();
  const itemRect = activeElement.getBoundingClientRect();

  const left = itemRect.left - listRect.left + listElement.scrollLeft;
  const top = itemRect.top - listRect.top;
  const noTransition = skipTransition ? "transition: none;" : "";

  switch (props.variant) {
    case "underline":
      indicatorStyle.value = \`
      left: \${left}px;
      width: \${itemRect.width}px;
      \${noTransition}
      \`;
      break;
    default:
      indicatorStyle.value = \`
          left: \${left}px;
          top: \${top}px;
          width: \${itemRect.width}px;
          height: \${itemRect.height}px;
          \${noTransition}
        \`;
      break;
  }
};

// Hooks
let isTabChanging = false;
let isFirstUpdate = true;

watch(
  () => props.activeTab,
  () => {
    isTabChanging = true;
    nextTick(() => {
      updateIndicator(isFirstUpdate);
      isFirstUpdate = false;
      requestAnimationFrame(() => {
        isTabChanging = false;
      });
    });
  },
  { immediate: true },
);

onMounted(() => {
  nextTick(() => {
    checkOverflow();
    updateIndicator(true);
  });

  resizeObserver.value = new ResizeObserver(() => {
    checkOverflow();
    updateIndicator(true);
  });

  // mutationObserver to watch for visibility changes
  mutationObserver.value = new MutationObserver(() => {
    if (isTabChanging) return;
    nextTick(() => {
      updateIndicator(true);
      checkOverflow();
    });
  });

  if (listRef.value) {
    resizeObserver.value.observe(listRef.value);
    listRef.value.addEventListener("scroll", checkOverflow);

    // Observe all children for attribute changes (style, class)
    mutationObserver.value.observe(listRef.value, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["style", "class"],
    });
  }
});

onUnmounted(() => {
  resizeObserver.value?.disconnect();
  mutationObserver.value?.disconnect();
  if (listRef.value) {
    listRef.value.removeEventListener("scroll", checkOverflow);
  }
});
<\/script>
`;export{n as default};
