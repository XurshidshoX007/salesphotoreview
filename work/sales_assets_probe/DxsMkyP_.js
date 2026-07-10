const e=`<template>
  <access-table
    :items="filteredItems"
    :headers="headers"
    :checked-ids="accessStore.checkedOperations"
    :is-loading="accessStore.isLoading"
    :search-value="searchValue"
    :search-fields="searchFields"
  >
    <!-- HEADERS -->
    <template #header-checkbox>
      <Checkbox
        :checked="isAllChecked"
        :indeterminate="isIndeterminate"
        @change="onSelectAll"
      />
    </template>

    <template #header-can_grant_access>
      <Switch
        :title="t('column.providing_access')"
        :active="isAllGrantAccess"
        :indeterminate="isSomeGrantAccess"
        :disabled="props.disableActions"
        class="[&_span]:![color:var(--secondary-gray)]"
        @change="onGrantAccessBatch"
      />
    </template>

    <!-- CELLS -->
    <template #cell-checkbox="{ item }">
      <Checkbox
        :id="(item as AccessAttachedOperationsListModel).operation?.id"
        :checked="
          accessStore.checkedOperations.includes(
            (item as AccessAttachedOperationsListModel).operation?.id,
          )
        "
        :disabled="
          !(item as AccessAttachedOperationsListModel).can_edit ||
          props.disableActions
        "
        @change="
          toggleOperation(
            (item as AccessAttachedOperationsListModel).operation?.id,
          )
        "
      />
    </template>

    <template #cell-operation="{ item }">
      {{ (item as AccessAttachedOperationsListModel).operation?.name }}
    </template>

    <template #cell-operation_parent="{ item }">
      {{ (item as AccessAttachedOperationsListModel).operation_parent }}
    </template>

    <template #cell-status="{ item }">
      <status-btn-for-table
        readonly
        :status-data="(item as AccessAttachedOperationsListModel).status"
      />
    </template>

    <template #cell-can_grant_access="{ item }">
      <Switch
        title=" "
        :active="(item as AccessAttachedOperationsListModel).can_grant_access"
        :disabled="
          !isGrantAccessEditable(item as AccessAttachedOperationsListModel)
        "
        @change="
          (val: boolean) =>
            onGrantAccess(val, item as AccessAttachedOperationsListModel)
        "
      />
    </template>

    <template #cell-actions="{ item }">
      <access-unattach-button
        :loading="
          isUnattachLoading ===
          (item as AccessAttachedOperationsListModel).operation?.id
        "
        :disabled="
          !(item as AccessAttachedOperationsListModel).can_edit ||
          props.disableActions
        "
        @click="unattach(item as AccessAttachedOperationsListModel)"
      />
    </template>
  </access-table>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useAccessAccess } from "~/composables/access/access/access";
import type { AccessAttachedOperationsListModel } from "~/interfaces/api/access/attached-list-model";

// Props
const props = defineProps<{
  searchValue?: string;
  disableActions?: boolean;
  onUnattach: (item: AccessAttachedOperationsListModel) => Promise<void>;
}>();

// Emits
const emit = defineEmits<{
  refresh: [];
}>();

// Store
const accessStore = useAccessUsersStore();

// Composables
const { t } = useI18n();
const { hasAccess2SetGrandAccess, hasAccess2UnattachOperation } =
  useAccessAccess();

// State
const isUnattachLoading = ref<number | null>(null);

// Hooks
watch(
  () => accessStore.activeUserId,
  () => {
    accessStore.checkedOperations = [];
  },
);

watch(
  () => accessStore.filterParams,
  () => {
    accessStore.checkedOperations = [];
  },
  { deep: true },
);

const filteredItems = computed(() => {
  let items = accessStore.attachedOperationsList || [];

  const { operationParents, statusIds, canGrantAccess } =
    accessStore.filterParams;

  if (operationParents?.length) {
    items = items.filter((item) =>
      operationParents.includes(item.operation_parent),
    );
  }

  if (statusIds?.length) {
    items = items.filter((item) => statusIds.includes(item.status.id));
  }

  if (canGrantAccess != null) {
    items = items.filter((item) => item.can_grant_access === canGrantAccess);
  }

  return items;
});

const headers = computed<Template[]>(() => [
  {
    name: "",
    key: "checkbox",
    type: "checkbox",
    thWidth: 40,
    checked: hasAccess2UnattachOperation.value && !props.disableActions,
  },
  {
    name: t("column.description"),
    key: "operation",
    checked: true,
  },
  {
    name: t("column.parent"),
    key: "operation_parent",
    checked: true,
  },
  {
    name: t("column.status"),
    key: "status",
    checked: true,
  },
  {
    name: t("column.providing_access"),
    key: "can_grant_access",
    right: true,
    checked: hasAccess2SetGrandAccess.value,
  },
  {
    name: t("sidebar.actions"),
    key: "actions",
    right: true,
    checked: hasAccess2UnattachOperation.value && !props.disableActions,
  },
]);

const selectableItems = computed(() =>
  filteredItems.value.filter((item) => item.can_edit && !props.disableActions),
);

const isAllChecked = computed(() => {
  if (!selectableItems.value.length) return false;
  return selectableItems.value.every((item) =>
    accessStore.checkedOperations.includes(item.operation?.id),
  );
});

const isIndeterminate = computed(() => {
  if (isAllChecked.value) return false;
  return selectableItems.value.some((item) =>
    accessStore.checkedOperations.includes(item.operation?.id),
  );
});

const isAllGrantAccess = computed(() => {
  if (!filteredItems.value.length) return false;
  return filteredItems.value.every(
    (item) => isGrantAccessEditable(item) && item.can_grant_access,
  );
});

const isSomeGrantAccess = computed(() => {
  if (isAllGrantAccess.value) return false;
  return filteredItems.value.some(
    (item) => isGrantAccessEditable(item) && item.can_grant_access,
  );
});

// Methods
const isGrantAccessEditable = (
  item: AccessAttachedOperationsListModel,
): boolean =>
  item.can_edit && item.can_change_grant_access && !props.disableActions;

const searchFields = (
  item: AccessAttachedOperationsListModel,
  search: string,
): boolean =>
  item.operation?.id?.toString().includes(search) ||
  item.operation?.name?.toLowerCase().includes(search) ||
  (item.operation_parent?.toLowerCase() || "").includes(search);

const onGrantAccess = async (
  canGrantAccess: boolean,
  item: AccessAttachedOperationsListModel,
) => {
  const originalValue = item.can_grant_access;

  // Optimistic update
  item.can_grant_access = canGrantAccess;

  try {
    const response = await accessStore.setGrandAccess({
      can_grant_access: canGrantAccess,
      id: item.id,
    });

    if (response !== "error") {
      await accessStore.getAttachedOperationsList();
      notify({ title: t("saved"), type: "success" });
    } else {
      throw new Error("Server error");
    }
  } catch {
    // Revert optimistic update
    item.can_grant_access = originalValue;
    notify({ title: t("error"), type: "error" });
  }
};

const onGrantAccessBatch = async (canGrantAccess: boolean) => {
  if (props.disableActions) return;

  const operationsToUpdate = (accessStore.attachedOperationsList || [])
    .filter(
      (op) =>
        op.can_edit &&
        op.can_change_grant_access &&
        op.can_grant_access !== canGrantAccess,
    )
    .map((op) => ({
      can_grant_access: canGrantAccess,
      id: op.id,
    }));

  if (operationsToUpdate.length === 0) return;

  try {
    const response = await accessStore.setGrandAccessBatch(operationsToUpdate);

    if (response !== "error") {
      await accessStore.getAttachedOperationsList();
      notify({ title: t("saved"), type: "success" });
    } else {
      throw new Error("Server error");
    }
  } catch {
    notify({ title: t("error"), type: "error" });
  }
};

const onSelectAll = (checked: boolean) => {
  accessStore.checkedOperations = checked
    ? selectableItems.value.map((item) => item.operation?.id)
    : [];
};

const toggleOperation = (id: number) => {
  const idx = accessStore.checkedOperations.indexOf(id);
  if (idx === -1) accessStore.checkedOperations.push(id);
  else accessStore.checkedOperations.splice(idx, 1);
};

const unattach = async (item: AccessAttachedOperationsListModel) => {
  const rowId = item.operation?.id;
  if (rowId == null) return;

  try {
    isUnattachLoading.value = rowId;
    await props.onUnattach(item);
    notify({ title: t("toast.saved"), type: "success" });
    emit("refresh");
  } catch {
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isUnattachLoading.value = null;
  }
};
<\/script>
`;export{e as default};
