const e=`<template>
  <access-table
    :items="filteredItems"
    :headers="headers"
    :checked-ids="accessStore.checkedUsers"
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
        :disabled="!accessStore.activeOperationCanGrantAccess"
        class="[&_span]:![color:var(--secondary-gray)]"
        @change="onGrantAccessBatch"
      />
    </template>

    <!-- CELLS -->
    <template #cell-checkbox="{ item }">
      <Checkbox
        :id="(item as AccessAttachedUsersListModel).id"
        :checked="
          accessStore.checkedUsers.includes(
            (item as AccessAttachedUsersListModel).id,
          )
        "
        :disabled="isSameUser(item as AccessAttachedUsersListModel)"
        :is-in-active-item="!(item as AccessAttachedUsersListModel).is_active"
        @change="toggleUser((item as AccessAttachedUsersListModel).id)"
      />
    </template>

    <template #cell-name="{ item }">
      <span
        :class="
          !(item as AccessAttachedUsersListModel).is_active &&
          'text-[var(--red-3)]'
        "
      >
        {{ (item as AccessAttachedUsersListModel).name }}
      </span>
    </template>

    <template #cell-role="{ item }">
      {{ (item as AccessAttachedUsersListModel).role?.name }}
    </template>

    <template #cell-role_position="{ item }">
      {{ (item as AccessAttachedUsersListModel).role_position?.name }}
    </template>

    <template #cell-status="{ item }">
      <status-btn-for-table
        readonly
        :status-data="(item as AccessAttachedUsersListModel).status"
      />
    </template>

    <template #cell-can_grant_access="{ item }">
      <Switch
        title=" "
        :active="(item as AccessAttachedUsersListModel).can_grant_access"
        :disabled="!isGrantAccessEditable(item as AccessAttachedUsersListModel)"
        @change="
          (val: boolean) =>
            onGrantAccess(val, item as AccessAttachedUsersListModel)
        "
      />
    </template>

    <template #cell-actions="{ item }">
      <access-unattach-button
        :loading="accessStore.isOperationUnAttachLoading"
        :disabled="
          !accessStore.activeOperationCanGrantAccess ||
          isSameUser(item as AccessAttachedUsersListModel)
        "
        @click="emit('unattach', item as AccessAttachedUsersListModel)"
      />
    </template>
  </access-table>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useAccessAccess } from "~/composables/access/access/access";
import { useAccessesService } from "~/composables/access/accesses";
import type { AccessAttachedUsersListModel } from "~/interfaces/api/access/attached-list-model";

// Props
defineProps<{
  searchValue?: string;
}>();

// Emits
const emit = defineEmits<{
  unattach: [item: AccessAttachedUsersListModel];
}>();

// Store
const accessStore = useAccessOperationsStore();

// Composables
const { t } = useI18n();
const { hasAccess2SetGrandAccess, hasAccess2UnattachOperation } =
  useAccessAccess();
const { userId } = useAccessesService();

// Hooks
watch(
  () => accessStore.activeOperationId,
  () => {
    accessStore.checkedUsers = [];
  },
);

watch(
  () => accessStore.filterParams,
  () => {
    accessStore.checkedUsers = [];
  },
  { deep: true },
);

const filteredItems = computed(() => {
  let items = accessStore.attachedUsersList || [];

  const { statusIds, rolePositionIds, canGrantAccess } =
    accessStore.filterParams;

  if (statusIds?.length) {
    items = items.filter((item) => statusIds.includes(item.status.id));
  }

  if (rolePositionIds?.length) {
    items = items.filter(
      (item) =>
        item.role_position && rolePositionIds.includes(item.role_position?.id),
    );
  }

  if (canGrantAccess != null) {
    items = items.filter((item) => item.can_grant_access === canGrantAccess);
  }

  if (typeof accessStore.filterParams.isActive === "boolean") {
    items = items.filter(
      (item) => item.is_active === accessStore.filterParams.isActive,
    );
  }

  return items;
});

const headers = computed<Template[]>(() => [
  {
    name: "",
    key: "checkbox",
    type: "checkbox",
    thWidth: 40,
    checked:
      hasAccess2UnattachOperation.value &&
      accessStore.activeOperationCanGrantAccess,
  },
  {
    name: t("access.user_name"),
    key: "name",
    checked: true,
  },
  {
    name: t("settings.role"),
    key: "role",
    checked: true,
  },
  {
    name: t("users.employee_work.role_position"),
    key: "role_position",
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
    checked:
      hasAccess2UnattachOperation.value &&
      accessStore.activeOperationCanGrantAccess,
  },
]);

const selectableItems = computed(() =>
  filteredItems.value.filter((item) => !isSameUser(item)),
);

const isAllChecked = computed(() => {
  if (!selectableItems.value.length) return false;
  return selectableItems.value.every((item) =>
    accessStore.checkedUsers.includes(item.id),
  );
});

const isIndeterminate = computed(() => {
  if (isAllChecked.value) return false;
  return selectableItems.value.some((item) =>
    accessStore.checkedUsers.includes(item.id),
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
const isSameUser = (item: AccessAttachedUsersListModel) =>
  item.id === userId.value;

const isGrantAccessEditable = (item: AccessAttachedUsersListModel): boolean =>
  item.can_change_grant_access &&
  accessStore.activeOperationCanGrantAccess &&
  !isSameUser(item);

const searchFields = (
  item: AccessAttachedUsersListModel,
  search: string,
): boolean =>
  item.name?.toLowerCase().includes(search) ||
  item.role?.name?.toLowerCase().includes(search);

const onGrantAccess = async (
  canGrantAccess: boolean,
  item: AccessAttachedUsersListModel,
) => {
  const originalValue = item.can_grant_access;

  // Optimistic update
  item.can_grant_access = canGrantAccess;

  try {
    const response = await accessStore.setGrandAccess({
      can_grant_access: canGrantAccess,
      id: item.user_access_operation_id,
    });

    if (response !== "error") {
      await accessStore.getAttachedUsersList();
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
  const usersToUpdate = (accessStore.attachedUsersList || [])
    .filter(
      (user) =>
        !isSameUser(user) &&
        user.can_change_grant_access &&
        user.can_grant_access !== canGrantAccess,
    )
    .map((user) => ({
      can_grant_access: canGrantAccess,
      id: user.user_access_operation_id,
    }));

  if (usersToUpdate.length === 0) return;

  try {
    const response = await accessStore.setGrandAccessBatch(usersToUpdate);

    if (response !== "error") {
      await accessStore.getAttachedUsersList();
      notify({ title: t("saved"), type: "success" });
    } else {
      throw new Error("Server error");
    }
  } catch {
    notify({ title: t("error"), type: "error" });
  }
};

const onSelectAll = (checked: boolean) => {
  accessStore.checkedUsers = checked
    ? selectableItems.value.map((item) => item.id)
    : [];
};

const toggleUser = (id: string) => {
  const idx = accessStore.checkedUsers.indexOf(id);
  if (idx === -1) accessStore.checkedUsers.push(id);
  else accessStore.checkedUsers.splice(idx, 1);
};
<\/script>
`;export{e as default};
