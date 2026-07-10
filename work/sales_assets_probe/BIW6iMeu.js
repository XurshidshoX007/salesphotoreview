const e=`<template>
  <access-table
    :items="filteredItems"
    :headers="cashboxStore.headers"
    :checked-ids="cashboxStore.checkedUsers"
    :is-loading="cashboxStore.isAttachedUsersLoading"
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
        :id="(item as AccessCashboxAttachedUserModel).id"
        :checked="
          cashboxStore.checkedUsers.includes(
            (item as AccessCashboxAttachedUserModel).id,
          )
        "
        :disabled="isSameUser(item as AccessCashboxAttachedUserModel)"
        :is-in-active-item="!(item as AccessCashboxAttachedUserModel).is_active"
        @change="toggleUser((item as AccessCashboxAttachedUserModel).id)"
      />
    </template>

    <template #cell-name="{ item }">
      <span
        :class="
          !(item as AccessCashboxAttachedUserModel).is_active &&
          'text-[var(--red-3)]'
        "
      >
        {{ (item as AccessCashboxAttachedUserModel).name }}
      </span>
    </template>

    <template #cell-role="{ item }">
      {{ (item as AccessCashboxAttachedUserModel).role?.name }}
    </template>

    <template #cell-role_position="{ item }">
      {{ (item as AccessCashboxAttachedUserModel).role_position?.name }}
    </template>

    <template #cell-actions="{ item }">
      <access-unattach-button
        :loading="
          isUnattachLoading === (item as AccessCashboxAttachedUserModel).id
        "
        :disabled="isSameUser(item as AccessCashboxAttachedUserModel)"
        @click="unattach(item as AccessCashboxAttachedUserModel)"
      />
    </template>
  </access-table>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useAccessesService } from "~/composables/access/accesses";
import type { AccessCashboxAttachedUserModel } from "~/interfaces/api/access/cashbox-model";

// Props
const props = defineProps<{
  searchValue?: string;
  onUnattach: (item: AccessCashboxAttachedUserModel) => Promise<void>;
}>();

// Emits
const emit = defineEmits<{
  refresh: [];
}>();

// Store
const cashboxStore = useAccessCashboxStore();

// Composables
const { t } = useI18n();
const { userId } = useAccessesService();

// State
const isUnattachLoading = ref<string | null>(null);

// Hooks
watch(
  () => cashboxStore.activeCashboxId,
  () => {
    cashboxStore.checkedUsers = [];
  },
);

watch(
  () => cashboxStore.params,
  () => {
    cashboxStore.checkedUsers = [];
  },
  { deep: true },
);

const filteredItems = computed(() => {
  let items = cashboxStore.attachedUsers;

  if (cashboxStore.params.roleIds?.length) {
    items = items.filter((item) =>
      cashboxStore.params.roleIds!.includes(item.role.id),
    );
  }
  if (cashboxStore.params.rolePositionIds?.length) {
    items = items.filter((item) =>
      cashboxStore.params.rolePositionIds!.includes(item.role_position?.id),
    );
  }
  if (
    cashboxStore.params.isActive !== undefined &&
    cashboxStore.params.isActive !== null
  ) {
    items = items.filter(
      (item) => item.is_active === cashboxStore.params.isActive,
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
    cashboxStore.checkedUsers.includes(item.id),
  );
});

const isIndeterminate = computed(() => {
  if (isAllChecked.value) return false;
  return selectableItems.value.some((item) =>
    cashboxStore.checkedUsers.includes(item.id),
  );
});

// Methods
const isSameUser = (item: AccessCashboxAttachedUserModel) =>
  item.id === userId.value;

const searchFields = (
  item: AccessCashboxAttachedUserModel,
  search: string,
): boolean =>
  item.name?.toLowerCase().includes(search) ||
  item.role?.name?.toLowerCase().includes(search) ||
  item.role_position?.name?.toLowerCase().includes(search);

const onSelectAll = (checked: boolean) => {
  cashboxStore.checkedUsers = checked
    ? selectableItems.value.map((item) => item.id)
    : [];
};

const toggleUser = (id: string) => {
  const idx = cashboxStore.checkedUsers.indexOf(id);
  if (idx === -1) cashboxStore.checkedUsers.push(id);
  else cashboxStore.checkedUsers.splice(idx, 1);
};

const unattach = async (item: AccessCashboxAttachedUserModel) => {
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
