const n=`<template>
  <div class="table-content-container overflow-auto min-w-0 w-full">
    <div
      class="table-content-header flex flex-row items-center justify-between gap-3 flex-wrap"
    >
      <flex-row class="items-center gap-3">
        <search-input @change="onSearch" />
        <m-btn
          group="outlined"
          class="!p-[9px] !bg-white"
          @click="onToggleExpandAll"
        >
          <IconAnimatedExpandCollapse
            :size="20"
            :state="isAllExpanded ? 'expanded' : 'collapsed'"
          />
        </m-btn>
        <excel-btn :loading="isExcelDownloading" @click="onDownloadExcel" />
      </flex-row>
      <!-- Value-type Tabs -->
      <multi-tab
        variant="primary"
        :tabs="valueTypeTabs"
        v-model:active="activeValueTypeKey"
        :classes="{ root: 'shrink-0', body: '!hidden' }"
      />
      <!-- End of Value-type Tabs -->
    </div>
    <div class="min-w-0 w-full overflow-x-auto">
      <data-table
        :headers="kpiGroupHeaders"
        :is-empty="!displayRows.length"
        :loading="isLoading"
      >
        <template #header>
          <tr class="border-primary-gray header-row relative border-y-1">
            <th
              rowspan="2"
              class="text-start align-middle bg-neutral-50 border-r-1 last:border-r-0 border-neutral-200 py-2.5 px-4"
            >
              <div class="flex gap-1 fs-14 fw-4 items-center select-none">
                <div class="secondary-gray-text">
                  {{ t("column.full_name") }}
                </div>
              </div>
            </th>
            <th
              rowspan="2"
              class="text-start align-middle bg-neutral-50 border-r-1 last:border-r-0 border-neutral-200 p-2.5"
            >
              <div class="flex gap-1 fs-14 fw-4 items-center select-none">
                <div class="secondary-gray-text">{{ t("column.code") }}</div>
              </div>
            </th>
            <th
              rowspan="2"
              class="text-start align-middle bg-neutral-50 border-r-1 last:border-r-0 border-neutral-200 p-2.5"
            >
              <div class="flex gap-1 fs-14 fw-4 items-center select-none">
                <div class="secondary-gray-text">{{ t("column.role") }}</div>
              </div>
            </th>
            <th
              v-if="kpiGroups.length"
              :colspan="kpiGroups.length"
              class="text-center bg-neutral-50 border-r-1 last:border-r-0 border-neutral-200 p-2.5"
            >
              <div
                class="flex gap-1 fs-14 fw-4 items-center justify-center select-none"
              >
                <div class="secondary-gray-text">{{ groupHeaderTitle }}</div>
              </div>
            </th>
            <th
              rowspan="2"
              class="text-end align-middle bg-neutral-50 border-l-1 border-r-1 last:border-r-0 border-neutral-200 p-2.5"
            >
              <div
                class="flex gap-1 fs-14 fw-4 items-center justify-end select-none"
              >
                <div class="secondary-gray-text">{{ t("column.total") }}</div>
              </div>
            </th>
          </tr>
        </template>
        <template #body>
          <c-tr
            v-for="(row, idx) in displayRows"
            :key="\`\${row.nodeId}-\${idx}\`"
            :class="
              row.depth > 2
                ? 'last-border-b-0 bg-neutral-50/70'
                : 'last-border-b-0'
            "
          >
            <c-td-no-edit :style="{ paddingLeft: (row.depth - 2) * 16 + 'px' }">
              <div
                class="flex items-center gap-2"
                :class="row.hasChildren && 'cursor-pointer select-none'"
                @click="row.hasChildren && onToggleNode(row.nodeId)"
              >
                <span>{{ row.name }}</span>
                <span
                  v-if="row.hasChildren"
                  class="inline-flex shrink-0 items-center justify-center rounded-md bg-neutral-200 p-0.5"
                >
                  <IconArrowBottom
                    :class="[
                      'shrink-0 transition-transform',
                      expandedNodeKeys.has(row.nodeId)
                        ? 'rotate-180'
                        : 'rotate-0',
                    ]"
                  />
                </span>
              </div>
            </c-td-no-edit>
            <c-td-no-edit />
            <c-td-no-edit>
              {{ getRoleName(row.role) }}
            </c-td-no-edit>
            <c-td-no-edit
              v-for="group in kpiGroups"
              :key="group.id"
              class="text-right"
            >
              {{ row.valueByGroup.get(group.id)?.valueFormatted ?? "" }}
            </c-td-no-edit>
            <c-td-no-edit class="text-right font-semibold">
              {{ row.rowTotalFormatted }}
            </c-td-no-edit>
          </c-tr>

          <c-tr
            v-if="displayRows.length"
            class="font-semibold bg-neutral-50 border-b-0 border-l-1 last:border-l-0 border-neutral-200"
          >
            <c-td-no-edit colspan="3" class="text-left">
              {{ t("column.total") }}:
            </c-td-no-edit>
            <c-td-no-edit
              v-for="group in kpiGroups"
              :key="group.id"
              class="text-right"
            >
              {{ getFormattedAmount(columnTotals.get(group.id) ?? 0) }}
            </c-td-no-edit>
            <c-td-no-edit class="text-right font-semibold">
              {{ getFormattedAmount(grandTotal) }}
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { getFormattedAmount, type SettingPlanListModel } from "#imports";
import { downloadLocalExcelFile } from "~/utils/table-excel-download";
import type { GenericObject } from "~/interfaces/ui";

// Props
const props = defineProps<{
  data: SettingPlanListModel[] | undefined;
  valueTypes: ConstantModel[];
}>();

// Composables
const { t } = useI18n();
const settingPlansStore = useSettingPlansStore("main");
const { isLoading, roles } = storeToRefs(settingPlansStore);

const approverIdsSet = computed<Set<string>>(
  () => new Set(settingPlansStore.data?.trade_direction_approver_ids ?? []),
);

// States
const searchText = ref("");
const selectedValueTypeId = ref<number>(0);
const expandedNodeKeys = ref<Set<string>>(new Set());
const isExcelDownloading = ref(false);

const valueTypeTabs = computed(() =>
  props.valueTypes.map((vt) => ({ key: String(vt.id), title: vt.name })),
);
const activeValueTypeKey = computed({
  get: () => String(selectedValueTypeId.value),
  set: (v: string) => {
    selectedValueTypeId.value = Number(v);
  },
});

// Types
type TreeRow = {
  nodeId: string;
  name: string;
  role: number;
  depth: number;
  valueFormatted: string;
  rawTotal: number;
  hasChildren: boolean;
  children: TreeRow[];
};

type ContentRow = {
  nodeId: string;
  name: string;
  role: number;
  depth: number;
  hasChildren: boolean;
  valueByGroup: Map<string, { valueFormatted: string; rawTotal: number }>;
  rowTotalFormatted: string;
  rowTotalRaw: number;
};

type GroupData = {
  groupId: string;
  groupName: string;
  treeRows: TreeRow[];
  _rawTotal: number;
};

// Methods
const buildTreeRow = (
  node: SettingPlanListModel | Omit<SettingPlanListModel, "kpi_group">,
  groupId: string,
  depth: number,
): TreeRow => {
  const val = node.data_values?.find(
    (dv) => dv.value_type === selectedValueTypeId.value,
  )?.value;
  const rawVal = typeof val === "number" ? val : 0;
  const children =
    node.children?.map((child) => buildTreeRow(child, groupId, depth + 1)) ??
    [];
  return {
    nodeId: node.id,
    name: node.name || "",
    role: node.role,
    depth,
    valueFormatted: rawVal ? String(getFormattedAmount(rawVal)) : "",
    rawTotal: rawVal,
    hasChildren: children.length > 0,
    children,
  };
};

const findTreeRow = (rows: TreeRow[], nodeId: string): TreeRow | null => {
  for (const r of rows) {
    if (r.nodeId === nodeId) return r;
    const found = findTreeRow(r.children, nodeId);
    if (found) return found;
  }
  return null;
};

const buildDisplayRowsFromUnifiedTree = (
  unifiedTreeRows: TreeRow[],
  tableGroups: GroupData[],
): ContentRow[] => {
  const result: ContentRow[] = [];
  const q = searchText.value.toLowerCase().trim();

  const walk = (rows: TreeRow[]) => {
    for (const r of rows) {
      const isApprover = approverIdsSet.value.has(r.nodeId);

      if (isApprover) {
        if (r.hasChildren) walk(r.children);
        continue;
      }

      const valueByGroup = new Map<
        string,
        { valueFormatted: string; rawTotal: number }
      >();
      let rowTotalRaw = 0;

      for (const g of tableGroups) {
        const nodeInGroup = findTreeRow(g.treeRows, r.nodeId);
        const rawTotal = nodeInGroup?.rawTotal ?? 0;
        rowTotalRaw += rawTotal;
        valueByGroup.set(g.groupId, {
          valueFormatted: rawTotal ? String(getFormattedAmount(rawTotal)) : "",
          rawTotal,
        });
      }

      const matchesSearch = !q || r.name.toLowerCase().includes(q);
      if (matchesSearch) {
        result.push({
          nodeId: r.nodeId,
          name: r.name,
          role: r.role,
          depth: r.depth,
          hasChildren: r.hasChildren,
          valueByGroup,
          rowTotalFormatted: rowTotalRaw
            ? String(getFormattedAmount(rowTotalRaw))
            : "",
          rowTotalRaw,
        });
      }

      if (r.hasChildren && expandedNodeKeys.value.has(r.nodeId)) {
        walk(r.children);
      }
    }
  };

  walk(unifiedTreeRows);
  return result;
};

// Hooks
watch(
  () => props.valueTypes,
  (vts) => {
    if (vts?.length && !selectedValueTypeId.value) {
      selectedValueTypeId.value = vts[0].id;
    }
  },
  { immediate: true },
);

const kpiGroups = computed<{ id: string; name: string }[]>(() => {
  if (!props.data?.length) return [];
  return props.data
    .filter((g) => g.kpi_group)
    .map((g) => ({ id: g.kpi_group.id, name: g.kpi_group.name }));
});

const groupHeaderTitle = computed(() => {
  const activeType = props.valueTypes.find(
    (vt) => vt.id === selectedValueTypeId.value,
  );
  return activeType ? \`\${activeType.name} по группе KPI\` : "По группе KPI";
});

// Used only for Excel download (full column list)
const headers = computed<Template[]>(() => [
  {
    name: t("column.full_name"),
    key: "name",
    is_sortable: false,
    checked: true,
  },
  {
    name: t("column.code"),
    key: "code",
    is_sortable: false,
    checked: true,
  },
  {
    name: t("column.role"),
    key: "role",
    is_sortable: false,
    checked: true,
  },
  ...kpiGroups.value.map((g) => ({
    name: g.name,
    key: g.id,
    is_sortable: false,
    checked: true,
    right: true,
  })),
  {
    name: t("column.total"),
    key: "total",
    is_sortable: false,
    checked: true,
    right: true,
  },
]);

// Used for DataTable's second header row (KPI group names only)
const kpiGroupHeaders = computed<Template[]>(() =>
  kpiGroups.value.map((g, index) => ({
    name: g.name,
    key: g.id,
    is_sortable: false,
    checked: true,
    right: true,
    borderX: index === kpiGroups.value.length - 1,
  })),
);

const tableGroups = computed<GroupData[]>(() => {
  if (!props.data?.length) return [];
  const result: GroupData[] = [];

  for (const group of props.data) {
    const rawGroupId = group.kpi_group?.id;
    const groupName = group.kpi_group?.name;
    if (rawGroupId == null || !groupName) continue;
    const groupId = String(rawGroupId);

    const treeRows =
      group.children?.map((l2) => buildTreeRow(l2, groupId, 2)) ?? [];
    const _rawTotal = 0;

    result.push({ groupId, groupName, treeRows, _rawTotal });
  }

  return result;
});

const unifiedTreeRows = computed<TreeRow[]>(() => {
  const first = tableGroups.value[0];
  return first ? first.treeRows : [];
});

const displayRows = computed<ContentRow[]>(() => {
  return buildDisplayRowsFromUnifiedTree(
    unifiedTreeRows.value,
    tableGroups.value,
  );
});

const allExpandableKeys = computed<string[]>(() => {
  const keys: string[] = [];
  const collect = (rows: TreeRow[]) => {
    for (const r of rows) {
      if (approverIdsSet.value.has(r.nodeId)) {
        if (r.hasChildren) collect(r.children);
        continue;
      }
      if (r.hasChildren) {
        keys.push(r.nodeId);
        collect(r.children);
      }
    }
  };
  collect(unifiedTreeRows.value);
  return keys;
});

const isAllExpanded = computed(() => {
  if (!allExpandableKeys.value.length) return false;
  return allExpandableKeys.value.every((k) => expandedNodeKeys.value.has(k));
});

const columnTotals = computed<Map<string, number>>(() => {
  const map = new Map<string, number>();
  for (const g of kpiGroups.value) {
    map.set(g.id, 0);
  }
  for (const row of displayRows.value) {
    for (const g of kpiGroups.value) {
      const prev = map.get(g.id) ?? 0;
      const current = row.valueByGroup.get(g.id)?.rawTotal ?? 0;
      map.set(g.id, prev + current);
    }
  }
  return map;
});

const grandTotal = computed<number>(() =>
  displayRows.value.reduce((s, row) => s + row.rowTotalRaw, 0),
);

// Methods
const onToggleExpandAll = () => {
  if (isAllExpanded.value) {
    expandedNodeKeys.value = new Set();
  } else {
    expandedNodeKeys.value = new Set(allExpandableKeys.value);
  }
};

const onToggleNode = (nodeId: string) => {
  const next = new Set(expandedNodeKeys.value);
  if (next.has(nodeId)) next.delete(nodeId);
  else next.add(nodeId);
  expandedNodeKeys.value = next;
};

const onSearch = (text: string) => {
  searchText.value = text;
};

const getRoleName = (roleId: number): string => {
  const role = roles.value?.find((r) => r.id === roleId);
  return role?.name ?? "";
};

const onDownloadExcel = async () => {
  if (!displayRows.value.length) return;
  isExcelDownloading.value = true;
  try {
    const headerRow: GenericObject = {};
    for (const h of headers.value) {
      headerRow[h.key] = h.name;
    }
    const dataRows: GenericObject[] = displayRows.value.map((row) => {
      const obj: GenericObject = {
        name: row.name,
        code: "",
        role: getRoleName(row.role),
        total: row.rowTotalFormatted,
      };
      for (const g of kpiGroups.value) {
        obj[g.id] = row.valueByGroup.get(g.id)?.valueFormatted ?? "";
      }
      return obj;
    });
    const totalsRow: GenericObject = {
      name: \`\${t("column.total")}:\`,
      code: "",
      role: "",
      total: String(getFormattedAmount(grandTotal.value)),
    };
    for (const g of kpiGroups.value) {
      totalsRow[g.id] = String(
        getFormattedAmount(columnTotals.value.get(g.id) ?? 0),
      );
    }
    dataRows.push(totalsRow);
    dataRows.unshift(headerRow);
    await downloadLocalExcelFile({
      headers: headers.value,
      data: dataRows,
      title: t("plan.setting_plans.detailed_totals"),
    });
  } finally {
    isExcelDownloading.value = false;
  }
};
<\/script>
`;export{n as default};
