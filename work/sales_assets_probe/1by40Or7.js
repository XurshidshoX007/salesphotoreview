const e=`<template>
  <access-attach-dialog
    :data="normalizedData"
    :is-loading="isLoading"
    :checked-item-ids="checkedItemIds"
    :show-only-checked="showOnlyChecked"
    :update-checked-item-ids="updateCheckedItemIds"
    @close-dialog="emit('closeDialog')"
    @save="onSave"
  >
    <template #title>
      <span> {{ t("access.attach_users") }}: </span>
      <span class="font-semibold text-neutral-950">{{ props.name }}</span>
    </template>

    <template #footer v-if="hasAccess2AttachOperation">
      <div class="flex items-center justify-between gap-4">
        <div class="space-y-4">
          <checkbox
            :checked="showOnlyChecked"
            :title="t('access.show_only_selecteds')"
            @change="showOnlyChecked = $event"
          />
          <checkbox
            :checked="isCanGrantAccessChecked"
            :title="t('access.possibility_of_sharing_with_other_users')"
            @change="isCanGrantAccessChecked = $event"
          />
        </div>

        <m-btn
          class="!ml-auto !bg-gray-200 !text-neutral-600 !border-gray-200"
          @click="emit('closeDialog')"
        >
          {{ t("cancel") }}
        </m-btn>
        <m-btn
          :disabled="!props.canSave || !checkedItemIds.length"
          :loading="isBtnLoading"
          @click="onSave"
        >
          {{ t("save") }}
        </m-btn>
      </div>
    </template>
  </access-attach-dialog>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useAccessAccess } from "~/composables/access/access/access";
import type { AccessByOperationUnattachedUserModel } from "~/interfaces/api/access/by-operation";
import type { MenuTreeItemType } from "~/interfaces/ui/SideMenuTypes";

// Props
const props = defineProps<{
  name?: string;
  canSave?: boolean;
}>();

// Emits
const emit = defineEmits(["closeDialog"]);

// Store
const accessStore = useAccessOperationsStore();

// Composables
const { t } = useI18n();

// Access
const { hasAccess2AttachOperation } = useAccessAccess();

// State
const dataList = ref<AccessByOperationUnattachedUserModel[]>([]);
const checkedItemIds = ref<string[]>([]);
const isBtnLoading = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const isCanGrantAccessChecked = ref<boolean>(false);
const showOnlyChecked = ref<boolean>(false);

// Computed
const normalizedData = computed<MenuTreeItemType[]>(() => {
  return dataList.value.map<MenuTreeItemType>((item) => ({
    id: \`group-\${item.role.id}-\${item.role.name}\`,
    name: item.role.name,
    children: [
      item.users.map((user) => ({
        id: user.id.toString(),
        name: user.name,
        isInactive: !user.is_active,
      })),
    ],
  }));
});

// Hooks
onMounted(async () => {
  try {
    isLoading.value = true;

    const { data } = await accessStore.getUnAttachedUsers();
    dataList.value = data;
  } catch (e) {
    console.log(e);
  } finally {
    isLoading.value = false;
  }
});

// Methods
const updateCheckedItemIds = (ids: string[]) => {
  checkedItemIds.value = ids;
};

const refresh = async () => {
  await accessStore.refreshAttachedUsersList();
  await accessStore.getOperations();
};

const onSave = async () => {
  isBtnLoading.value = true;

  if (checkedItemIds.value.length) {
    const payload = checkedItemIds.value.map((userId) => ({
      user_id: userId,
      operation_id: accessStore.activeOperationId as number,
      can_grant_access: isCanGrantAccessChecked.value,
    }));

    const res = await accessStore.onOperationAttach(payload);
    if (res !== "error") {
      emit("closeDialog");
      await refresh();
      notify({ title: t("toast.saved"), type: "success" });
    }
  }

  isBtnLoading.value = false;
};
<\/script>
`;export{e as default};
