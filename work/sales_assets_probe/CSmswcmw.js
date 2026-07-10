const e=`<template>
  <div class="table-component relative">
    <div class="table-content-header justify-between">
      <div class="flex items-center gap-x-4">
        <table-sort-columns
          :templates="props.headers"
          :save-key="props.saveKey"
          @onChangeTableHeaders="reOrderHeaders"
        />
        <OptimizedDataTableToggleColDropdown
          :table="table"
          @on-toggle="toggleColumnVisibility"
          @on-toggle-all="toggleAllColumnsVisibility"
        />
        <div>
          <page-size-btn
            :current-size="paginationOptions?.pageSize"
            :total-count="paginationOptions?.totalCount"
            :page-number="paginationOptions?.page"
            :custom-option="customPageSizes"
            @setPageSize="setPageSize"
          />
        </div>
        <div>
          <search-input :value="search" @change="onSearch" />
        </div>
        <div>
          <excel-btn :loading="isExcelFileLoading" @click="downloadExcelFile" />
        </div>
        <div>
          <RefreshBtn @click="refresh" :loading="!!isLoading" />
        </div>
      </div>
      <slot name="header_right"></slot>
    </div>

    <div
      ref="tableContainerRef"
      :style="{
        overflow: 'auto',
        position: 'relative',
        maxHeight: isFilterVisible
          ? 'calc(100vh - 490px)'
          : 'calc(100vh - 312px)',
        backgroundColor: 'white',
      }"
      class="text-sm font-family-inherit table-content-body"
      :class="{ 'opacity-50': isLoading }"
    >
      <div :style="{ maxHeight: 'calc(100vh - 320px)' }">
        <table :style="{ display: 'grid' }">
          <thead
            :style="{
              display: 'grid',
              position: 'sticky',
              top: 0,
              zIndex: 9,
            }"
            class="w-full bg-lotion border-y"
          >
            <tr
              v-for="headerGroup in table.getHeaderGroups()"
              :key="headerGroup.id"
              class="w-full flex items-center flex-1"
            >
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                :colspan="header.colSpan"
                :style="{
                  width: \`\${header.column.columnDef.size}px\`,
                  minWidth: \`\${header.column.columnDef.minSize || 100}px\`,
                  maxWidth: header.column.columnDef.maxSize,
                  flexShrink: header.column.columnDef.grow === false ? 1 : 0,
                  flexGrow: header.column.columnDef.grow === false ? 0 : 1,
                }"
                @click="changeSort(header.id, header.column.columnDef.type)"
                class="optimized-table-th"
              >
                <div
                  v-if="!header.isPlaceholder"
                  class="flex gap-x-1 items-center h-full"
                  :class="{
                    'cursor-pointer select-none': header.column.getCanSort(),
                    'justify-end text-right': header.column.columnDef?.right,
                    'justify-center': header.id === 'select',
                  }"
                >
                  <FlexRender
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />

                  <div
                    v-show="
                      header.id !== 'select' &&
                      header.column.columnDef.type !== 'diapazon' &&
                      header.column.columnDef.type !== 'inWarehouse' &&
                      header.column.columnDef.type !== 'come' &&
                      header.column.columnDef.type !== 'quantitys'
                    "
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
                  <!-- <span v-if="header.column.getIsSorted() === 'asc'"> 🔼</span>
                  <span v-if="header.column.getIsSorted() === 'desc'"> 🔽</span> -->
                </div>
              </th>
            </tr>
          </thead>
          <tbody
            :style="{
              display: 'grid',
              height: \`\${totalSize}px\`,
              position: 'relative',
            }"
            class="table-content"
          >
            <!--            :style="[-->
            <!--                    row?.type?.id === 3 && 'color: #E47200',-->
            <!--                    row?.type?.id === 2 && 'color: #640617',-->
            <!--                  ]"-->
            <tr
              v-for="vRow in virtualRows"
              :data-index="vRow.index"
              :ref="measureElement"
              :key="rows[vRow.index].id"
              :style="{
                display: 'flex',
                position: 'absolute',
                top: \`\${vRow.start}px\`,
                width: '100%',
              }"
              class="border-b"
            >
              <c-td-no-edit
                v-for="cell in rows[vRow.index].getVisibleCells()"
                :key="cell.id"
                :style="{
                  width: \`\${cell.column.getSize() || 150}px\`,
                  minWidth: \`\${cell.column.columnDef.minSize || 100}px\`,
                  maxWidth: \`\${cell.column.columnDef.maxSize || 'auto'}\`,
                  flexShrink: cell.column.columnDef.grow === false ? 1 : 0,
                  flexGrow: cell.column.columnDef.grow === false ? 0 : 1,
                  color:
                    rows[vRow.index]?.original?.type?.id === 3
                      ? '#E47200'
                      : rows[vRow.index]?.original?.type?.id === 2
                        ? '#640617'
                        : '#424F4F',
                }"
                class="optimized-table-td"
                :class="{
                  'justify-end': cell.column.columnDef?.right,
                  'justify-center': cell.column.id === 'select',
                }"
              >
                <template
                  v-if="$slots[normalizeKey(cell.column.columnDef.accessorKey)]"
                >
                  <slot
                    :name="normalizeKey(cell.column.columnDef.accessorKey)"
                    :row="rows[vRow.index].original"
                  />
                </template>
                <template v-else-if="cell.column.columnDef.type === 'date'">
                  {{ getFormattedDate(cell.getValue(), props.dateFormat) }}
                </template>
                <template v-else-if="typeof cell.getValue() === 'number'">
                  {{ getFormattedAmount(cell.getValue()) }}
                </template>
                <template v-else>
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </template>
              </c-td-no-edit>
            </tr>
          </tbody>
        </table>
      </div>
      <div :class="isEmpty && 'h-16 flex justify-center items-center w-full'">
        <div
          v-if="isEmpty && !isLoading"
          class="flex items-center justify-center fs-16 w-full"
        >
          {{ t("empty") }}
        </div>
        <div v-show="isLoading" class="absolute top-[55%] left-[50%]">
          <icon-loading :loading="true" :width="11" :height="11" />
        </div>
      </div>
      <div class="footer-border"></div>
    </div>

    <div class="table-content-footer">
      <curren-page-btn
        :current-size="paginationOptions?.pageSize"
        :total-count="paginationOptions?.totalCount"
        :page-number="paginationOptions?.page"
      />
      <page-index
        :available-pages="paginationOptions?.totalPages"
        :current-page="paginationOptions?.page"
        @setPage="setPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, h } from "vue";
import type { RowSelectionState, Column } from "@tanstack/vue-table";
import {
  type ColumnDef,
  FlexRender,
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
} from "@tanstack/vue-table";
import { useVirtualizer } from "@tanstack/vue-virtual";
import type { Template } from "~/interfaces/ui/template";
import {
  getCheckedItemsByKey,
  setCheckedItemsToLocalByKey,
} from "~/utils/local-storage";
import Checkbox from "~/components/global/Checkbox/index.vue";
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  data: any[];
  headers: Column<any>[];
  saveKey?: string;
  rowSelection?: boolean;
  isLoading?: boolean;
  dateFormat?: string;
  isExcelFileLoading?: boolean;
  isFilterVisible?: boolean;
  searchingValue?: string;
  sorted?: {
    field: string;
    is_asc: boolean;
  };
  paginationOptions?: {
    pageSize: number;
    page: number;
    totalCount: number;
    totalPages: number;
  };
  customPageSizes?: number[];
}>();

// emits
const emit = defineEmits([
  "set-page-size",
  "refresh",
  "download-excel-file",
  "on-search",
  "update-headers-order",
  "set-page",
  "selected-rows",
  "on-sort",
]);

const normalizeKey = (key?: string) => key?.replace(/\\./g, "_");

// states
const { t } = useI18n();
const search = ref(props.searchingValue || "");
const rowSelection = ref<RowSelectionState>({});

const columnVisibility = ref(
  props.headers.reduce(
    (visibility, header) => {
      visibility[normalizeKey(header.accessorKey)] = header.checked ?? true;
      return visibility;
    },
    {} as Record<string, boolean>,
  ),
);

const isFilterVisible = computed(() => props.isFilterVisible ?? true);

const columns = computed<ColumnDef<Template>[]>(() => {
  return [
    (props.rowSelection && {
      id: "select",
      size: 50,
      maxSize: 50,
      grow: false,
      header: ({ table }) =>
        h(Checkbox, {
          checked: table.getIsAllRowsSelected(),
          indeterminate: table.getIsSomeRowsSelected(),
          onChange: () => table.toggleAllRowsSelected(),
        }),
      cell: ({ row }) =>
        h(Checkbox, {
          checked: row.getIsSelected(),
          indeterminate: row.getIsSomeSelected(),
          onChange: () => row.toggleSelected(),
        }),
    }) as ColumnDef<Template>,
    ...props.headers.map((header) => setHeaderSize(header)),
  ];
});

const selectedRowIds = computed(() => {
  const selectedRows = table.getSelectedRowModel().rows;
  return selectedRows.map((row) => row.original.id);
});

const isEmpty = computed(() => props.data?.length === 0);

const measureTextWidth = (text: string, font: string = "14px Arial") => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (context) {
    context.font = font;
    return context.measureText(text).width;
  }
  return 150;
};

const setHeaderSize = (header: Column<any, any>) => {
  return {
    ...header,
    minSize: header.size || 100,
    maxSize: header.size || 300,
    size:
      header.size ||
      Math.max(
        100,
        Math.min(300, measureTextWidth(header.header, "14px Arial") + 20),
      ),
  };
};

// watch(
//   () => props.headers,
//   (newHeaders) => {
//     table.setOptions((prev) => ({
//       ...prev,
//       columns: props.rowSelection
//         ? [
//             {
//               id: "select",
//               size: 50,
//               maxSize: 50,
//               grow: false,
//               header: ({ table }) =>
//                 h(Checkbox, {
//                   checked: table.getIsAllRowsSelected(),
//                   indeterminate: table.getIsSomeRowsSelected(),
//                   onChange: () => table.toggleAllRowsSelected(),
//                 }),
//               cell: ({ row }) =>
//                 h(Checkbox, {
//                   checked: row.getIsSelected(),
//                   indeterminate: row.getIsSomeSelected(),
//                   onChange: () => row.toggleSelected(),
//                 }),
//             },
//             ...newHeaders.map((header) => setHeaderSize(header)),
//           ]
//         : newHeaders.map((header) => setHeaderSize(header)),
//     }));
//   },
//   { deep: true }
// );

const table = useVueTable({
  get data() {
    return props.data || [];
  },
  columns: columns.value,
  state: {
    get rowSelection() {
      return rowSelection.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
  },

  enableRowSelection: true,
  onRowSelectionChange: (updateOrValue) => {
    rowSelection.value =
      typeof updateOrValue === "function"
        ? updateOrValue(rowSelection.value)
        : updateOrValue;
    emit("selected-rows", selectedRowIds.value);
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  debugTable: false,
});

const rows = computed(() => {
  return table.getRowModel().rows;
});

const tableContainerRef = ref<HTMLDivElement | null>(null);

const rowVirtualizerOptions = computed(() => {
  return {
    count: rows.value.length,
    estimateSize: () => 80,
    getScrollElement: () => tableContainerRef.value,
    overscan: 5,
  };
});

const rowVirtualizer = useVirtualizer(rowVirtualizerOptions);

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());
const totalSize = computed(() => rowVirtualizer.value.getTotalSize());

// methods
function measureElement(el?: Element) {
  if (!el) {
    return;
  }
  rowVirtualizer.value.measureElement(el);
  return undefined;
}

function toggleColumnVisibility(column: Column<any, any>) {
  columnVisibility.value = {
    ...columnVisibility.value,
    [column.id]: !column.getIsVisible(),
  };

  props.headers.forEach((header) => {
    if (header.accessorKey === column.columnDef.accessorKey) {
      header.checked = columnVisibility.value[column.id];
    }
  });

  if (props.saveKey) {
    setCheckedItemsToLocalByKey(props.saveKey, props.headers);
  }
}

function toggleAllColumnsVisibility() {
  const allVisible = table.getIsAllColumnsVisible();

  const updatedVisibility = table.getAllLeafColumns().reduce(
    (acc, column) => {
      if (!["select", "checkbox", "actions"].includes(column.id)) {
        acc[column.id] = !allVisible;
      }
      return acc;
    },
    {} as Record<string, boolean>,
  );

  columnVisibility.value = { ...columnVisibility.value, ...updatedVisibility };

  props.headers.forEach((header) => {
    header.checked = !allVisible;
  });

  if (props.saveKey) {
    setCheckedItemsToLocalByKey(props.saveKey, props.headers);
  }
}

const previousField = ref("");
const changeSort = (field: string, type: string) => {
  if (type !== "come" && field !== "select" && type !== "action") {
    if (field !== previousField.value) {
      emit("on-sort", { field, is_asc: true });
      previousField.value = field;
      return;
    }
    if (props.sorted) {
      if (props.sorted?.is_asc) {
        emit("on-sort", { field, is_asc: false });
        previousField.value = field;
        return;
      } else {
        emit("on-sort", null);
        previousField.value = field;
        return;
      }
    } else emit("on-sort", { field, is_asc: !props.sorted?.is_asc });
    previousField.value = field;
    return;
  }
};

const setPageSize = (size: number) => {
  emit("set-page-size", size);
};

const setPage = (page: number) => {
  emit("set-page", page);
};

const refresh = () => {
  emit("refresh");
};

const downloadExcelFile = () => {
  emit("download-excel-file");
};

const onSearch = (value: string) => {
  search.value = value;
  emit("on-search", search.value);
};

const reOrderHeaders = (headers: Template[]) => {
  emit("update-headers-order", headers);
};
<\/script>

<style scoped lang="scss">
table {
  table-layout: fixed;
}

.table-content-body {
  padding-bottom: 0;
}

::-webkit-scrollbar {
  width: 14px !important;
  height: 14px !important;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 0px;
}

::-webkit-scrollbar-thumb {
  background: #299b9b;
  border-radius: 0px;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
}

::-webkit-scrollbar-track {
  margin: 0;
}
</style>
`;export{e as default};
