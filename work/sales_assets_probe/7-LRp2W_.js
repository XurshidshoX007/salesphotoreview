const n=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <flex-col class="gap-4">
        <slot name="header">
          <page-title v-if="header" :title="header" size="xl" />
        </slot>
      </flex-col>
    </div>

    <div class="px-4">
      <div class="border rounded-lg overflow-hidden">
        <flex-row class="gap-4 p-3">
          <page-size-btn
            :current-size="pageSize"
            :total-count="filteredItems.length"
            :page-number="currentPage"
            @setPageSize="setPageSize"
          />
          <search-input @change="onSearch" />
          <RefreshBtn :loading="loading" @click="emit('refresh')" />
        </flex-row>

        <div class="table-content-body pb-0!">
          <data-table
            :headers="columns"
            :is-empty="!flattenedRows.length"
            :loading="loading"
            :sorted="orderBy"
            @sort="onSort"
          >
            <template #body>
              <template
                v-for="({ row, depth, rowKey }, i) in flattenedRows"
                :key="i"
              >
                <c-tr :class="depth > 0 ? 'bg-input' : undefined">
                  <c-td-no-edit
                    v-for="(col, colIndex) in columns"
                    :key="col.key"
                    :is-checked="col.checked"
                    :class="col.borderX && 'border-r-1'"
                    :type="col.type"
                  >
                    <slot
                      :name="\`cell(\${col.key})\`"
                      :row="row"
                      :col="col"
                      :value="resolveValue(row, col)"
                      :depth="depth"
                    >
                      <slot
                        name="cell"
                        :row="row"
                        :col="col"
                        :value="resolveValue(row, col)"
                        :depth="depth"
                      >
                        <div
                          :class="[
                            (col.right || col.type === 'number') && 'text-end',
                            colIndex === 0 && depth > 0 && 'pl-6',
                            colIndex === 0 &&
                              row.children?.length &&
                              'flex items-center gap-2 cursor-pointer select-none',
                          ]"
                          @click="
                            colIndex === 0 && row.children?.length
                              ? toggleRow(rowKey)
                              : undefined
                          "
                        >
                          <icon-arrow-bottom
                            v-if="colIndex === 0 && row.children?.length"
                            color="#299B9B"
                            :class="
                              expandedKeys.has(rowKey)
                                ? 'rotate-180 transition-all'
                                : 'rotate-0 transition-all'
                            "
                          />
                          <span
                            :class="
                              isNoDataNameFallback(row, col)
                                ? 'font-semibold'
                                : undefined
                            "
                          >
                            {{ renderValue(row, col) }}
                          </span>
                        </div>
                      </slot>
                    </slot>
                  </c-td-no-edit>
                </c-tr>
              </template>
            </template>

            <template v-if="totalRow" #footer>
              <c-tr class="bg-neutral-50">
                <c-td-no-edit
                  v-for="(col, colIndex) in columns"
                  :key="col.key"
                  :is-checked="col.checked"
                  :class="col.borderX && 'border-r-1'"
                  :type="col.type"
                >
                  <slot
                    :name="\`footer-cell(\${col.key})\`"
                    :col="col"
                    :value="resolveValue(totalRow, col)"
                    :index="colIndex"
                  >
                    <slot
                      name="footer-cell"
                      :col="col"
                      :value="resolveValue(totalRow, col)"
                      :index="colIndex"
                    >
                      <div v-if="colIndex === 0" class="fw-6 fs-14">
                        {{ t("column.total") }}
                      </div>
                      <div
                        v-else
                        class="fw-6 fs-14"
                        :class="
                          (col.right || col.type === 'number') && 'text-end'
                        "
                      >
                        <span
                          :class="
                            isNoDataNameFallback(totalRow, col)
                              ? 'font-semibold'
                              : undefined
                          "
                        >
                          {{ renderValue(totalRow, col) }}
                        </span>
                      </div>
                    </slot>
                  </slot>
                </c-td-no-edit>
              </c-tr>
            </template>
          </data-table>
        </div>
      </div>
    </div>

    <div v-if="sortedItems.length" class="table-content-footer">
      <curren-page-btn
        :current-size="pageSize"
        :total-count="filteredItems.length"
        :page-number="currentPage"
      />
      <page-index
        :available-pages="totalPages"
        :current-page="currentPage"
        @setPage="setPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { Template } from "~/interfaces/ui/template";
import { getFormattedAmount } from "~/utils/filter";

// types
interface TableObjectData {
  items: any[];
  total?: any;
}

type TableData = any[] | TableObjectData;

/** Identifies the report variant so cells can apply table-specific fallbacks */
type TableType = "supervisor-report";

interface Props {
  /**
   * Table rows. Accepts either:
   *   - a plain array  →  rows are the array itself, no footer
   *   - \`{ items: [], total?: {} }\`  →  rows from \`items\`, footer from \`total\`
   */
  data?: TableData;
  columns: Template[];
  /** Rendered as the table heading when the \`header\` slot is not provided */
  header?: string;
  loading?: boolean;
  /** Selects which report-specific name fallback \`renderValue\` uses */
  tableType?: TableType;
}

// props
const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  header: undefined,
  loading: false,
  tableType: undefined,
});

// emits
const emit = defineEmits<{ (e: "refresh"): void }>();

const { t } = useI18n();

const items = computed<any[]>(() => {
  if (Array.isArray(props.data)) return props.data;
  return props.data?.items ?? [];
});

