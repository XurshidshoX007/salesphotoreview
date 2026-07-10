const n=`<template>
  <access-attach-dialog
    :data="normalizedData"
    :is-loading="isLoading"
    :checked-item-ids="checkedItemIds"
    :auto-include-map="OPERATION_AUTO_INCLUDE_MAP"
    :update-checked-item-ids="updateCheckedItemIds"
    @close-dialog="emit('closeDialog')"
    @save="onSave"
  >
    <template #title>
      <span> {{ t("access.attach_roles") }}: </span>
      <span class="font-semibold text-neutral-950">{{ props.name }}</span>
    </template>

    <template #footer v-if="hasAccess2AttachOperation">
      <div class="flex gap-4 items-center">
        <checkbox
          :checked="isCanGrantAccessChecked"
          :title="t('access.possibility_of_sharing_with_other_users')"
          @change="isCanGrantAccessChecked = $event"
        />

        <m-btn
          class="!ml-auto !bg-gray-200 !text-neutral-600 !border-gray-200"
          @click="emit('closeDialog')"
        >
          {{ t("cancel") }}
        </m-btn>
        <m-btn
          :disabled="!props.canSave"
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
import { uuidv4 } from "~/utils/uuidV4";
import type { MenuTreeItemType } from "~/interfaces/ui/SideMenuTypes";
import { PermissionOperation } from "~/variable/access-operations";

// Props
const props = defineProps<{
  name?: string;
  canSave?: boolean;
}>();

// Emits
const emit = defineEmits(["closeDialog"]);

// Store
const accessStore = useAccessUsersStore();

// Composables
const { t } = useI18n();

// Access
const { hasAccess2AttachOperation } = useAccessAccess();

// Constants
const OPERATION_AUTO_INCLUDE_MAP: Record<number, number> = {
  [PermissionOperation.UserEmployeeSave]: PermissionOperation.UserEmployeeList,
  [PermissionOperation.TerritoryAccessSave]:
    PermissionOperation.TerritoryAccessList,
  [PermissionOperation.OperationAttach]:
    PermissionOperation.AttachedOperationList,
};

// State
const dataList = ref<AccessUnAttachedByRoleListModel>([]);
const checkedItemIds = ref<string[]>([]);
const isBtnLoading = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const isCanGrantAccessChecked = ref<boolean>(false);

// Computed
const normalizedData = computed<MenuTreeItemType[]>(() => {
  const transformItem = (
    groupUUID: string,
    item: AccessUnAttachedByRoleListModel[number]["access_operations"][number],
  ): MenuTreeItemType => {
    const transformedChildren = item.children.map((child) =>
      transformItem(groupUUID, child),
    );

    return {
      id: \`group-\${groupUUID}-\${item.id}\`,
      name: item.name,
      children: [
        ...(transformedChildren.length ? [transformedChildren] : []),
        item.operation_list.map((operation) => ({
          id: operation.id.toString(),
          name: operation.name,
        })),
      ],
    };
  };

  const data = dataList.value.map<MenuTreeItemType>((item) => {
    const groupUUID = uuidv4();

    return {
      id: \`group-\${groupUUID}\`,
      name: item.role ?? t("access.unassigned_operations"),
      children: [
        item.access_operations.map((item) => transformItem(groupUUID, item)),
      ],
    };
  });

  return data;
});

// Hooks
onMounted(async () => {
  try {
    isLoading.value = true;

    const { data } = await accessStore.getUnAttachedRoles();
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
  await accessStore.refreshAttachedOperationsList();
  await accessStore.getUsers();
};

const onSave = async () => {
  isBtnLoading.value = true;

  const payload = checkedItemIds.value.map((operationId) => ({
    user_id: accessStore.activeUserId,
    operation_id: Number(operationId),
    can_grant_access: isCanGrantAccessChecked.value,
  }));

  const res = await accessStore.onOperationAttach(payload);
  if (res !== "error") {
    emit("closeDialog");
    await refresh();
    notify({ title: t("toast.saved"), type: "success" });
  }

  isBtnLoading.value = false;
};
<\/script>
`;export{n as default};
