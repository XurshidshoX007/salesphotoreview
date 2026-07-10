const e=`<template>
  <access-table
    :items="filteredItems"
    :headers="branchStore.headers"
    :checked-ids="branchStore.checkedUsers"
    :is-loading="branchStore.isAttachedUsersLoading"
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

    <!-- CELLS -->
    <template #cell-checkbox="{ item }">
      <Checkbox
        :id="(item as AccessBranchAttachedUserModel).id"
        :checked="
          branchStore.checkedUsers.includes(
            (item as AccessBranchAttachedUserModel).id,
          )
        "
        :disabled="isSameUser(item as AccessBranchAttachedUserModel)"
        :is-in-active-item="!(item as AccessBranchAttachedUserModel).is_active"
        @change="toggleUser((item as AccessBranchAttachedUserModel).id)"
      />
    </template>

    <template #cell-name="{ item }">
      <span
        :class="
          !(item as AccessBranchAttachedUserModel).is_active &&
          'text-[var(--red-3)]'
        "
      >
        {{ (item as AccessBranchAttachedUserModel).name }}
      </span>
    </template>

    <template #cell-role="{ item }">
      {{ (item as AccessBranchAttachedUserModel).role?.name }}
    </template>

    <template #cell-role_position="{ item }">
      {{ (item as AccessBranchAttachedUserModel).role_position?.name }}
    </template>

    <template #cell-actions="{ item }">
      <access-unattach-button
        :loading="props.unAttachchingItemId === item.id"
        :disabled="isSameUser(item as AccessBranchAttachedUserModel)"
        @click="emit('unattach', item as AccessBranchAttachedUserModel)"
      />
    </template>
  </access-table>
</template>

<script setup lang="ts">
import { useAccessesService } from "~/composables/access/accesses";
import type { AccessBranchAttachedUserModel } from "~/interfaces/api/access/branch-model";

// Props
const props = defineProps<{
  searchValue?: string;
  unAttachchingItemId?: string;
}>();

// Emits
const emit = defineEmits<{
  unattach: [item: AccessBranchAttachedUserModel];
}>();

// Store
const branchStore = useAccessBranchStore();

// Composables
const { userId } = useAccessesService();

// Hooks
watch(
  () => branchStore.activeBranchId,
  () => {
    branchStore.checkedUsers = [];
  },
);

watch(
  () => branchStore.params,
  () => {
    branchStore.checkedUsers = [];
  },
  { deep: true },
);

const filteredItems = computed(() => {
  let items = branchStore.attachedUsers;

  if (branchStore.params.roleIds?.length) {
    items = items.filter((item) =>
      branchStore.params.roleIds!.includes(item.role.id),
    );
  }
  if (branchStore.params.rolePositionIds?.length) {
    items = items.filter((item) =>
      branchStore.params.rolePositionIds!.includes(item.role_position?.id),
    );
  }
  if (typeof branchStore.params.isActive === "boolean") {
    items = items.filter(
      (item) => item.is_active === branchStore.params.isActive,
    );
  }

  return items;
});

const selectableItems = computed(() =>
  (filteredItems.value || []).filter((item) => !isSameUser(item)),
);

const isAllChecked = computed(() => {
  if (!selectableItems.value.length) return false;
  return selectableItems.value.every((item) =>
    branchStore.checkedUsers.includes(item.id),
  );
});

const isIndeterminate = computed(() => {
  if (isAllChecked.value) return false;
  return selectableItems.value.some((item) =>
    branchStore.checkedUsers.includes(item.id),
  );
});

// Methods
const isSameUser = (item: AccessBranchAttachedUserModel) =>
  item.id === userId.value;

const searchFields = (
  item: AccessBranchAttachedUserModel,
  search: string,
): boolean =>
  item.name?.toLowerCase().includes(search) ||
  item.role?.name?.toLowerCase().includes(search) ||
  item.role_position?.name?.toLowerCase().includes(search);

const onSelectAll = (checked: boolean) => {
  branchStore.checkedUsers = checked
    ? selectableItems.value.map((item) => item.id)
    : [];
};

const toggleUser = (id: string) => {
  const idx = branchStore.checkedUsers.indexOf(id);
  if (idx === -1) branchStore.checkedUsers.push(id);
  else branchStore.checkedUsers.splice(idx, 1);
};
<\/script>
`;export{e as default};
