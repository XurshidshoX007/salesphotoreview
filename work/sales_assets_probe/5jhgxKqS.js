const e=`<template>
  <access-table
    :items="filteredItems"
    :headers="warehouseStore.headers"
    :checked-ids="warehouseStore.checkedUsers"
    :is-loading="warehouseStore.isAttachedUsersLoading"
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
        :id="(item as AccessWarehouseAttachedUserModel).id"
        :checked="
          warehouseStore.checkedUsers.includes(
            (item as AccessWarehouseAttachedUserModel).id,
          )
        "
        :disabled="isSameUser(item as AccessWarehouseAttachedUserModel)"
        :is-in-active-item="
          !(item as AccessWarehouseAttachedUserModel).is_active
        "
        @change="toggleUser((item as AccessWarehouseAttachedUserModel).id)"
      />
    </template>

    <template #cell-name="{ item }">
      <span
        :class="
          !(item as AccessWarehouseAttachedUserModel).is_active &&
          'text-[var(--red-3)]'
        "
      >
        {{ (item as AccessWarehouseAttachedUserModel).name }}
      </span>
    </template>

    <template #cell-role="{ item }">
      {{ (item as AccessWarehouseAttachedUserModel).role?.name }}
    </template>

    <template #cell-role_position="{ item }">
      {{ (item as AccessWarehouseAttachedUserModel).role_position?.name }}
    </template>

    <template #cell-actions="{ item }">
      <access-unattach-button
        :loading="
          isUnattachLoading === (item as AccessWarehouseAttachedUserModel).id
        "
        :disabled="isSameUser(item as AccessWarehouseAttachedUserModel)"
        @click="unattach(item as AccessWarehouseAttachedUserModel)"
      />
    </template>
  </access-table>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useAccessesService } from "~/composables/access/accesses";
import type { AccessWarehouseAttachedUserModel } from "~/interfaces/api/access/warehouse-model";

// Props
const props = defineProps<{
  searchValue?: string;
  onUnattach: (item: AccessWarehouseAttachedUserModel) => Promise<void>;
}>();

// Emits
const emit = defineEmits<{
  refresh: [];
}>();

// Store
const warehouseStore = useAccessWarehouseStore();

// Composables
const { t } = useI18n();
const { userId } = useAccessesService();

// State
const isUnattachLoading = ref<string | null>(null);

// Hooks
watch(
  () => warehouseStore.activeWarehouseId,
  () => {
    warehouseStore.checkedUsers = [];
  },
);

watch(
  () => warehouseStore.params,
  () => {
    warehouseStore.checkedUsers = [];
  },
  { deep: true },
);

const filteredItems = computed(() => {
  let items = warehouseStore.attachedUsers;

  if (warehouseStore.params.roleIds?.length) {
    items = items.filter((item) =>
      warehouseStore.params.roleIds!.includes(item.role.id),
    );
  }
  if (warehouseStore.params.rolePositionIds?.length) {
    items = items.filter((item) =>
      warehouseStore.params.rolePositionIds!.includes(item.role_position?.id),
    );
  }
  if (
    warehouseStore.params.isActive !== undefined &&
    warehouseStore.params.isActive !== null
  ) {
    items = items.filter(
      (item) => item.is_active === warehouseStore.params.isActive,
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
    warehouseStore.checkedUsers.includes(item.id),
  );
});

const isIndeterminate = computed(() => {
  if (isAllChecked.value) return false;
  return selectableItems.value.some((item) =>
    warehouseStore.checkedUsers.includes(item.id),
  );
});

// Methods
const isSameUser = (item: AccessWarehouseAttachedUserModel) =>
  item.id === userId.value;

const searchFields = (
  item: AccessWarehouseAttachedUserModel,
  search: string,
): boolean =>
  item.name?.toLowerCase().includes(search) ||
  item.role?.name?.toLowerCase().includes(search) ||
  item.role_position?.name?.toLowerCase().includes(search);

const onSelectAll = (checked: boolean) => {
  warehouseStore.checkedUsers = checked
    ? selectableItems.value.map((item) => item.id)
    : [];
};

const toggleUser = (id: string) => {
  const idx = warehouseStore.checkedUsers.indexOf(id);
  if (idx === -1) warehouseStore.checkedUsers.push(id);
  else warehouseStore.checkedUsers.splice(idx, 1);
};

const unattach = async (item: AccessWarehouseAttachedUserModel) => {
  try {
    isUnattachLoading.value = item.id;
    await props.onUnattach(item);
    notify({ title: t("toast.success"), type: "success" });
    emit("refresh");
  } catch {
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isUnattachLoading.value = null;
  }
};
<\/script>
`;export{e as default};
