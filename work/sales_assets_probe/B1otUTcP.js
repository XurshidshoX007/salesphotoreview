const n=`<!-- Main Approvers Component -->
<template>
  <div class="main-approvers-container">
    <VueDraggable
      v-model="localMainApprovers"
      :animation="150"
      ghost-class="ghost-item"
      chosen-class="chosen-item"
      drag-class="drag-item"
      draggable=".main-approver-dropdown"
      class="main-approvers-draggable"
      handle=".dropdown-icon-btn"
      @end="onDragEnd"
    >
      <div
        v-for="(approver, index) in localMainApprovers"
        :key="\`approver-\${approver.id || 'empty'}-\${index}\`"
        class="main-approver-dropdown"
      >
        <flex-row class="items-center gap-2">
          <DropdownsByFilterStates
            :filter-states="[getDropdownConfig(index + 1)]"
            @on-open-dropdown="onOpenDropdown"
          />
          <RoundedIconBtn
            icon-file-name="X"
            type="danger"
            size="2xsm"
            bg-color="white"
            hover-bg="white"
            class="remove-btn"
            @click="onRemoveMainApprover(approver.id, index)"
          />
        </flex-row>
      </div>
    </VueDraggable>
    <m-btn
      :disabled="!selectedDirectionId"
      group="outlined"
      @click="onAddMainApproverDropdown"
      class="min-w-70 add-main-approver-btn"
    >
      <flex-row class="items-center gap-1">
        <IconPlus />
        {{ t("plan.setting_approvers.add_main_approver") }}
      </flex-row>
    </m-btn>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { VueDraggable } from "vue-draggable-plus";
import type { DropdownModel } from "~~/interfaces/dropdown-model";
import type { DropdownItemsModelByType } from "~~/interfaces/ui/dropdown-items-model";
import type { SettingApproversByTradeDirectionModel } from "~~/interfaces/api/planning/setting-approvers-models";

// Props
const props = defineProps<{
  mainApprovers: Array<SettingApproversByTradeDirectionModel> | undefined;
  managers: DropdownItemsModelByType<DropdownModel> | undefined;
  selectedDirectionId: string;
}>();

// Emits
const emit = defineEmits<{
  openDropdown: [state: string];
  addMainApprover: [];
  updateMainApprover: [payload: { managerId: string; orderNumber: number }];
  reorderMainApprovers: [payload: { oldIndex: number; newIndex: number }];
  removeMainApprover: [index: number, managerId: string | undefined];
}>();

const { t } = useI18n();

const localMainApprovers = ref<Array<{ id: string }>>([]);

const onDragEnd = (event: any): void => {
  const { oldIndex, newIndex } = event;
  if (oldIndex === newIndex) return;
  emit("reorderMainApprovers", { oldIndex, newIndex });
};

const onRemoveMainApprover = (managerId: string, index: number): void => {
  if (!managerId) {
    localMainApprovers.value.splice(index, 1);
    emit("removeMainApprover", index, undefined);
  } else {
    emit("removeMainApprover", index, managerId);
  }
};

const onAddMainApproverDropdown = (): void => {
  emit("addMainApprover");
};

const onOpenDropdown = (state: string) => emit("openDropdown", state);

const getSelectedIds = (excludeOrder: number): string[] => {
  return localMainApprovers.value
    .map((approver, idx) => (idx + 1 === excludeOrder ? "" : approver.id))
    .filter((id) => id?.trim());
};

const getDropdownConfig = (orderNumber: number) => {
  const selectedIds = getSelectedIds(orderNumber);
  const currentId = localMainApprovers.value[orderNumber - 1]?.id || "";

  return {
    key: \`main_\${orderNumber}\`,
    isSingleSelect: true,
    icon: "menu-control",

    get data() {
      return {
        ...props.managers,
        items:
          props.managers?.items?.filter(
            (m) => !selectedIds.includes(m.id) || m.id === currentId,
          ) || [],
      };
    },

    get getSelectedData() {
      return currentId;
    },

    set setSelectedData(value: string) {
      const selectedManager = props.managers?.items?.find(
        (m) => m.id === value,
      );
      if (!selectedManager) return;

      if (localMainApprovers.value[orderNumber - 1]) {
        localMainApprovers.value[orderNumber - 1].id = value;
      }

      emit("updateMainApprover", { managerId: value, orderNumber });
    },
  };
};

watch(
  () => props.mainApprovers,
  (newApprovers) => {
    localMainApprovers.value = newApprovers ? [...newApprovers] : [];
  },
  { deep: true, immediate: true },
);
<\/script>

<style scoped lang="scss">
.main-approvers-container {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
}

.main-approvers-draggable {
  display: contents;
}

.add-main-approver-btn {
  align-self: flex-start;
}

.main-approver-dropdown {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 200px;
  flex-shrink: 0;
  transition: all 0.3s ease;

  .remove-btn {
    position: absolute;
    top: 100%;
    left: 50%;
    transition: transform 0.3s ease;
    transform: translate(-50%, -50%);
    opacity: 0;
  }

  &:hover {
    .remove-btn {
      opacity: 1;
    }
  }
}

.main-approver-dropdown:has(.dropdown.is-open) .remove-btn {
  opacity: 0;
  pointer-events: none;
}

:deep(.dropdown-icon-btn) {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: theme("colors.neutral.400");
  transition: color 0.2s ease;

  &:hover {
    color: theme("colors.primary.600");
  }

  &:active {
    cursor: grabbing;
  }
}

// Drag and drop states
.ghost-item {
  opacity: 0.5;
  transform: scale(0.95);
  background: transparent;
  border: 2px dashed theme("colors.primary.400");
  border-radius: 8px;
}

.chosen-item {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;

  :deep(.dropdown-btn) {
    border: 1px solid theme("colors.primary.600");
  }
}

.drag-item {
  transform: rotate(2deg);
  opacity: 0.9;
}

@media (max-width: 768px) {
  .main-approvers-container {
    flex-direction: column;
    align-items: stretch;
  }

  .main-approver-dropdown {
    min-width: 150px;
  }
}
</style>
`;export{n as default};
