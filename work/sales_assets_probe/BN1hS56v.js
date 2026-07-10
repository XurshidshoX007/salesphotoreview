const e=`<template>
  <access-table
    :items="filteredItems"
    :headers="paymentMethodStore.headers"
    :checked-ids="paymentMethodStore.checkedUsers"
    :is-loading="paymentMethodStore.isAllowedUsersLoading"
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
        :id="item.id"
        :checked="paymentMethodStore.checkedUsers.includes(item.id)"
        :disabled="isSameUser(item)"
        :is-in-active-item="!item.is_active"
        @change="toggleUser(item.id)"
      />
    </template>

    <template #cell-name="{ item }">
      <span :class="!item.is_active && 'text-[var(--red-3)]'">
        {{ item.name }}
      </span>
    </template>

    <template #cell-role="{ item }">
      {{ item.role?.name }}
    </template>

    <template #cell-role_position="{ item }">
      {{ item.role_position?.name }}
    </template>

    <template #cell-actions="{ item }">
      <access-unattach-button
        :loading="isRestrictLoading === item.id"
        :disabled="isSameUser(item)"
        @click="restrict(item.id)"
      />
    </template>
  </access-table>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useAccessesService } from "~/composables/access/accesses";

// Props
const props = defineProps<{
  searchValue?: string;
  onRestrict: (id: string) => Promise<void>;
}>();

// Store
const paymentMethodStore = useAccessPaymentMethodStore();

// Emits
const emit = defineEmits<{
  (e: "refresh"): void;
}>();

// Composable
const { t } = useI18n();
const { userId } = useAccessesService();

// States
const isRestrictLoading = ref<string | null>(null);

// Hooks
watch(
  () => paymentMethodStore.activePaymentMethodId,
  () => {
    paymentMethodStore.checkedUsers = [];
  },
);

const filteredItems = computed(() => paymentMethodStore.allowedUsers);

const selectableItems = computed(() =>
  (filteredItems.value || []).filter((item) => !isSameUser(item)),
);

const isAllChecked = computed(() => {
  if (!selectableItems.value.length) return false;
  return selectableItems.value.every((item) =>
    paymentMethodStore.checkedUsers.includes(item.id),
  );
});

const isIndeterminate = computed(() => {
  if (isAllChecked.value) return false;
  return selectableItems.value.some((item) =>
    paymentMethodStore.checkedUsers.includes(item.id),
  );
});

// Methods
const isSameUser = (item: AccessPaymentMethodAllowedUserModel) =>
  item.id === userId.value;

const searchFields = (
  item: AccessPaymentMethodAllowedUserModel,
  search: string,
): boolean =>
  item.name?.toLowerCase().includes(search) ||
  item.role?.name?.toLowerCase().includes(search) ||
  item.role_position?.name?.toLowerCase().includes(search);

const onSelectAll = (checked: boolean) => {
  paymentMethodStore.checkedUsers = checked
    ? selectableItems.value.map((item) => item.id)
    : [];
};

const toggleUser = (id: string) => {
  const idx = paymentMethodStore.checkedUsers.indexOf(id);
  if (idx === -1) paymentMethodStore.checkedUsers.push(id);
  else paymentMethodStore.checkedUsers.splice(idx, 1);
};

const restrict = async (id: string) => {
  try {
    isRestrictLoading.value = id;
    await props.onRestrict(id);
    notify({ title: t("toast.success"), type: "success" });
    emit("refresh");
  } catch (error) {
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isRestrictLoading.value = null;
  }
};
<\/script>
`;export{e as default};
