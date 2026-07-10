const t=`<!--
  * Array of tabs. Each tab key will be available as:
  * - Slot \`tab-content-{key}\` for tab button content
  * - Slot \`{key}\` for tab panel content
-->

<template>
  <skeleton-block v-if="props.loading" />
  <slot v-else name="header-wrapper" :tabs-list="tabsListComponent">
    <component :is="tabsListComponent" />
  </slot>

  <div :class="cn(variantClasses.body(), props.classes?.body)">
    <template v-for="tab in tabs" :key="tab.key">
      <div
        v-if="openedTabs.has(tab.key)"
        v-show="activeTab === tab.key"
        :class="
          cn(variantClasses.contentWrapper(), props.classes?.contentWrapper)
        "
      >
        <slot :name="tab.key"></slot>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { h, useSlots } from "vue";
import MultiTabList from "./List.vue";
import { multiTabVariants } from "./variants";
import { cn } from "#imports";
import type { MultiTabProps } from "~/interfaces/ui/MultiTabTypes";

// Props
const props = withDefaults(defineProps<MultiTabProps>(), {
  autoSelect: true,
});

// Emits
const emit = defineEmits<{
  (e: "update:active", value: string | number): void;
}>();

// Composables
const slots = useSlots();

// States
const activeTab = ref<string | number>(props.active || "");
const openedTabs = shallowRef<Set<string | number>>(new Set([activeTab.value]));

// Methods
const setActiveTab = (tabKey: string | number, shouldEmit = true) => {
  if (activeTab.value === tabKey) return;

  activeTab.value = tabKey;
  openedTabs.value = new Set([...openedTabs.value, tabKey]);

  if (shouldEmit) {
    emit("update:active", tabKey);
  }
};

// hooks
watch(
  () => [props.active, props.autoSelect, props.tabs] as const,
  ([active, autoSelect, tabs]) => {
    if (active) {
      setActiveTab(active, false);
      return;
    }

    const firstTab = tabs.at(0);
    if (autoSelect && tabs.length && firstTab) {
      setActiveTab(firstTab.key);
    }
  },
  { immediate: true },
);

const tabsListComponent = computed(() => {
  const tabSlots = Object.keys(slots).reduce<Record<string, unknown>>(
    (acc, key) => {
      if (key.startsWith("tab-content-")) {
        acc[key] = slots[key];
      }
      return acc;
    },
    {},
  );

  return h(
    MultiTabList,
    {
      tabs: props.tabs,
      activeTab: activeTab.value,
      classes: props.classes,
      variant: props.variant,
      "onUpdate:activeTab": setActiveTab,
    },
    tabSlots,
  );
});

const variantClasses = computed(() =>
  multiTabVariants({ variant: props.variant }),
);
<\/script>
`;export{t as default};
