const n=`<template>
  <div ref="rootRef" class="table-component relative">
    <table
      :style="{ display: 'grid' }"
      :class="{
        'w-full table-content-bottom': headerT,
        'w-full table-content': !headerT,
      }"
    >
      <thead
        ref="theadRef"
        :style="{
          display: 'grid',
          position: 'sticky',
          top: '0',
          zIndex: 10,
        }"
        class="bg-[#FAFDFD]"
      >
        <div
          v-if="stickyHeader && !withInformationAboveHeader"
          class="absolute top-[1px] z-11 left-0 w-full h-[1px] bg-[#E1E4E4]"
        ></div>
        <tr
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
          class="border-primary-gray header-row relative"
          :class="{
            'border-y-1': !withInformationAboveHeader && !headerT,
            'border-t-1': headerT,
            'border-b-1': borderB,
          }"
          :style="{ display: 'flex', width: '100%', alignItems: 'center' }"
        >
          <th
            v-for="header in headerGroup.headers"
            :key="header.id"
            :colspan="header.colSpan"
            :style="getCellStyle(header.column)"
            class="text-start column-header"
            @click="handleSort(header)"
          >
            <div
              v-if="!header.isPlaceholder"
              class="text-start relative flex gap-1 fs-14 fw-4 items-center select-none"
              :class="{
                'cursor-pointer': header.column.getCanSort(),
                'justify-end text-end': (header.column.columnDef as any).right,
              }"
            >
              <div class="secondary-gray-text">
                <FlexRender
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
              </div>
              <div
                v-if="header.column.getCanSort()"
                class="grid h-fit text-[#374957]"
              >
                <icon-top-order-by
                  :class="{
                    'text-primary-600':
                      sorted?.field === header.id && sorted?.is_asc,
                  }"
                />
                <icon-bottom-order-by
                  :class="{
                    'text-primary-600':
                      sorted?.field === header.id && !sorted?.is_asc,
                  }"
                />
              </div>
            </div>
          </th>
        </tr>
        <div
          v-if="stickyHeader"
          class="absolute z-50 bottom-0 left-0 w-full h-[1px] bg-[#E1E4E4]"
        ></div>
      </thead>

      <tbody
        :style="{
          display: 'grid',
          height: \`\${totalSize}px\`,
          position: 'relative',
        }"
        :class="loading && 'opacity-50'"
      >
        <tr
          v-for="vRow in virtualRows"
          :key="rows[vRow.index].id"
          :data-index="vRow.index"
          :ref="deferredMeasureElement"
          :style="{
            display: 'flex',
            position: 'absolute',
            top: \`\${vRow.start - (rowVirtualizer.options.scrollMargin ?? 0)}px\`,
            width: '100%',
          }"
          :class="rowClass"
        >
          <c-td-no-edit
            v-for="cell in rows[vRow.index].getVisibleCells()"
            :key="cell.id"
            :style="getCellStyle(cell.column)"
            :class="
              cn(
                'flex items-center',
                (cell.column.columnDef as any).right && 'justify-end',
              )
            "
          >
            <FlexRender
              :render="cell.column.columnDef.cell"
              :props="cell.getContext()"
            />
          </c-td-no-edit>
        </tr>
      </tbody>

      <tfoot>
        <slot name="footer"></slot>
      </tfoot>
    </table>

    <!-- Loading and empty states -->
    <div :class="isDataEmpty && 'h-16 flex justify-center items-center w-full'">
      <div
        v-if="isDataEmpty && !loading"
        class="flex items-center justify-center h-16 pt-2 w-full"
      >
        {{ t("empty") }}
      </div>
      <div v-show="loading" class="absolute top-[55%] left-[50%]">
        <icon-loading :loading="true" :width="14" :height="14" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType, ComponentPublicInstance } from "vue";
import { ref, computed } from "vue";
import {
  type ColumnDef,
  type Column,
  type Header,
  FlexRender,
  useVueTable,
  getCoreRowModel,
} from "@tanstack/vue-table";
import { useVirtualizer } from "@tanstack/vue-virtual";
import { useI18n } from "vue-i18n";
import type { OrderByParams } from "~/interfaces/api/params/list-parameters";
import { cn } from "~/utils/helpers";

const props = defineProps({
  columns: {
    type: Array as PropType<ColumnDef<any, any>[]>,
    default: () => [],
  },
  data: {
    type: Array as PropType<any[]>,
    default: () => [],
  },
  loading: Boolean,
  sorted: Object as PropType<OrderByParams | null>,
  rowHeight: {
    type: Number,
    default: 44,
  },
  overscan: {
    type: Number,
    default: 5,
  },
  rowClass: {
    type: [String, Array] as PropType<string | string[]>,
    default: "",
  },
  stickyHeader: Boolean,
  withInformationAboveHeader: Boolean,
  headerT: Boolean,
  borderB: Boolean,
});

const emit = defineEmits<{
  (e: "sort", sortParams: OrderByParams | null): void;
}>();

const { t } = useI18n();
const rootRef = ref<HTMLElement | null>(null);
const theadRef = ref<HTMLElement | null>(null);
const scrollParent = ref<HTMLElement | null>(null);
const previousField = ref<string>("");

// --- Find the nearest scrollable ancestor ---
function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  let parent = el.parentElement;
  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll") {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

onMounted(() => {
  scrollParent.value = findScrollParent(rootRef.value);
});

// --- TanStack Table ---
const table = useVueTable({
  get data() {
    return props.data || [];
  },
  get columns() {
    return props.columns;
  },
  getCoreRowModel: getCoreRowModel(),
  enableSorting: false,
});

const rows = computed(() => table.getRowModel().rows);
const isDataEmpty = computed(() => rows.value.length === 0);

// --- TanStack Virtual ---
const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: rows.value.length,
    estimateSize: () => props.rowHeight,
    getScrollElement: () => scrollParent.value,
    scrollMargin: theadRef.value?.offsetHeight ?? 0,
    overscan: props.overscan,
    enabled: !!scrollParent.value,
  })),
);

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());
const totalSize = computed(() => rowVirtualizer.value.getTotalSize());

// --- Deferred measurement with throttle ---
// Breaks Vue's synchronous reactive cycle without waiting for scroll to stop.
// Debounce (old): resets timer on every call → flush only after scroll stops.
// Throttle (new): flushes every 10ms during scroll → rows correct faster.
let pendingMeasurements = new Set<Element>();
let measureTimeout: ReturnType<typeof setTimeout> | null = null;

function flushMeasurements() {
  measureTimeout = null;
  const elements = pendingMeasurements;
  pendingMeasurements = new Set();
  for (const el of elements) {
    if (el.isConnected) {
      rowVirtualizer.value.measureElement(el);
    }
  }
}

function deferredMeasureElement(el: Element | ComponentPublicInstance | null) {
  if (!el || !(el instanceof Element)) return;
  pendingMeasurements.add(el);
  if (measureTimeout === null) {
    measureTimeout = setTimeout(flushMeasurements, 20);
  }
}

onUnmounted(() => {
  if (measureTimeout !== null) {
    clearTimeout(measureTimeout);
  }
});

// --- Cell sizing (ensures header/body column alignment) ---
const getCellStyle = (
  column: Column<any, any>,
): Record<string, string | number> => {
  const def = column.columnDef as any;
  const size = column.getSize();
  const minSize = def.minSize || 100;
  const maxSize = def.maxSize;
  const grow = def.grow;

  return {
    width: \`\${size}px\`,
    minWidth: \`\${minSize}px\`,
    ...(maxSize ? { maxWidth: \`\${maxSize}px\` } : {}),
    flexShrink: grow === false ? 1 : 0,
    flexGrow: grow === false ? 0 : 1,
  };
};

// --- Sort logic ---
const handleSort = (header: Header<any, any>) => {
  if (!header.column.getCanSort()) return;

  const field = header.id;

  if (field !== previousField.value) {
    emit("sort", { field, is_asc: true });
    previousField.value = field;
    return;
  }

  if (props.sorted) {
    if (props.sorted.is_asc) {
      emit("sort", { field, is_asc: false });
    } else {
      emit("sort", null);
    }
  } else {
    emit("sort", { field, is_asc: true });
  }

  previousField.value = field;
};
<\/script>

<style scoped>
td,
th {
  padding: 10px;
  box-sizing: border-box;
}

.header-row {
  background: #fafdfd;
}

.table-content,
.table-content-bottom {
  width: 100%;
  position: relative;
}

::-webkit-scrollbar {
  width: 6px;
  border-radius: 28px;
  height: 8px;
}

::-webkit-scrollbar-track {
  height: 8px;
  background: #e1e4e4;
  border-radius: 28px;
}

::-webkit-scrollbar-thumb {
  background: #299b9b;
  border-radius: 28px;
  height: 8px;
}
</style>
`;export{n as default};
