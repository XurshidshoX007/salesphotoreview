const n=`<template>
  <div class="flex-1 min-w-0 space-y-4">
    <search-input
      no-debounce
      has-placeholder
      @change="(val: string) => $emit('search', val || '')"
    />

    <div class="text-sm text-neutral-400">{{ filteredCount }} icons</div>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
      <div
        v-for="icon in icons"
        :key="icon.name"
        class="relative flex flex-col items-center p-3 bg-white rounded-xl border transition-all cursor-pointer group"
        :class="
          copiedIcon === icon.name
            ? 'border-green-400 ring-1 ring-green-400'
            : 'border-neutral-200 hover:border-primary-400 hover:shadow-sm'
        "
        @click="$emit('openModal', icon)"
      >
        <span
          v-if="!usageLoading"
          class="absolute -top-1.5 -right-1.5 text-[9px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 font-medium"
          :class="
            getUsage(icon.name).count
              ? 'bg-primary-50 text-primary-700'
              : 'bg-red-50 text-red-400'
          "
        >
          {{ getUsage(icon.name).count }}
        </span>

        <div
          class="w-8 h-8 flex items-center justify-center mb-2 text-neutral-600"
        >
          <dev-icons-safe
            :is="icon.component"
            :icon-props="{ size: 24, ...getIconProps(icon) }"
          />
        </div>

        <span
          v-if="copiedIcon === icon.name"
          class="text-[10px] text-green-600 font-medium"
        >
          Copied!
        </span>
        <span
          v-else
          class="text-[11px] text-neutral-500 text-center truncate w-full hover:text-primary-600"
          :title="\`<icon-\${toKebabCase(icon.name)} />\`"
          @click.stop="$emit('copyTag', icon)"
        >
          {{ icon.name }}
        </span>

        <div
          v-if="icon.variants.length > 1"
          class="flex flex-wrap justify-center gap-1 mt-1.5"
        >
          <button
            v-for="v in icon.variants"
            :key="v"
            class="text-[9px] px-1 py-0.5 rounded transition-colors"
            :class="
              getActiveVariant(icon) === v
                ? 'bg-primary-100 text-primary-700'
                : 'bg-neutral-50 text-neutral-400 hover:bg-neutral-100'
            "
            @click.stop="$emit('setVariant', icon.name, v)"
          >
            {{ v }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="filteredCount === 0"
      class="flex flex-col items-center justify-center py-20"
    >
      <icon-search :size="48" class="text-neutral-300 mb-4" />
      <p class="text-neutral-500 text-sm">No icons found.</p>
    </div>

    <div
      ref="sentinelRef"
      v-if="hasMore"
      class="h-10 flex items-center justify-center"
    >
      <icon-spinner class="animate-spin text-neutral-300" :size="20" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";

// Types
interface IconUsageFile {
  path: string;
  lines: number[];
}

interface IconUsageEntry {
  count: number;
  files: IconUsageFile[];
}

interface IconEntry {
  name: string;
  component: Component;
  variants: string[];
  categories: string[];
  subdirectory: string | null;
  isAnimated: boolean;
}

type Props = {
  icons: IconEntry[];
  filteredCount: number;
  hasMore: boolean;
  usageLoading: boolean;
  usageData: Record<string, IconUsageEntry>;
  copiedIcon: string | null;
  activeVariantsMap: Record<string, string>;
};

// Props
const props = defineProps<Props>();

// Emits
defineEmits<{
  search: [value: string];
  openModal: [icon: IconEntry];
  copyTag: [icon: IconEntry];
  setVariant: [iconName: string, variant: string];
}>();

// States
const sentinelRef = ref<HTMLElement | null>(null);

// Expose
defineExpose({ sentinelRef });

// Methods
function getUsage(name: string): IconUsageEntry {
  return props.usageData[name] || { count: 0, files: [] };
}

function getActiveVariant(icon: IconEntry): string | undefined {
  return props.activeVariantsMap[icon.name] || icon.variants[0];
}

function getIconProps(icon: IconEntry): Record<string, unknown> {
  const iconProps: Record<string, unknown> = {};
  if (icon.variants.length > 0) {
    iconProps.variant = getActiveVariant(icon);
  }
  return iconProps;
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}
<\/script>
`;export{n as default};
