const e=`<template>
  <div class="table-content-container min-w-0 w-full max-w-full">
    <div class="table-content-header min-w-0">
      <flex-col class="w-full min-w-0 gap-3">
        <page-title20 :title="t('plan.setting_plans.setting_plans')" />
        <div
          class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
        >
          <flex-row class="gap-3 min-w-0 w-full sm:w-auto sm:shrink-0">
            <search-input class="min-w-0 flex-1" @change="onSearch" />
            <refresh-btn :loading="isLoading" @click="onRefresh" />
          </flex-row>
          <PlanningSettingPlansTableFilter
            class="w-full min-w-0 sm:min-w-[280px] sm:max-w-full md:max-w-[420px] lg:max-w-[480px]"
            @set-filters="setFilters"
          />
        </div>
      </flex-col>
    </div>
    <div
      class="table-content-body rounded-b-large min-w-0 overflow-x-auto"
      data-setting-plans-table
    >
      <data-table
        :headers="headers"
        :loading="isLoading"
        :is-empty="!filteredData?.length"
        :check="isAllRowsChecked"
        :indeterminate="isAnyRowChecked && !isAllRowsChecked"
        :check-disabled="!isAllRowsCanbeChecked"
        @getAllId="onCheckAllRows"
      >
        <template #body>
          <template v-for="item in filteredData" :key="item.kpi_group.id">
            <PlanningSettingPlansTableRow
              ref="TableRow"
              :headers="headers"
              :row-data="item"
              :value-types="props.valueTypes"
              :roles="roles"
              :statuses="props.statuses"
              :expanded-by-search="expandedBySearch"
              :search-query="searchText"
              :is-row-blocked="isRowBlocked(item)"
              @row-update="onRowUpdate($event, item.kpi_group?.id)"
              @row-checked="onRowChecked($event, item.kpi_group?.id)"
            />
          </template>
        </template>
      </data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import type { ConstantModel } from "#imports";
import type {
  SettingPlanListModel,
  SettingPlanSaveModel,
} from "~/interfaces/api/planning/setting-plans-models";
import { KPIProductGroupDraftPlanStatus } from "~/variable/static-constants";
import type { PlanningSettingPlansTableRow } from "#components";

// store
const settingPlansStore = useSettingPlansStore("main");

// props
const props = defineProps<{
  valueTypes: ConstantModel[];
  statuses: ConstantModel[];
}>();

// emits
const emit = defineEmits<{
  (e: "row-update", payload: RowUpdatePayloadWithGroup): void;
  (e: "row-checked", payload: RowCheckedPayloadWithGroup): void;
}>();

// types
type ValuesOfSaveModel = SettingPlanSaveModel["values"][number];
type StatusesOfSaveModel = SettingPlanSaveModel["employee_statuses"][number];
type RowUpdatePayload = {
  data?: Omit<ValuesOfSaveModel, "group_id">;
  status?: Omit<StatusesOfSaveModel, "group_id">;
};
type RowUpdatePayloadWithGroup = {
  data?: ValuesOfSaveModel;
  status?: StatusesOfSaveModel;
};
type RowCheckedPayload = {
  checked: boolean;
  values: Array<Omit<ValuesOfSaveModel, "group_id">>;
  status:
    | Omit<StatusesOfSaveModel, "group_id">
    | Array<Omit<StatusesOfSaveModel, "group_id">>;
};
type RowCheckedPayloadWithGroup = {
  checked: boolean;
  groupId: string;
  values: ValuesOfSaveModel[];
  status: StatusesOfSaveModel | StatusesOfSaveModel[];
};
type ChildRowData = Omit<SettingPlanListModel, "kpi_group">;
type RowData = SettingPlanListModel | ChildRowData;

// child-components
const TableRow = ref<InstanceType<typeof PlanningSettingPlansTableRow>[]>();

const getRowCheckedState = (
  row: InstanceType<typeof PlanningSettingPlansTableRow>,
): boolean => {
  const exposed = row.isRowChecked as unknown;
  if (typeof exposed === "function") return exposed();
  if (typeof exposed === "boolean") return exposed;
  if (exposed && typeof (exposed as { value?: unknown }).value === "boolean") {
    return (exposed as { value?: boolean }).value === true;
  }
  return false;
};

// states
const { t } = useI18n();
const { isLoading, templates, roles } = storeToRefs(settingPlansStore);
const { refresh, setParams, getRoles } = settingPlansStore;

const searchText = ref("");
const expandedBySearch = ref<Set<string>>(new Set());

// hooks
const data = computed(() => settingPlansStore.data?.draft_plan_list);

const headers = computed(() => [
  ...templates.value.slice(0, 3),
  ...(props.valueTypes?.map((vt) => ({
    name: vt.name,
    key: vt.id.toString(),
    checked: true,
    type: "input",
  })) || []),
  ...templates.value.slice(3),
]);

const isAllRowsChecked = computed(() => {
  const rows = TableRow.value;
  if (!rows || !Array.isArray(rows) || rows.length === 0) return false;
  return rows.every((row) => getRowCheckedState(row));
});

const isAnyRowChecked = computed(() => {
  const rows = TableRow.value;
  if (!rows || !Array.isArray(rows)) return false;
  return rows.some((row) => getRowCheckedState(row));
});

const isAllRowsCanbeChecked = computed(() => {
  if (
    !TableRow.value ||
    !Array.isArray(TableRow.value) ||
    TableRow.value.length === 0
  )
    return false;

  return TableRow.value.every((row) => row.isRowCheckable());
});

onMounted(async () => {
  await getRoles();
});

// methods
const onRefresh = async () => {
  await refresh();
  clearCheckedRows();
};

const clearCheckedRows = () => {
  const rows = TableRow.value;
  if (!rows || !Array.isArray(rows)) return;
  for (const row of rows) {
    if (getRowCheckedState(row)) {
      row.onCheckRow(false);
    }
  }
};

const itemMatchesSearch = (item: RowData, query: string): boolean => {
  const name =
    "kpi_group" in item ? item.kpi_group?.name || "" : item.name || "";
  if (name.toLowerCase().includes(query)) return true;
  if (item.children?.some((child) => itemMatchesSearch(child, query)))
    return true;
  return false;
};

const collectExpandedIds = (
  items: RowData[],
  query: string,
  ids: Set<string>,
): boolean => {
  let hasMatch = false;
  for (const item of items) {
    const name =
      "kpi_group" in item ? item.kpi_group?.name || "" : item.name || "";
    const selfMatches = name.toLowerCase().includes(query);
    const childMatches = item.children?.length
      ? collectExpandedIds(item.children, query, ids)
      : false;

    if (childMatches) {
      ids.add(item.id);
      hasMatch = true;
    }
    if (selfMatches) hasMatch = true;
  }
  return hasMatch;
};

const filteredData = computed(() => {
  if (!data.value) return [];
  const query = searchText.value.toLowerCase().trim();
  if (!query || query.length < 3) {
    expandedBySearch.value = new Set();
    return data.value;
  }

  const ids = new Set<string>();
  collectExpandedIds(data.value, query, ids);
  expandedBySearch.value = ids;

  return data.value.filter((item) => itemMatchesSearch(item, query));
});

const isRowBlocked = (item: RowData): boolean => {
  const currentStatusid = item.status;

  return !(
    currentStatusid === KPIProductGroupDraftPlanStatus.IN_PROGRESS ||
    currentStatusid === KPIProductGroupDraftPlanStatus.RETURNED_FOR_EDITING
  );
};

const setFilters = (payload: {
  date: MonthYearModel;
  tradeDirectionId: string | null;
}) => {
  setParams({
    month: payload.date.month,
    year: payload.date.year,
    tradeDirectionId: payload.tradeDirectionId,
  });
  clearCheckedRows();
};

const onSearch = (text: string) => {
  searchText.value = text;
};

const onRowUpdate = (payload: RowUpdatePayload, groupId?: string) => {
  if (!payload || !groupId) return;

  if (payload.data && data.value) {
    updateChildData(payload.data, groupId); // Pass groupId here
  }

  emit("row-update", {
    data: payload.data ? { ...payload.data, group_id: groupId } : undefined,
    status: payload.status
      ? { ...payload.status, group_id: groupId }
      : undefined,
  });
};

const updateChildData = (
  dataUpdate: Omit<ValuesOfSaveModel, "group_id">,
  groupId: string,
) => {
  if (!data.value) return;
  const kpiGroup = data.value.find((item) => item.kpi_group?.id === groupId);

  if (!kpiGroup) return;

  const findAndUpdate = (items: RowData[]): boolean => {
    for (const item of items) {
      if (item.id === dataUpdate.employee_id) {
        const existingIndex = item.data_values.findIndex(
          (dv) => dv.value_type === dataUpdate.value_type,
        );

        if (existingIndex !== -1) {
          item.data_values[existingIndex].value = dataUpdate.value;
          item.data_values[existingIndex].is_locked = dataUpdate.is_locked;
        } else {
          item.data_values.push({
            value_type: dataUpdate.value_type,
            value: dataUpdate.value,
            is_locked: dataUpdate.is_locked,
            can_edit_locking: true,
            locked_by: {},
          });
        }
        return true;
      }

      if (item.children?.length && findAndUpdate(item.children)) {
        return true;
      }
    }
    return false;
  };

  findAndUpdate(kpiGroup.children || []);
};

const onRowChecked = (payload: RowCheckedPayload, groupId?: string) => {
  if (!groupId) return;

  const statusWithGroupId = Array.isArray(payload.status)
    ? payload.status.map((s) => ({ ...s, group_id: groupId }))
    : { ...payload.status, group_id: groupId };

  emit("row-checked", {
    checked: payload.checked,
    groupId,
    values: payload.values.map((v) => ({ ...v, group_id: groupId })),
    status: statusWithGroupId,
  });
};

const onCheckAllRows = (checked: boolean): void => {
  const rows = TableRow.value;
  if (!rows || !Array.isArray(rows)) return;

  for (const row of rows) {
    if (getRowCheckedState(row) === checked) continue;
    row.onCheckRow(checked);
  }
};

defineExpose({
  refreshTable: onRefresh,
});
<\/script>

<style scoped>
.table-content-body {
  padding-bottom: 0;
}
</style>
`;export{e as default};
