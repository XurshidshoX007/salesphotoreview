const e=`<template>
  <c-tr
    unhoverable
    class="border-b-0"
    :class="currentDepth % 2 === 0 ? '' : 'bg-gray-60'"
  >
    <c-td-no-edit
      v-for="header in headers"
      :key="header.key"
      :class="header.type === 'number' ? 'text-right' : 'text-left'"
    >
      <template v-if="header.key === 'checkbox' && isFirstLevel">
        <Checkbox :id="item.id" :checked="isChecked" @change="onCheckRow" />
      </template>
      <template v-if="header.key === 'name'">
        <div
          v-if="item.hasChildren"
          class="flex justify-start items-center expand-collapse w-fit select-none cursor-pointer"
          :style="{ marginLeft: \`\${indentSize}px\` }"
          @click="toggleExpand"
        >
          <IconArrowBottom
            :class="
              item.isExpanded
                ? 'rotate-180 transition-all'
                : 'rotate-0 transition-all'
            "
          />
          <div class="ml-3">
            <span v-html="highlightSearchMatch(displayName)"></span>
          </div>
        </div>
        <div v-else :style="{ marginLeft: \`\${indentSize + 20}px\` }">
          <span v-html="highlightSearchMatch(displayName)"></span>
        </div>
      </template>

      <template v-else-if="header.key === 'status'">
        <StatusBtnForTable
          :readonly="isStatusBlocked"
          :status-data="item.status"
          :available-statuses-by-id="availableStatuses"
          @on-change-status-by-id="changeItemStatus"
        />
      </template>

      <template v-else-if="header.key === 'comment'">
        <TextPopover
          v-if="!isFirstLevel"
          :value="item.comment"
          :disabled="isInputBlocked"
          @save="setComment"
          class="w-full"
        />
        <div v-else class="max-w-60 truncate text-neutral-500">
          {{ item.comment }}
        </div>
      </template>

      <template v-else-if="header.type === 'input'">
        <d-input
          type="number"
          :border-color-class="
            borderColorByEquality(
              item.dataValuesObj[header.key]?.equalWithChildren,
            )
          "
          :max="inputMaxValue(header.key)"
          :min="inputMinValue(header.key)"
          :disabled="isInputDisabled(header.key)"
          :value="getInputValue(header.key)"
          @change="onChangeDataValue(header.key, $event)"
        >
          <template #prefix>
            <template v-if="!isFirstLevel && !isInputBlocked">
              <icon-locked
                v-if="item.dataValuesObj[header.key]?.is_locked"
                v-tooltip="
                  item.dataValuesObj[header.key]?.locked_by?.name
                    ? t('plan.setting_plans.locked_by') +
                      ': ' +
                      item.dataValuesObj[header.key]?.locked_by?.name
                    : ''
                "
                :color="canLockInput(header.key) ? '#299B9B' : '#CACFD8'"
                :class="canLockInput(header.key) ? 'cursor-pointer' : ''"
                @click="toggleLock(header.key)"
              />
              <icon-unlocked
                v-else
                :color="canLockInput(header.key) ? '#299B9B' : '#CACFD8'"
                :class="canLockInput(header.key) ? 'cursor-pointer' : ''"
                @click="toggleLock(header.key)"
              />
            </template>
            <template
              v-if="
                typeof item.dataValuesObj[header.key]?.equalWithChildren ===
                'boolean'
              "
            >
              <icon-check-circle
                v-if="item.dataValuesObj[header.key].equalWithChildren"
                color="#1FC16B"
                class="ml-1"
              />
              <icon-exclamation-circle v-else class="ml-1" />
            </template>
          </template>
        </d-input>
      </template>

      <template v-else>
        {{ getDataValue(item, header.key, header.type) }}
      </template>
    </c-td-no-edit>
  </c-tr>

  <!-- ROW-TOTAL -->
  <template v-if="item.hasChildren && item.isExpanded">
    <c-tr
      unhoverable
      class="border-t-0"
      :class="currentDepth % 2 === 0 ? '' : 'bg-gray-60'"
    >
      <c-td-no-edit v-for="header in headers" :key="header.key" type="number">
        <template v-if="header.key === 'role'">
          <IconSum class="justify-self-end" />
        </template>

        <template v-if="header.type === 'input'">
          {{ getFormattedSumOfDirectChildrenDataValue(header.key) }}
        </template>
      </c-td-no-edit>
    </c-tr>
  </template>

  <!-- Recursive child rows -->
  <template v-if="item.hasChildren && item.isExpanded && item.children">
    <PlanningSettingPlansTableRow
      v-for="child in item.children"
      :key="child.id"
      :row-data="child"
      :headers="headers"
      :depth="currentDepth + 1"
      :value-types="valueTypes"
      :roles="roles"
      :statuses="statuses"
      :expanded-by-search="expandedBySearch"
      :search-query="searchQuery"
      :enforce-value-limits="enforceValueLimits"
      :is-row-blocked="isInputBlocked"
      :parent-row="props.rowData"
      @row-update="onEmitRowUpdate"
      @row-checked="onChildRowChecked($event)"
    />
  </template>
</template>

<script setup lang="ts">
import type {
  Template,
  ConstantModel,
  SettingPlanListModel,
  IdNameModel,
} from "#imports";
import type {
  DataValueModel,
  SettingPlanSaveModel,
} from "~/interfaces/api/planning/setting-plans-models";
import { KPIProductGroupDraftPlanStatus } from "~/variable/static-constants";
import { getDataValue, getFormattedAmount } from "#imports";
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";

// types
type ChildRowData = Omit<SettingPlanListModel, "kpi_group">;
type RowData = SettingPlanListModel | ChildRowData;
type ValuesOfSaveModel = SettingPlanSaveModel["values"][number];
type StatusesOfSaveModel = SettingPlanSaveModel["employee_statuses"][number];
type RowUpdatePayload = {
  data?: Omit<ValuesOfSaveModel, "group_id">;
  status?: Omit<StatusesOfSaveModel, "group_id">;
};
type RowCheckedPayload = {
  checked: boolean;
  values: Array<Omit<ValuesOfSaveModel, "group_id">>;
  status:
    | Omit<StatusesOfSaveModel, "group_id">
    | Array<Omit<StatusesOfSaveModel, "group_id">>;
};
type EmitRowUpdateOptions = {
  includeStatus?: boolean;
};

// props
const props = defineProps<{
  headers: Template[];
  rowData: RowData;
  parentRow?: RowData;
  valueTypes: ConstantModel[];
  roles: ConstantModel[];
  statuses: ConstantModel[];
  depth?: number;
  expandedBySearch?: Set<string>;
  searchQuery?: string;
  enforceValueLimits?: boolean;
  isRowBlocked?: boolean;
}>();

// emits
const emit = defineEmits<{
  (e: "row-update", payload: RowUpdatePayload): void;
  (e: "row-checked", payload: RowCheckedPayload): void;
}>();

// states
const { t } = useI18n();
const isExpanded = ref(false);
const currentDepth = computed(() => props.depth || 0);
const isFirstLevel = computed(() => currentDepth.value === 0);
const localComment = ref("");
const localStatus = ref<ConstantModel | undefined>();
const enforceValueLimits = ref(props.enforceValueLimits ?? false);
const lockOverrides = ref<Record<string, boolean>>({});
const isChecked = ref(false);

// computeds
const isRowChecked = computed(() => isChecked.value);
const hasChildren = computed(() => !!props.rowData.children?.length);
const indentSize = computed(() => currentDepth.value * 20);

const roleName = computed(
  () => props.roles.find((r) => r.id === props.rowData.role)?.name || "",
);

const statusFromProps = computed(() =>
  props.statuses.find((s) => s.id === props.rowData.status),
);

const isStatusApproved = computed(() => {
  return props.rowData.status === KPIProductGroupDraftPlanStatus.APPROVED;
});

const isInputBlocked = computed(() => {
  return Boolean(props.isRowBlocked || isStatusApproved.value);
});

const isStatusBlocked = computed(() => {
  if (props.isRowBlocked) return true;
  return isFirstLevel.value;
});

const displayName = computed(() => {
  if ("kpi_group" in props.rowData) {
    return props.rowData.kpi_group?.name || "";
  }
  return props.rowData.name || "";
});

const dataValuesObj = computed(() => {
  const base = buildDataValuesMap(props.rowData);
  const overrides = lockOverrides.value;

  for (const key in base) {
    if (key in overrides) {
      base[key] = {
        ...base[key],
        is_locked: overrides[key],
      };
    }

    base[key] = {
      ...base[key],
      equalWithChildren: calculateEqualWithChildren(key),
    };
  }

  return base;
});

const item = computed(() => ({
  ...props.rowData,
  dataValuesObj: dataValuesObj.value,
  hasChildren: hasChildren.value,
  isExpanded: isExpanded.value,
  role: roleName.value,
  status: localStatus.value || statusFromProps.value,
  comment: localComment.value,
}));

const availableStatuses = computed<Array<Record<string, string | number>>>(
  () => {
    const filtered = props.statuses.filter(
      (s) =>
        s.id === KPIProductGroupDraftPlanStatus.APPROVED ||
        s.id === KPIProductGroupDraftPlanStatus.RETURNED_FOR_EDITING,
    );

    return filtered.map((status) => ({
      id: status.id,
      name: status.name,
      key: status.key,
    }));
  },
);

// watchers
watch(
  () => props.rowData,
  (newData) => {
    localComment.value = newData.comment || "";
    localStatus.value = statusFromProps.value;
    if (!props.expandedBySearch?.has(newData.id)) {
      isExpanded.value = false;
    }
    lockOverrides.value = {};
  },
  { immediate: true },
);

watch(
  () => props.expandedBySearch,
  (newSet) => {
    if (newSet?.has(props.rowData.id)) {
      isExpanded.value = true;
    } else if (newSet && newSet.size === 0) {
      isExpanded.value = false;
    }
  },
  { immediate: true },
);

watch(
  () => props.enforceValueLimits,
  (newValue) => {
    enforceValueLimits.value = newValue ?? false;
  },
);

// methods
const getFormattedSumOfDirectChildrenDataValue = (
  headerKey: string,
): string => {
  const sum = sumOfDirectChildrenDataValue(headerKey);
  if (typeof sum === "number") {
    return getFormattedAmount(sum).toString();
  }
  return "";
};

const borderColorByEquality = (isEqual: boolean | undefined): string => {
  if (isEqual === undefined) return "";
  return isEqual ? "border-green-500" : "border-red-500";
};

const calculateEqualWithChildren = (headerKey: string): boolean | undefined => {
  if (!hasChildren.value) return undefined;

  const parentStoredValue = isFirstLevel.value
    ? getInputValue(headerKey)
    : props.rowData.data_values?.find(
        (dv) => dv.value_type.toString() === headerKey,
      )?.value;

  const childrenSum = sumOfDirectChildrenDataValue(headerKey);
  if (
    typeof parentStoredValue !== "number" ||
    typeof childrenSum !== "number"
  ) {
    return undefined;
  }

  return parentStoredValue === childrenSum;
};

const canLockInput = (headerKey: string): boolean => {
  if (isStatusApproved.value) return false;
  const dataValue = dataValuesObj.value[headerKey];
  return !!dataValue?.can_edit_locking;
};

function buildDataValuesMap(row: RowData) {
  const defaults = props.valueTypes.reduce(
    (acc, vt) => {
      acc[vt.id.toString()] = {
        value_type: vt.id,
        value: null,
        is_locked: false,
        can_edit_locking: true,
        locked_by: {} as IdNameModel,
      };
      return acc;
    },
    {} as Record<string, DataValueModel>,
  );

  if (row.data_values?.length) {
    for (const dv of row.data_values) {
      defaults[dv.value_type.toString()] = { ...dv };
    }
  }
  return defaults;
}

const getInputValue = (headerKey: string) => {
  if (isFirstLevel.value) {
    return (
      props.rowData.data_values?.find(
        (dv) => dv.value_type.toString() === headerKey,
      )?.value ||
      sumOfDirectChildrenDataValue(headerKey) ||
      null
    );
  }
  return dataValuesObj.value?.[headerKey]?.value ?? null;
};

const sumChildrenDataValue = (
  row: RowData,
  headerKey: string,
): number | undefined => {
  if (!row.children || row.children.length === 0) return undefined;

  return row.children.reduce((acc: number, child: ChildRowData) => {
    const childDataValue = child.data_values?.find(
      (dv) => dv.value_type.toString() === headerKey,
    );
    if (childDataValue && typeof childDataValue.value === "number") {
      return acc + childDataValue.value;
    }
    return acc;
  }, 0);
};

const sumOfDirectChildrenDataValue = (
  headerKey: string,
): number | undefined => {
  if (!hasChildren.value) return undefined;
  return sumChildrenDataValue(props.rowData, headerKey);
};

const getParentStoredValue = (headerKey: string): number | undefined => {
  const parent = props.parentRow;
  if (!parent) return undefined;

  const parentDataValue = parent.data_values?.find(
    (dv) => dv.value_type.toString() === headerKey,
  )?.value;

  return typeof parentDataValue === "number" ? parentDataValue : undefined;
};

const getParentValue = (headerKey: string): number | undefined => {
  const storedValue = getParentStoredValue(headerKey);
  if (typeof storedValue === "number") return storedValue;
  const parent = props.parentRow;
  if (!parent) return undefined;

  return sumChildrenDataValue(parent, headerKey);
};

const inputMaxValue = (headerKey: string) => {
  if (!enforceValueLimits.value) return undefined;
  if (hasChildren.value) {
    return sumOfDirectChildrenDataValue(headerKey);
  }
  const parentValue = getParentStoredValue(headerKey);
  if (typeof parentValue === "number") return parentValue;
  return getParentValue(headerKey);
};

const inputMinValue = (headerKey: string) => {
  if (!enforceValueLimits.value) return undefined;
  if (hasChildren.value) {
    return sumOfDirectChildrenDataValue(headerKey);
  }
  return undefined;
};

const toggleLock = (headerKey: string) => {
  const dataValue = dataValuesObj.value[headerKey];
  if (!canLockInput(headerKey)) return;
  lockOverrides.value = {
    ...lockOverrides.value,
    [headerKey]: !dataValue.is_locked,
  };
  emitRowUpdate(+headerKey);
};

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const changeItemStatus = async (newStatusId: number) => {
  if (newStatusId === KPIProductGroupDraftPlanStatus.APPROVED) {
    const isValuesCorrect = validateValuesRecursively(props.rowData);
    if (!isValuesCorrect) {
      notify({
        title: t(
          "plan.setting_plans.parent_values_must_equal_sum_of_children_values",
        ),
        type: "error",
      });
      enforceValueLimits.value = true;
      return;
    }
  }
  const newStatus = props.statuses.find((s) => s.id === newStatusId);
  if (newStatus) {
    localStatus.value = newStatus;
  }
  props.rowData.status = newStatusId;

  emitRowUpdate(undefined, undefined, { includeStatus: true });

  if (newStatusId !== KPIProductGroupDraftPlanStatus.APPROVED) {
    await onCheckRow(false);
  }
};

const setComment = (newComment: string) => {
  localComment.value = newComment;
  emitRowUpdate(undefined, undefined, { includeStatus: true });
};

const isInputDisabled = (headerKey: string) => {
  if (isInputBlocked.value) return true;

  const dataValue = dataValuesObj.value[headerKey];
  return (
    isFirstLevel.value || (dataValue?.is_locked && !dataValue?.can_edit_locking)
  );
};

const onChangeDataValue = (headerKey: string, newValue: number | null) => {
  const valueTypeId = +headerKey;
  emitRowUpdate(valueTypeId, newValue);
};

const buildDataPayload = (
  valueTypeId?: number,
  newValue?: number | null,
): Omit<ValuesOfSaveModel, "group_id"> | undefined => {
  const key = valueTypeId?.toString() ?? Object.keys(dataValuesObj.value)[0];
  const dataValue = dataValuesObj.value[key];

  // Use the new value if provided, otherwise use current value
  const value = newValue !== undefined ? newValue : (dataValue?.value ?? null);

  return {
    employee_id: props.rowData.id,
    value_type: Number(key),
    value,
    is_locked: dataValue?.is_locked ?? false,
  };
};

const buildStatusPayload = ():
  | Omit<StatusesOfSaveModel, "group_id">
  | undefined => {
  if (!localStatus.value) return undefined;
  return {
    employee_id: props.rowData.id,
    new_status: localStatus.value.id ?? props.rowData.status,
    comment: localComment.value || "",
  };
};

const emitRowUpdate = (
  valueTypeId?: number,
  newValue?: number | null,
  options?: EmitRowUpdateOptions,
) => {
  if (isFirstLevel.value || props.isRowBlocked) return;

  const shouldSendData =
    typeof valueTypeId === "number" || newValue !== undefined;

  const payload: RowUpdatePayload = {
    data: shouldSendData ? buildDataPayload(valueTypeId, newValue) : undefined,
    status: options?.includeStatus ? buildStatusPayload() : undefined,
  };

  if (!payload.data && !payload.status) return;

  emit("row-update", payload);
};

const onEmitRowUpdate = (payload: RowUpdatePayload) => {
  emit("row-update", payload);
};

const getOwnNodeValue = (
  node: RowData,
  headerKey: string,
): number | undefined => {
  const selfValue = node.data_values?.find(
    (dv) => dv.value_type.toString() === headerKey,
  )?.value;
  return typeof selfValue === "number" ? selfValue : undefined;
};

const getDescendantsSum = (node: RowData, headerKey: string): number => {
  if (!node.children || node.children.length === 0) {
    return getOwnNodeValue(node, headerKey) ?? 0;
  }

  return node.children.reduce(
    (sum, child) => sum + getDescendantsSum(child, headerKey),
    0,
  );
};

const validateValuesRecursively = (node: RowData): boolean => {
  for (const valueType of props.valueTypes) {
    const headerKey = valueType.id.toString();
    if (node.children && node.children.length > 0) {
      let nodeValue: number | undefined;

      // Use component's inputValue only for the root node of this row's context
      if (node === props.rowData && isFirstLevel.value) {
        const val = getInputValue(headerKey);
        nodeValue = val !== null ? val : undefined;
      } else {
        nodeValue = getOwnNodeValue(node, headerKey);
      }

      const childrenSum = node.children.reduce(
        (sum, child) => sum + getDescendantsSum(child, headerKey),
        0,
      );

      // if nodeValue is undefined, we have to equalize it to 0 if that nodes children have values
      // in that valueType, otherwise we can leave it as undefined
      if (nodeValue === undefined) {
        if (childrenSum !== 0) {
          nodeValue = 0;
        } else {
          continue;
        }
      }

      if (nodeValue !== childrenSum) {
        return false;
      }
    }
  }

  if (node.children) {
    for (const child of node.children) {
      if (!validateValuesRecursively(child)) return false;
    }
  }

  return true;
};

const isRowCheckable = (): boolean => {
  const children = props.rowData.children;
  if (!children || children.length === 0) return false;

  if (!validateValuesRecursively(props.rowData)) return false;

  return children.every(
    (child) => child.status === KPIProductGroupDraftPlanStatus.APPROVED,
  );
};

const collectDescendantValues = (
  node: RowData,
  valueTypes: ConstantModel[],
): Array<Omit<ValuesOfSaveModel, "group_id">> => {
  let result: Array<Omit<ValuesOfSaveModel, "group_id">> = [];

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      for (const vt of valueTypes) {
        const key = vt.id.toString();
        const dv = child.data_values?.find(
          (x) => x.value_type.toString() === key,
        );

        if (dv) {
          result.push({
            employee_id: child.id,
            value_type: vt.id,
            value: dv.value ?? null,
            is_locked: dv.is_locked ?? false,
          });
        }
      }

      result = result.concat(collectDescendantValues(child, valueTypes));
    }
  }

  return result;
};

const collectDirectChildrenStatuses = (
  node: RowData,
): Array<Omit<StatusesOfSaveModel, "group_id">> => {
  if (!node.children || node.children.length === 0) return [];

  return node.children
    .filter((child) => typeof child.status === "number")
    .map((child) => ({
      employee_id: child.id,
      new_status: child.status as number,
      comment: child.comment || "",
    }));
};

const onCheckRow = async (checked: boolean) => {
  isChecked.value = checked;

  if (checked && !isRowCheckable()) {
    await nextTick();
    isChecked.value = false;

    notify({
      title: t(
        "plan.setting_plans.all_changable_statuses_has_to_be_approved_and_invalid_inputs_has_to_be_fixed",
      ),
      type: "error",
    });
    return;
  }

  const values = collectDescendantValues(props.rowData, props.valueTypes);
  const statuses = collectDirectChildrenStatuses(props.rowData);

  const emitPayload: RowCheckedPayload = {
    checked: isChecked.value,
    values,
    status: statuses,
  };

  emitRowChecked(emitPayload);
};

const emitRowChecked = (payload: RowCheckedPayload) => {
  emit("row-checked", payload);
};

const onChildRowChecked = (payload: RowCheckedPayload) => {
  if (isFirstLevel.value && payload.checked === false && isChecked.value) {
    onCheckRow(false);
    return;
  }
  emit("row-checked", payload);
};

const highlightSearchMatch = (text: string) => {
  if (
    !props.searchQuery?.trim() ||
    !text ||
    props.searchQuery.trim().length < 3
  ) {
    return text;
  }

  const searchTerm = props.searchQuery.trim();
  const regex = new RegExp(\`(\${escapeRegExp(searchTerm)})\`, "gi");

  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
};

const escapeRegExp = (str: string) => {
  return str.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&");
};

defineExpose({
  onCheckRow,
  isRowChecked: () => isRowChecked.value,
  isRowCheckable,
});
<\/script>

<style scoped>
.search-highlight {
  background-color: #ffff00;
  color: #000;
  padding: 0 1px;
  border-radius: 2px;
}
</style>
`;export{e as default};
