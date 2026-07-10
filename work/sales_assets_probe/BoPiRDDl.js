const n=`<template>
  <Card
    variant="outlined"
    size="none"
    :classes="{
      root: 'h-full flex flex-col',
      header:
        'w-full flex items-center justify-between px-4 py-3 border-b border-neutral-200 mb-0 flex-shrink-0',
      content: 'flex-1 min-h-0 overflow-hidden',
    }"
  >
    <template #header>
      <div class="flex items-center gap-1.5">
        <span class="font-semibold text-sm text-neutral-800">{{
          langName
        }}</span>

        <div
          v-if="!!missingCount"
          class="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-500 bg-red-500/15 rounded-lg cursor-pointer select-none"
          @click.left="navigateToProblem('next', 'danger')"
          @contextmenu.prevent="navigateToProblem('prev', 'danger')"
        >
          <icon-x color="#ef4444" />
          <span>{{ missingCount }}</span>
        </div>

        <div
          v-if="!!foreignCount"
          class="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-amber-500 bg-amber-500/15 rounded-lg cursor-pointer select-none"
          @click.left="navigateToProblem('next', 'warning')"
          @contextmenu.prevent="navigateToProblem('prev', 'warning')"
        >
          <icon-warning-icon :size="24" class="[&_path]:fill-[#f59e0b]" />
          <span>{{ foreignCount }}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="w-10 h-10 rounded-[10px] border border-[#e1e4e4] flex items-center justify-center hover:border-teal-600 active:bg-teal-600/10 transition-colors"
          v-tooltip="{ text: 'Скопировать', placement: 'top' }"
          @click="emit('copy')"
        >
          <icon-copy :size="16" color="#299b9b" />
        </button>
        <button
          class="w-10 h-10 rounded-[10px] border border-[#e1e4e4] flex items-center justify-center hover:border-teal-600 active:bg-teal-600/10 transition-colors"
          v-tooltip="{ text: 'Скачать', placement: 'top' }"
          @click="emit('download')"
        >
          <icon-download class="[&>path]:fill-[#299b9b]" />
        </button>
      </div>
    </template>

    <div
      ref="scrollContainer"
      class="h-full overflow-y-auto"
      @scroll="onScroll"
    >
      <div
        v-if="entries.length > 0"
        :style="{ height: \`\${totalSize}px\`, position: 'relative' }"
      >
        <localization-row
          v-for="vRow in virtualRows"
          :ref="measureElement"
          :key="entries[vRow.index].key"
          :data-index="vRow.index"
          :entry="entries[vRow.index]"
          :side="side"
          :status="getRowStatus(entries[vRow.index])"
          :style="{
            position: 'absolute',
            top: \`\${vRow.start}px\`,
            left: 0,
            right: 0,
          }"
          @update="onUpdate"
        />
      </div>
      <div
        v-else
        class="flex items-center justify-center h-[200px] text-neutral-400 text-sm"
      >
        Нет данных для отображения
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { useVirtualizer } from "@tanstack/vue-virtual";
import type { FlattenedEntry } from "~/utils/localization-helpers";

// Props
const props = defineProps<{
  entries: FlattenedEntry[];
  side: "left" | "right";
  langName: string;
  langCode: string;
  missingCount?: number;
  foreignCount?: number;
}>();

// Emits
const emit = defineEmits<{
  (e: "update", payload: { key: string; value: string }): void;
  (
    e: "scroll",
    payload: { scrollTop: number; scrollHeight: number; clientHeight: number }
  ): void;
  (e: "copy"): void;
  (e: "download"): void;
}>();

// Constants
const ROW_HEIGHT = 71.5;

// State
const scrollContainer = ref<HTMLElement | null>(null);
const currentDangerIndex = ref(-1);
const currentWarningIndex = ref(-1);

// Composables
const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: props.entries.length,
    estimateSize: () => ROW_HEIGHT,
    getScrollElement: () => scrollContainer.value,
    overscan: 5,
  }))
);

// Computed
const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());
const totalSize = computed(() => rowVirtualizer.value.getTotalSize());

// Methods
const measureElement = (instance: ComponentPublicInstance | Element | null) => {
  if (!instance) return;
  const el = "$el" in instance ? instance.$el : instance;
  if (el instanceof Element) {
    rowVirtualizer.value.measureElement(el);
  }
};

const getRowStatus = (
  entry: FlattenedEntry
): "danger" | "warning" | "success" | undefined => {
  if (props.side === "right" && entry.isMissing) return "danger";
  if (props.side === "left" && entry.isExtra) return "danger";

  if (props.side === "left" && entry.ruHasForeignChars) return "warning";
  if (props.side === "right" && entry.targetHasForeignChars) return "warning";

  if (props.side === "left" && entry.ruIsModified) return "success";
  if (props.side === "right" && entry.targetIsModified) return "success";

  return undefined;
};

const getProblemIndices = (type: "danger" | "warning") => {
  return props.entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => getRowStatus(entry) === type)
    .map(({ index }) => index);
};

const scrollToIndex = (index: number) => {
  rowVirtualizer.value.scrollToIndex(index, {
    align: "center",
    behavior: "smooth",
  });
};

const navigateToProblem = (
  direction: "next" | "prev",
  type: "danger" | "warning"
) => {
  const indices = getProblemIndices(type);
  if (indices.length === 0) return;

  const currentIndex =
    type === "danger" ? currentDangerIndex : currentWarningIndex;

  if (direction === "next") {
    const nextIndex = indices.find((i) => i > currentIndex.value);
    currentIndex.value = nextIndex ?? indices[0];
  } else {
    const prevIndex = [...indices]
      .reverse()
      .find((i) => i < currentIndex.value);
    currentIndex.value = prevIndex ?? indices[indices.length - 1];
  }

  scrollToIndex(currentIndex.value);
};

const onUpdate = (payload: { key: string; value: string }) => {
  emit("update", payload);
};

const onScroll = (event: Event) => {
  const el = event.target as HTMLElement;
  emit("scroll", {
    scrollTop: el.scrollTop,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
  });
};

const scrollTo = (percentage: number) => {
  if (scrollContainer.value) {
    const maxScroll = totalSize.value - scrollContainer.value.clientHeight;
    scrollContainer.value.scrollTop = percentage * Math.max(0, maxScroll);
  }
};

// Expose
defineExpose({ scrollTo });
<\/script>
`;export{n as default};
