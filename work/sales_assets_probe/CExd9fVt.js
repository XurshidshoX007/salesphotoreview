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

    <template #footer v-if="hasAccess2SaveUserEmployee">
      <div class="flex gap-4 items-center">
        <checkbox
          :checked="showOnlyChecked"
          :title="t('access.show_only_selecteds')"
          @change="showOnlyChecked = $event"
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
import type { AccessUnAttachedUserModel } from "~/interfaces/api/access/unattached-users-list-model";
import type { MenuTreeItemType } from "~/interfaces/ui/SideMenuTypes";

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
const { hasAccess2SaveUserEmployee } = useAccessAccess();

// State
const dataList = ref<AccessUnAttachedUserModel[]>([]);
const checkedItemIds = ref<string[]>([]);
const isBtnLoading = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const showOnlyChecked = ref<boolean>(false);

// Computed
const normalizedData = computed<MenuTreeItemType[]>(() => {
  return dataList.value.map<MenuTreeItemType>((item) => ({
    id: \`group-\${item.role.id}-\${item.role.name}\`,
    name: item.role.name,
    children: [
      item.employee_list.map((employee) => {
        const id = employee.id.toString();

        return {
          id,
          name: employee.name,
          isInactive: !employee.is_active,
          isDisabled: !employee.is_active && !checkedItemIds.value.includes(id),
        };
      }),
    ],
  }));
});

// Hooks
onMounted(async () => {
  try {
    isLoading.value = true;

    const { data } = await accessStore.getUserEmployees();
    dataList.value = data;

    // Pre-select employees with is_checked: true
    checkedItemIds.value = data
      .flatMap((item) => item.employee_list)
      .filter((employee) => employee.is_checked)
      .map((employee) => employee.id);
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

const onSave = async () => {
  isBtnLoading.value = true;

  const res = await accessStore.onAttachEmployee({
    user_id: accessStore.activeUserId,
    employee_id_arr: checkedItemIds.value,
  });

  if (res !== "error") {
    emit("closeDialog");
    notify({ title: t("toast.saved"), type: "success" });
  }

  isBtnLoading.value = false;
};
<\/script>
`;export{e as default};
