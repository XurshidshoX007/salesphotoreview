const e=`<template>
  <div class="h-full">
    <access-drawer-layout ref="drawerRef">
      <template #sidebar>
        <access-users-menu />
      </template>

      <template #content>
        <access-users-filter v-if="accessStore.activeUserId" />

        <card
          v-if="accessStore.activeUserId"
          :classes="{
            root: 'flex flex-col h-fit max-h-full',
            header: 'justify-between flex-wrap gap-3 mb-3 flex-shrink-0',
            content: 'overflow-auto border-t',
          }"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <search-input :value="searchValue" @change="onSearch" />

              <refresh-btn
                :loading="accessStore.isLoading"
                @click="accessStore.getAttachedOperationsList()"
              />
            </div>

            <div
              v-if="filteredBtns.length > 0"
              class="flex rounded-lg overflow-hidden cursor-pointer border font-normal text-sm"
            >
              <m-btn
                v-for="btn in filteredBtns"
                :key="btn.id"
                group="outlined"
                class="!border-l-none !border-t-none !border-b-none !border-r !rounded-[0px] last:!border-r-none !px-4 !bg-transparent hover:!bg-neutral-50"
                @click="onOpenDialog(btn.type)"
              >
                {{ btn.name }}
              </m-btn>
            </div>
          </template>

          <access-users-table
            :search-value="searchValue"
            :disable-actions="isSameUser"
            :on-unattach="onUnAttachSingle"
            @refresh="refresh"
          />
        </card>

        <div v-else class="h-full grid place-items-center">
          <no-infarmation :title="t('access.no_information_found')" />
        </div>
      </template>
    </access-drawer-layout>

    <transition name="modal">
      <div v-if="isDialogOpen && attachType === 'territories'">
        <access-users-attach-territory-dialog
          :name="activeName"
          :allow-to-save="hasAccessToAttach"
          :disabled-save-button="isSameUser"
          @closeDialog="onCloseDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isDialogOpen && attachType === 'roles'">
        <access-users-attach-roles-dialog
          :name="activeName"
          :can-save="!isSameUser"
          @close-dialog="onCloseDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isDialogOpen && attachType === 'operations'">
        <access-users-attach-operations-dialog
          :name="activeName"
          :can-save="!isSameUser"
          @close-dialog="onCloseDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isDialogOpen && attachType === 'employees'">
        <access-users-attach-employees-dialog
          :name="activeName"
          :can-save="!isSameUser"
          @close-dialog="onCloseDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isDialogOpen && attachType === 'cashboxes'">
        <access-users-attach-cashboxes-dialog
          :name="activeName"
          :can-save="!isSameUser"
          @close-dialog="onCloseDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isDialogOpen && attachType === 'warehouses'">
        <access-users-attach-warehouses-dialog
          :name="activeName"
          :can-save="!isSameUser"
          @close-dialog="onCloseDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isDialogOpen && attachType === 'branches'">
        <access-users-attach-branch-dialog
          :name="activeName"
          :can-save="!isSameUser"
          @close-dialog="onCloseDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isDialogOpen && attachType === 'payment-methods'">
        <access-users-attach-payment-methods-dialog
          :name="activeName"
          :can-save="!isSameUser"
          @close-dialog="onCloseDialog"
        />
      </div>
    </transition>

    <toolbar
      :is-open="!!accessStore.checkedOperations.length"
      class="text-white"
      @close="accessStore.setNullCheckedOperations()"
    >
      <i18n-t
        keypath="access.selected_of_total"
        tag="div"
        class="flex items-center gap-2 font-medium"
      >
        <template #count>
          <span
            class="border rounded-lg px-2 py-1 text-xs h-6 min-w-6 shrink-0"
          >
            {{ accessStore.checkedOperations.length }}
          </span>
        </template>
        <template #total>
          <span class="font-bold">
            {{ accessStore.attachedOperationsList?.length || 0 }}
          </span>
        </template>
      </i18n-t>

      <access-unattach-button
        v-if="hasAccess2UnattachOperation"
        :disabled="isSameUser"
        :loading="isMultiUnAttachLoading"
        :class="
          cn(
            '!text-white !bg-orange-500 hover:!bg-orange-600 !border-orange-500',
            isMultiUnAttachLoading && '[&_path]:fill-white',
          )
        "
        @click="onUnAttachSelected"
      />
    </toolbar>
  </div>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useAccessAccess } from "~/composables/access/access/access";
import { useAccessesService } from "~/composables/access/accesses";
import type { AccessAttachedOperationsListModel } from "~/interfaces/api/access/attached-list-model";
import { cn } from "~/utils/helpers";

// Types
type AttachType =
  | "employees"
  | "roles"
  | "operations"
  | "territories"
  | "cashboxes"
  | "warehouses"
  | "branches"
  | "payment-methods";

// Store
const accessStore = useAccessUsersStore();

// Composables
const { t } = useI18n();
const { userId } = useAccessesService();

// Access
const {
  hasAccess2UnattachOperation,
  hasAccess2GetOperationListByRole,
  hasAccess2GetGroupedOperationList,
  hasAccess2AttachOperation,
  hasAccess2GetUserEmployeeList,
  hasAccess2SaveUserEmployee,
  hasAccess2GetTerritoryAccessList,
  hasAccess2SaveTerritoryAccess,
} = useAccessAccess();

// Child-components
const drawerRef = ref<{ closeDrawer: () => void; isMobile: boolean }>();

// State
const searchValue = ref("");
const isDialogOpen = ref(false);
const attachType = ref<AttachType>();
const isMultiUnAttachLoading = ref(false);

// Hooks
watch(
  () => accessStore.activeUserId,
  () => {
    if (drawerRef.value?.isMobile) drawerRef.value.closeDrawer();
  },
);

const isSameUser = computed(() => accessStore.activeUserId === userId.value);

const activeUser = computed(() =>
  accessStore.users?.find((user) => user.user.id === accessStore.activeUserId),
);

const activeName = computed(() => activeUser.value?.user?.name);

const isPartner = computed(() => activeUser.value?.role.id === 10);

const buttons = computed(() => [
  {
    name: t("access.territories"),
    id: 1,
    type: "territories" as AttachType,
    hasAccess: hasAccess2GetTerritoryAccessList.value,
  },
  {
    name: t("settings_sidebar.employees"),
    id: 2,
    type: "employees" as AttachType,
    hasAccess: hasAccess2GetUserEmployeeList.value && !isPartner.value,
  },
  {
    name: t("settings.roles"),
    id: 3,
    type: "roles" as AttachType,
    hasAccess: hasAccess2GetOperationListByRole.value && !isSameUser.value,
  },
  {
    name: t("access.operations"),
    id: 4,
    type: "operations" as AttachType,
    hasAccess: hasAccess2GetGroupedOperationList.value && !isSameUser.value,
  },
  {
    name: t("column.cashboxes"),
    id: 5,
    type: "cashboxes" as AttachType,
    hasAccess: true,
  },
  {
    name: t("column.warehouses"),
    id: 6,
    type: "warehouses" as AttachType,
    hasAccess: true,
  },
  {
    name: t("column.branch"),
    id: 7,
    type: "branches" as AttachType,
    hasAccess: true,
  },
  {
    name: t("settings_sidebar.payment_method"),
    id: 8,
    type: "payment-methods" as AttachType,
    hasAccess: true,
  },
]);

const filteredBtns = computed(() =>
  buttons.value.filter((btn) => btn.hasAccess),
);

const hasAccessToAttach = computed(() => {
  switch (attachType.value) {
    case "employees":
      return hasAccess2SaveUserEmployee.value;
    case "roles":
    case "operations":
      return hasAccess2AttachOperation.value;
    case "territories":
      return hasAccess2SaveTerritoryAccess.value;
    default:
      return false;
  }
});

// Methods
const onSearch = (value: string) => {
  searchValue.value = value || "";
};

const onOpenDialog = (type: AttachType) => {
  attachType.value = type;
  isDialogOpen.value = true;
};

const onCloseDialog = () => {
  isDialogOpen.value = false;
  attachType.value = undefined;
};

const refresh = async () => {
  await accessStore.refreshAttachedOperationsList();
  await accessStore.getUsers();
};

const onUnAttachSingle = async (item: AccessAttachedOperationsListModel) => {
  const data = [
    {
      user_id: accessStore.activeUserId,
      operation_id: item.operation.id,
    },
  ];

  await accessStore.onUnAttach(data);
};

const onUnAttachSelected = async () => {
  if (!accessStore.checkedOperations.length) {
    notify({ title: t("access.select_operations"), type: "error" });
    return;
  }

  try {
    isMultiUnAttachLoading.value = true;

    const data = accessStore.checkedOperations.map((operationId) => ({
      user_id: accessStore.activeUserId,
      operation_id: operationId,
    }));

    await accessStore.onUnAttach(data);
    notify({ title: t("toast.saved"), type: "success" });
    await refresh();
  } catch {
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isMultiUnAttachLoading.value = false;
  }
};
<\/script>

<style lang="scss" scoped>
:deep(.overflow-auto) {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #299b9b;
    border-radius: 3px;
  }
}
</style>
`;export{e as default};
