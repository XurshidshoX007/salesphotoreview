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
      <span> {{ t("access.attach_to_user") }}: </span>
      <span class="font-semibold text-neutral-950">{{ props.name }}</span>
    </template>

    <template #footer>
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
          :disabled="!checkedItemIds.length"
          :loading="isSaving"
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
import type { AccessCashboxUnattachedUserModel } from "~/interfaces/api/access/cashbox-model";
import type { MenuTreeItemType } from "~/interfaces/ui/SideMenuTypes";

// Props
const props = defineProps<{
  name?: string;
}>();

// Emits
const emit = defineEmits(["closeDialog"]);

// Store
const cashboxStore = useAccessCashboxStore();

// Composables
const { t } = useI18n();

// State
const dataList = ref<AccessCashboxUnattachedUserModel[]>([]);
const checkedItemIds = ref<string[]>([]);
const isSaving = ref(false);
const isLoading = ref(false);
const showOnlyChecked = ref(false);

// Computed
const normalizedData = computed<MenuTreeItemType[]>(() => {
  return dataList.value.map<MenuTreeItemType>((item) => ({
    id: \`group-\${item.role.id}-\${item.role.name}\`,
    name: item.role.name,
    children: [
      item.user_list.map((user) => ({
        id: user.id.toString(),
        name: user.name,
      })),
    ],
  }));
});

// Hooks
onMounted(async () => {
  try {
    isLoading.value = true;

    const { data } = await cashboxStore.getUnattachedUsers();
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
  await cashboxStore.refreshAttachedUsers();
  await cashboxStore.getCashboxes();
};

const onSave = async () => {
  isSaving.value = true;

  if (checkedItemIds.value.length) {
    const res = await cashboxStore.attachUsers({
      cash_box_id: cashboxStore.activeCashboxId!,
      user_id_arr: checkedItemIds.value,
    });

    if (res !== "error") {
      emit("closeDialog");
      await refresh();
      notify({ title: t("toast.saved"), type: "success" });
    }
  }

  isSaving.value = false;
};
<\/script>
`;export{e as default};