/** Present only when data is \`{ items, total }\` and \`total\` is defined */
const totalRow = computed<any | null>(() => {
  if (!Array.isArray(props.data) && props.data?.total !== undefined) {
    return props.data.total;
  }
  return null;
});

const searchQuery = ref("");

const onSearch = (value: string) => {
  searchQuery.value = value;
  currentPage.value = 1;
};

const filteredItems = computed<any[]>(() => {
  if (!searchQuery.value) return items.value;
  const q = searchQuery.value.toLowerCase();
  return items.value.filter((row) =>
    props.columns.some((col) => {
      if (!col.checked) return false;
      return resolveValue(row, col)?.toString().toLowerCase().includes(q);
    }),
  );
});

const orderBy = ref<{ field: string; is_asc: boolean } | null>(null);

const onSort = (sort: { field: string; is_asc: boolean }) => {
  orderBy.value = sort;
  currentPage.value = 1;
};

const sortedItems = computed<any[]>(() => {
  if (!orderBy.value) return filteredItems.value;
  const { field, is_asc } = orderBy.value;
  const col =
    props.columns.find((c) => String(c.key) === String(field)) ??
    ({ key: field } as Template);
  return [...filteredItems.value].sort((a, b) => {
    const aVal = resolveValue(a, col);
    const bVal = resolveValue(b, col);
    if (typeof aVal === "number" && typeof bVal === "number") {
      return is_asc ? aVal - bVal : bVal - aVal;
    }
    if (typeof aVal === "string" && typeof bVal === "string") {
      return is_asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return 0;
  });
});

const pageSize = ref(20);
const currentPage = ref(1);

const totalPages = computed(() =>
  Math.ceil(sortedItems.value.length / pageSize.value),
);

const paginatedItems = computed<any[]>(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return sortedItems.value.slice(start, start + pageSize.value);
});

const setPageSize = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const setPage = (page: number) => {
  currentPage.value = page;
};

/**
 * Tracks which rows are expanded by a stable string key.
 * A trigger ref is used to bust computed caches when the Set mutates,
 * since Vue cannot observe raw Set mutations.
 */
const expandedKeys = reactive(new Set<string>());
const expandTrigger = ref(0);

const getRowKey = (row: any, parentKey = "", index = 0): string => {
  const id =
    row?.target_item?.id ??
    row?.product?.id ??
    row?.branch?.id ??
    row?.id ??
    String(index);
  return \`\${parentKey}\${id}\`;
};

const toggleRow = (key: string) => {
  if (expandedKeys.has(key)) {
    expandedKeys.delete(key);
  } else {
    expandedKeys.add(key);
  }
  expandTrigger.value++;
};

type FlatRow = { row: any; depth: number; rowKey: string };

const flatten = (rows: any[], depth: number, parentKey: string): FlatRow[] => {
  // subscribe to expandTrigger so this re-evaluates when rows are toggled
  void expandTrigger.value;

  return rows.flatMap((row, index) => {
    const rowKey = getRowKey(row, parentKey, index);
    const result: FlatRow[] = [{ row, depth, rowKey }];

    if (row.children?.length && expandedKeys.has(rowKey)) {
      result.push(...flatten(row.children, depth + 1, \`\${rowKey}_\`));
    }

    return result;
  });
};

const flattenedRows = computed<FlatRow[]>(() =>
  flatten(paginatedItems.value, 0, ""),
);

watch(
  () => props.data,
  () => {
    expandedKeys.clear();
    expandTrigger.value++;
    currentPage.value = 1;
    searchQuery.value = "";
    orderBy.value = null;
  },
);

/**
 * Resolves a cell value for a given row and column definition.
 *
 * Resolution order:
 *  1. Dot-notation path on the row itself ("target_item.name" → row.target_item?.name).
 *  2. List-based lookup — used for dynamic columns whose \`key\` matches an entry
 *     inside \`row.list[]\` (e.g. product report where \`list[].key\` is a primitive).
 */
const resolveValue = (row: any, col: Template): any => {
  // 1. Dot-notation resolution
  const direct = String(col.key)
    .split(".")
    .reduce((obj: any, k: string) => obj?.[k], row);
  if (direct !== undefined) return direct;

  // 2. List-based lookup (primitive key match)
  if (Array.isArray(row?.list)) {
    const listItem = row.list.find(
      // eslint-disable-next-line eqeqeq
      (l: any) => l.key == col.key,
    );
    if (listItem !== undefined) {
      return listItem.value;
    }
  }

  return undefined;
};

const hasNullNameParent = (row: any, col: Template): boolean => {
  const keyPath = String(col.key);
  if (!keyPath.includes(".")) return false;

  const segments = keyPath.split(".");
  if (segments.at(-1) !== "name") return false;

  const parentPath = segments.slice(0, -1);
  let current = row;

  for (const segment of parentPath) {
    if (current === null) return true;
    if (current === undefined) return false;
    current = current[segment];
  }

  return current === null;
};

const isNoDataNameFallback = (row: any, col: Template): boolean => {
  return resolveValue(row, col) === undefined && hasNullNameParent(row, col);
};

const renderValue = (row: any, col: Template): string => {
  const val = resolveValue(row, col);
  if (val === undefined && hasNullNameParent(row, col))
    if (props.tableType === "supervisor-report") {
      return t("users.agents_without_supervisors");
    } else {
      return t("column.unknown");
    }
  if (val === null || val === undefined) return "";
  if (col.type === "number" || typeof val === "number") {
    return String(getFormattedAmount(val as number));
  }
  return String(val);
};
<\/script>
`;export{n as default};
