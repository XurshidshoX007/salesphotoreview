const n=`<template>
  <div class="table-container">
    <div class="custom-approvers-table" :class="{ 'empty-table': isDataEmpty }">
      <!-- Table Header -->
      <div class="table-header" :style="tableGridStyle">
        <div class="header-cell supervisor-header">
          {{ t("users.supervisors") }}
        </div>
        <div
          v-for="stepIndex in maxSteps"
          :key="\`header-\${stepIndex}\`"
          class="header-cell step-header"
        >
          <!-- Header-level approver dropdown (applies to whole step) -->
          <DropdownsByFilterStates
            :key="\`header-dropdown-\${stepIndex}\`"
            :filter-states="[getHeaderDropdownConfig(stepIndex)]"
            @onOpenDropdown="onOpenDropdown"
          />

          <!-- Header border overlay for hover effect -->
          <div class="cell-border-overlay cell-border-overlay--header">
            <RoundedIconBtn
              v-show="canAddHeaderLeft(stepIndex)"
              icon="plus"
              size="2xsm"
              type="outlined"
              bg-color="white"
              hover-bg="white"
              class="cell-action-btn cell-action-btn--left"
              :tooltip="t('plan.setting_approvers.add_step_before')"
              @click="addColumn('left', stepIndex)"
            />
            <RoundedIconBtn
              v-show="canAddHeaderRight(stepIndex)"
              icon="plus"
              type="outlined"
              size="2xsm"
              bg-color="white"
              hover-bg="white"
              class="cell-action-btn cell-action-btn--right"
              :tooltip="t('plan.setting_approvers.add_step_after')"
              @click="addColumn('right', stepIndex)"
            />
            <RoundedIconBtn
              v-show="canRemoveHeader(stepIndex)"
              icon-file-name="X"
              type="danger"
              size="2xsm"
              bg-color="white"
              hover-bg="white"
              class="cell-action-btn cell-action-btn--center"
              :tooltip="t('delete')"
              @click="removeColumn(stepIndex)"
            />
          </div>
        </div>
      </div>

      <!-- Table Body -->
      <div class="table-body">
        <div
          v-for="(row, rowIndex) in tableRows"
          :key="row.supervisor.id"
          class="table-row"
          :style="tableGridStyle"
        >
          <!-- Supervisor Cell -->
          <div
            class="table-cell supervisor-cell"
            :class="{ 'rounded-l-lg': isRowAtLast(rowIndex) }"
          >
            {{ row.supervisor.name }}
          </div>

          <!-- Approver Cells -->
          <div
            v-for="stepIndex in maxSteps"
            :key="\`\${row.supervisor.id}-\${stepIndex}\`"
            class="table-cell approver-cell"
            :class="getCellClasses(row, stepIndex, rowIndex)"
            :title="getCellTitle(row, stepIndex)"
          >
            <!-- Content only renders for visible cells -->
            <template v-if="isCellVisible(row, stepIndex)">
              <template v-if="hasApprover(stepIndex, row)">
                <!-- Dropdown for existing approvers -->
                <DropdownsByFilterStates
                  :key="\`dropdown-\${row.supervisor.id}-\${stepIndex}\`"
                  :filter-states="[getDropdownConfig(row, stepIndex)]"
                  @onOpenDropdown="onOpenDropdown"
                />
              </template>
              <template
                v-else-if="!hasPrevMainApprover(row.supervisor.id, stepIndex)"
              >
                <!-- Empty cell with hover actions -->
                <div class="empty-cell-content">
                  <button
                    class="add-approver-btn"
                    type="button"
                    @click="addApprover(row.supervisor.id, stepIndex)"
                  >
                    <IconPlus color="white" />
                  </button>
                </div>
              </template>
              <template v-else>
                <!-- Disabled placeholder for locked cells -->
                <div class="empty-cell-content"></div>
              </template>

              <!-- Cell action buttons -->
              <div
                class="cell-border-overlay"
                :class="{
                  disabled: hasPrevMainApprover(row.supervisor.id, stepIndex),
                }"
              >
                <RoundedIconBtn
                  v-show="canAddLeft(row.supervisor.id, stepIndex)"
                  icon="plus"
                  size="2xsm"
                  type="outlined"
                  bg-color="white"
                  hover-bg="white"
                  class="cell-action-btn cell-action-btn--left"
                  :tooltip="t('plan.setting_approvers.add_step_before')"
                  @click="addCell('left', stepIndex, row.supervisor.id)"
                />
                <RoundedIconBtn
                  v-show="canAddRight(row.supervisor.id, stepIndex)"
                  icon="plus"
                  size="2xsm"
                  type="outlined"
                  bg-color="white"
                  hover-bg="white"
                  class="cell-action-btn cell-action-btn--right"
                  :tooltip="t('plan.setting_approvers.add_step_after')"
                  @click="addCell('right', stepIndex, row.supervisor.id)"
                />
                <RoundedIconBtn
                  v-show="canRemove(row.supervisor.id, stepIndex)"
                  icon-file-name="X"
                  type="danger"
                  size="2xsm"
                  bg-color="white"
                  hover-bg="white"
                  class="cell-action-btn cell-action-btn--center"
                  :tooltip="t('delete')"
                  @click="removeCell(row.supervisor.id, stepIndex)"
                />
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-overlay">
        <IconLoading :loading="true" :width="11" :height="11" />
      </div>

      <!-- Empty State -->
      <div v-if="isDataEmpty" class="empty-state">
        {{ t("empty") }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import { useI18n } from "vue-i18n";
import type { TransformedSettingApproversListModel } from "~/interfaces/api/planning/setting-approvers-models";

interface DropdownModel {
  id: string;
  name: string;
}

// Props
const props = defineProps<{
  tableRows: TransformedSettingApproversListModel[];
  managers: { items: DropdownModel[] } | undefined;
  loading: boolean;
  displayMaxStep: number;
}>();

// Emits
const emit = defineEmits<{
  change: [
    payload: { supervisorId: string; orderNumber: number; managerId: string },
  ];
  openDropdown: [state: string, value: string];
  addCell: [
    payload: {
      position: "left" | "right";
      stepIndex: number;
      supervisorId: string;
    },
  ];
  removeCell: [payload: { supervisorId: string; stepIndex: number }];
  addApprover: [payload: { supervisorId: string; stepIndex: number }];
  addColumn: [payload: { position: "left" | "right"; stepIndex: number }];
  removeColumn: [payload: { stepIndex: number }];
}>();

const { t } = useI18n();

// State
const dropdownStates = reactive<
  Record<string, { isMenuActive: boolean; contentPosition: string }>
>({});
const headerSelectedManagers = reactive<Record<string, string>>({});

// Computed properties
const maxSteps = computed(() => Math.max(1, props.displayMaxStep));

const isDataEmpty = computed(() => {
  return (!props.tableRows || props.tableRows.length === 0) && !props.loading;
});

const tableGridStyle = computed(() => {
  const dynamicColumns = Array.from({ length: maxSteps.value })
    .map(() => "minmax(200px, 1fr)")
    .join(" ");

  return {
    "grid-template-columns": \`250px \${dynamicColumns}\`,
  };
});

const managerNameMap = computed(() => {
  const map = new Map<string, string>();
  props.managers?.items?.forEach((manager) => {
    if (manager.id) {
      map.set(manager.id, manager.name ?? "");
    }
  });
  return map;
});

const duplicateApproversByRow = computed<Map<string, Set<number>>>(() => {
  const map = new Map<string, Set<number>>();

  props.tableRows?.forEach((row) => {
    const duplicateSteps = new Set<number>();
    const approverIdToSteps = new Map<string, number[]>();

    row.approvers?.forEach((approver) => {
      if (!approver.id || approver.id.trim() === "") return;

      if (!approverIdToSteps.has(approver.id)) {
        approverIdToSteps.set(approver.id, []);
      }
      approverIdToSteps.get(approver.id)!.push(approver.order_number);
    });

    approverIdToSteps.forEach((steps, approverId) => {
      if (steps.length > 1) {
        steps.forEach((step) => duplicateSteps.add(step));
      }
    });

    map.set(row.supervisor.id, duplicateSteps);
  });

  return map;
});

const isCellVisible = (
  row: TransformedSettingApproversListModel,
  stepIndex: number,
): boolean => {
  if (stepIndex === 1) return true;
  if (hasApprover(stepIndex, row)) return true;

  const rowIndex = props.tableRows.findIndex(
    (r) => r.supervisor.id === row.supervisor.id,
  );
  for (let i = rowIndex + 1; i < props.tableRows.length; i++) {
    if (hasApprover(stepIndex, props.tableRows[i])) return true;
  }

  return false;
};

// Helper methods
const hasApprover = (
  stepIndex: number,
  row?: TransformedSettingApproversListModel,
): boolean => {
  return row?.approvers?.some((a) => a.order_number === stepIndex) ?? false;
};

const getApproverDisplayName = (
  row: TransformedSettingApproversListModel,
  stepIndex: number,
): string => {
  const approver = row.approvers.find(
    (a) => a.order_number === stepIndex && a.id?.trim(),
  );

  if (!managerNameMap.value.has(approver?.id ?? "")) return "";

  if (!approver) return "";
  if (approver.name?.trim()) return approver.name;
  if (approver.id) {
    return managerNameMap.value.get(approver.id) ?? "";
  }
  return "";
};

const getCellTitle = (
  row: TransformedSettingApproversListModel,
  stepIndex: number,
): string => {
  const approverName = getApproverDisplayName(row, stepIndex);
  return approverName ?? "";
};

const hasPrevMainApprover = (
  supervisorId: string,
  stepIndex: number,
): boolean => {
  const row = props.tableRows.find(
    (item) => item.supervisor.id === supervisorId,
  );
  return (
    row?.approvers?.some((a) => a.order_number < stepIndex && a.is_main) ??
    false
  );
};

const isApproverMain = (supervisorId: string, stepIndex: number): boolean => {
  return (
    props.tableRows
      .find((row) => row.supervisor.id === supervisorId)
      ?.approvers?.find((a) => a.order_number === stepIndex)?.is_main ?? false
  );
};

const isDuplicate = (supervisorId: string, stepIndex: number): boolean => {
  return (
    duplicateApproversByRow.value.get(supervisorId)?.has(stepIndex) ?? false
  );
};

const isRowAtLast = (rowIndex: number): boolean => {
  return rowIndex === props.tableRows.length - 1;
};

const getDropdownStateKey = (supervisorId: string, stepIndex: number): string =>
  \`\${supervisorId}_\${stepIndex}\`;

const getHeaderDropdownStateKey = (stepIndex: number): string =>
  \`header_\${stepIndex}\`;

const getDropdownState = (key: string) => {
  if (!dropdownStates[key]) {
    dropdownStates[key] = {
      isMenuActive: false,
      contentPosition: "bottom-start",
    };
  }
  return dropdownStates[key];
};

// Button visibility logic
const canAddLeft = (supervisorId: string, stepIndex: number): boolean => {
  return !hasPrevMainApprover(supervisorId, stepIndex);
};

const canAddRight = (supervisorId: string, stepIndex: number): boolean => {
  return (
    !isApproverMain(supervisorId, stepIndex) &&
    !hasPrevMainApprover(supervisorId, stepIndex)
  );
};

const canRemove = (supervisorId: string, stepIndex: number): boolean => {
  const row = props.tableRows.find(
    (item) => item.supervisor.id === supervisorId,
  );
  return (
    hasApprover(stepIndex, row) &&
    !isApproverMain(supervisorId, stepIndex) &&
    !hasPrevMainApprover(supervisorId, stepIndex)
  );
};

const canAddHeaderLeft = (stepIndex: number): boolean => {
  const hasMainBefore = props.tableRows.every((row) =>
    row.approvers.some((a) => a.order_number < stepIndex && a.is_main),
  );
  return !hasMainBefore;
};

const canAddHeaderRight = (stepIndex: number): boolean => {
  const allAreMain = props.tableRows.every((row) => {
    const approver = row.approvers.find((a) => a.order_number === stepIndex);
    return approver?.is_main === true;
  });
  const hasMainBefore = props.tableRows.every((row) =>
    row.approvers.some((a) => a.order_number < stepIndex && a.is_main),
  );
  return !allAreMain && !hasMainBefore;
};

const canRemoveHeader = (stepIndex: number): boolean => {
  const hasMain = props.tableRows.some((row) =>
    row?.approvers?.some((a) => a.order_number === stepIndex && a.is_main),
  );
  return !hasMain;
};

const getCellClasses = (
  row: TransformedSettingApproversListModel,
  stepIndex: number,
  rowIndex: number,
) => {
  const isVisible = isCellVisible(row, stepIndex);
  const isLastRow = rowIndex === props.tableRows.length - 1;

  const hasApproverInNextStep = hasApprover(stepIndex + 1, row);
  const needRightBorderToInvisibleCell =
    rowIndex > 0 && !isVisible && hasApproverInNextStep;

  return {
    "is-disabled": hasPrevMainApprover(row.supervisor.id, stepIndex),
    "is-main": isApproverMain(row.supervisor.id, stepIndex),
    "is-empty": !hasApprover(stepIndex, row),
    "is-invalid": isDuplicate(row.supervisor.id, stepIndex),
    "is-invisible": !isVisible,
    "needs-right-border-to-invisible-cell": needRightBorderToInvisibleCell,
    "rounded-br-lg": isLastRow && stepIndex === maxSteps.value,
  };
};

const getSelectedIdsInRow = (
  row: TransformedSettingApproversListModel,
  excludeStep: number,
): string[] => {
  return row.approvers
    .filter((a) => a.order_number !== excludeStep && a.id?.trim())
    .map((a) => a.id);
};

const applyHeaderSelection = (stepIndex: number, managerId: string) => {
  if (!managerId) return;

  props.tableRows.forEach((row) => {
    const supervisorId = row.supervisor.id;

    if (hasPrevMainApprover(supervisorId, stepIndex)) return;

    const approver = row.approvers.find((a) => a.order_number === stepIndex);

    if (approver?.is_main) return;

    emit("change", {
      supervisorId,
      orderNumber: stepIndex,
      managerId,
    });
  });
};

const getHeaderDropdownConfig = (stepIndex: number) => {
  const stateKey = getHeaderDropdownStateKey(stepIndex);
  const dropdownState = getDropdownState(stateKey);

  return {
    key: stateKey,
    name: t("plan.setting_approvers.step") + \` \${stepIndex}\`,
    isSingleSelect: true,
    autoFocusSearch: true,
    // it has to be disabled if every dropdown in the column is main
    disabled:
      !props.tableRows?.length ||
      props.tableRows.every((row) => {
        const approver = row.approvers.find(
          (a) => a.order_number === stepIndex,
        );
        return approver?.is_main;
      }),
    get isMenuActive() {
      return dropdownState.isMenuActive;
    },
    set isMenuActive(value: boolean) {
      dropdownState.isMenuActive = value;
    },
    get contentPosition() {
      return dropdownState.contentPosition;
    },
    set contentPosition(value: string) {
      dropdownState.contentPosition = value;
    },
    get data() {
      return props.managers;
    },
    get getSelectedData() {
      return headerSelectedManagers[String(stepIndex)] || "";
    },
    set setSelectedData(value: string) {
      headerSelectedManagers[String(stepIndex)] = value || "";
      applyHeaderSelection(stepIndex, value);
    },
  };
};

const getDropdownConfig = (
  row: TransformedSettingApproversListModel,
  stepIndex: number,
) => {
  const stateKey = getDropdownStateKey(row.supervisor.id, stepIndex);
  const dropdownState = getDropdownState(stateKey);
  const currentApprover = row.approvers.find(
    (a) => a.order_number === stepIndex,
  );
  const selectedIds = getSelectedIdsInRow(row, stepIndex);

  return {
    key: stateKey,
    autoFocusSearch: true,
    get isMenuActive() {
      return dropdownState.isMenuActive;
    },
    set isMenuActive(value: boolean) {
      dropdownState.isMenuActive = value;
    },
    get contentPosition() {
      return dropdownState.contentPosition;
    },
    set contentPosition(value: string) {
      dropdownState.contentPosition = value;
    },
    isSingleSelect: true,
    disabled: currentApprover?.is_main,
    get data() {
      return {
        ...props.managers,
        items: props.managers?.items?.filter(
          (m) => !selectedIds.includes(m.id) || m.id === currentApprover?.id,
        ),
      };
    },
    get getSelectedData() {
      return currentApprover?.id || "";
    },
    set setSelectedData(value: string) {
      emit("change", {
        supervisorId: row.supervisor.id,
        orderNumber: stepIndex,
        managerId: value,
      });
    },
  };
};

// Event handlers
const onOpenDropdown = (state: string, value: string) =>
  emit("openDropdown", state, value);

const addCell = (
  position: "left" | "right",
  stepIndex: number,
  supervisorId: string,
) => emit("addCell", { position, stepIndex, supervisorId });

const removeCell = (supervisorId: string, stepIndex: number) =>
  emit("removeCell", { supervisorId, stepIndex });

const addApprover = (supervisorId: string, stepIndex: number) =>
  emit("addApprover", { supervisorId, stepIndex });

const addColumn = (position: "left" | "right", stepIndex: number) =>
  emit("addColumn", { position, stepIndex });

const removeColumn = (stepIndex: number) => emit("removeColumn", { stepIndex });
<\/script>

<style scoped lang="scss">
.table-container {
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  padding-bottom: 16px;

  &::-webkit-scrollbar-track {
    background: #fafafa;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    border: 1px solid transparent;
    background-clip: padding-box;
  }
}

.empty-table {
  border: 1px solid theme("colors.neutral.200") !important;
}

.custom-approvers-table {
  border-radius: 12px;
  position: relative;
  background: white;
  width: fit-content;
  border-left: 1px solid theme("colors.neutral.200");
  border-top: 1px solid theme("colors.neutral.200");
}

.table-header {
  border-radius: 12px 12px 0 0;
  display: grid;
  background: theme("colors.neutral.50");
  border-bottom: 1px solid theme("colors.neutral.200");
  width: 100%;
}

.header-cell {
  position: relative;
  padding: 12px 16px;
  color: #374151;
  border-right: 1px solid theme("colors.neutral.200");
  font-size: 14px;
  color: theme("colors.neutral.400");
  font-weight: 600;

  &.supervisor-header {
    flex: 0 0 250px;
    display: flex;
    align-items: center;
  }

  &.step-header {
    flex: 0 0 200px;
    text-align: center;
    flex-shrink: 0;
    overflow: visible;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    gap: 6px;
  }

  &:last-child {
    border-top-right-radius: 8px;
  }
}

.table-body {
  display: flex;
  flex-direction: column;
  overflow: visible;
  width: 100%;
}

.table-row {
  display: grid;
  position: relative;
  height: 60px;
  width: 100%;
}

.table-cell {
  position: relative;
  padding: 12px 16px;
  border-right: 1px solid theme("colors.neutral.200");
  height: 60px;
  display: flex;
  align-items: center;
  overflow: visible;
  background: white;

  &.supervisor-cell {
    flex: 0 0 250px;
    font-weight: 500;
    color: #374151;
    font-size: 14px;
    border-bottom: 1px solid theme("colors.neutral.200");
  }

  &.approver-cell {
    flex: 0 0 200px;
    background: white;
    transition: background 0.2s ease;
    border-right: 1px solid theme("colors.neutral.200");
    border-bottom: 1px solid theme("colors.neutral.200");

    &:hover:not(.is-invisible) {
      background: theme("colors.neutral.50");
    }

    &.is-disabled {
      background: theme("colors.neutral.50");
    }

    &.is-invisible {
      border-right: none;
      border-bottom: none;
      background: transparent;
      pointer-events: none;
    }

    &.needs-right-border-to-invisible-cell {
      border-right: 1px solid theme("colors.neutral.200");
    }

    &.is-main {
      background: transparent;
    }

    &.is-invalid {
      border: 1px solid theme("colors.red.500") !important;
      box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.2);
    }
  }
}

.empty-cell-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.add-approver-btn {
  width: 32px;
  height: 32px;
  border: 2px dashed theme("colors.primary.600");
  border-radius: 50%;
  background: transparent;
  color: theme("colors.primary.600");
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.9);

  &:hover {
    background: theme("colors.primary.600");
    color: white;
  }

  svg {
    width: 14px;
    height: 14px;
  }
}

.approver-cell:not(.is-invisible):hover .add-approver-btn {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, -50%) scale(1);
}

.approver-cell.is-disabled .add-approver-btn {
  opacity: 0;
  pointer-events: none;
}

.cell-border-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  border: 1px solid transparent;
  opacity: 0;
  transition:
    opacity 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
  z-index: 1;
}

.approver-cell:not(.is-invisible):hover .cell-border-overlay:not(.disabled),
.header-cell.step-header:hover .cell-border-overlay {
  opacity: 1;
  border-color: theme("colors.primary.600");
  box-shadow: inset 0 0 0 1px rgba(14, 165, 233, 0.15);
  background: rgba(14, 165, 233, 0.05);
}

.cell-border-overlay.disabled {
  pointer-events: none;
  opacity: 0;
  background: transparent;
  border-color: transparent;
}

.cell-action-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  pointer-events: none;
  transition: all 0.2s ease;
  opacity: 0;

  &--left {
    left: -15px;
  }

  &--right {
    right: -15px;
  }

  &--center {
    left: 50%;
    transform: translateX(-50%);
    top: 45px;
  }
}

.approver-cell:not(.is-invisible):hover .cell-action-btn,
.header-cell.step-header:hover .cell-action-btn {
  opacity: 1;
  pointer-events: auto;
}

.approver-cell:has(.dropdown.is-open) .cell-action-btn--center,
.header-cell.step-header:has(.dropdown.is-open) .cell-action-btn--center {
  opacity: 0;
  pointer-events: none;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(1px);
  z-index: 20;
}

.is-invalid {
  border: 1px solid theme("colors.red.500") !important;
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.05) !important;
}

@media (max-width: 768px) {
  .header-cell,
  .table-cell {
    padding: 8px 12px;
    min-width: 120px;
  }

  .supervisor-cell,
  .supervisor-header {
    flex: 0 0 250px;
  }

  .table-row {
    height: 48px;
  }

  .table-cell {
    height: 48px;
  }
}
</style>
`;export{n as default};
