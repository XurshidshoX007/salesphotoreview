const e=`<template>
  <div class="h-full">
    <access-drawer-layout ref="drawerRef">
      <template #sidebar>
        <access-operations-menu />
      </template>

      <template #content>
        <access-operations-filter v-if="accessStore.activeOperationId" />

        <card
          v-if="accessStore.activeOperationId"
          :classes="{
            root: 'flex flex-col h-fit max-h-full',
            header: 'justify-between flex-wrap gap-3 mb-5 flex-shrink-0',
            content: 'overflow-auto border-t',
          }"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <search-input :value="searchValue" @change="onSearch" />

              <refresh-btn
                :loading="accessStore.isLoading"
                @click="accessStore.getAttachedUsersList()"
              />
            </div>

            <div class="flex items-center gap-3">
              <m-btn
                v-if="isAdmin"
                group="outlined"
                class="border !px-4 !bg-transparent hover:!bg-neutral-50 !border-neutral-200 !gap-2"
                @click="openAccessOperationDialog"
              >
                <icon-settings-alt :size="20" />
                {{ t("sidebar.settings") }}
              </m-btn>
              <div
                v-if="hasAccess2GetGroupedOperationList"
                class="flex rounded-lg overflow-hidden cursor-pointer border font-normal text-sm border-neutral-200"
              >
                <m-btn
                  group="outlined"
                  :disabled="!accessStore.activeOperationCanGrantAccess"
                  class="!border-l-none !border-t-none !border-b-none !border-r !rounded-[0px] last:!border-r-none !px-4 !bg-transparent hover:!bg-neutral-50"
                  @click="onOpenDialog('users')"
                >
                  {{ t("access.users") }}
                </m-btn>
              </div>
            </div>
          </template>

          <access-operations-table
            :search-value="searchValue"
            @unattach="onUnAttachSingle"
          />
        </card>

        <div v-else class="h-full grid place-items-center">
          <no-infarmation :title="t('access.no_information_found')" />
        </div>
      </template>
    </access-drawer-layout>

    <transition name="modal">
      <div v-if="isDialogOpen">
        <access-operations-attach-user-dialog
          :name="activeName"
          :can-save="hasAccess2AttachOperation"
          @close-dialog="onCloseDialog"
        />
      </div>
    </transition>

    <transition name="modal">
      <div v-if="isAccessOperationDialogOpen">
        <access-operations-settings-dialog
          :id="accessStore.activeOperationId!"
          @closeDialog="closeAccessOperationDialog"
        />
      </div>
    </transition>

    <toolbar
      :is-open="!!accessStore.checkedUsers.length"
      class="text-white"
      @close="accessStore.checkedUsers = []"
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
            {{ accessStore.checkedUsers.length }}
          </span>
        </template>
        <template #total>
          <span class="font-bold">
            {{ accessStore.attachedUsersList?.length || 0 }}
          </span>
        </template>
      </i18n-t>

      <access-unattach-button
        v-if="hasAccess2UnattachOperation"
        :loading="accessStore.isOperationUnAttachLoading"
        :class="
          cn(
            '!text-white !bg-orange-500 hover:!bg-orange-600 !border-orange-500',
            accessStore.isOperationUnAttachLoading && '[&_path]:fill-white',
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
import type { AccessAttachedUsersListModel } from "~/interfaces/api/access/attached-list-model";
import { cn } from "~/utils/helpers";

// Store
const accessStore = useAccessOperationsStore();

// Composables
const { t } = useI18n();
const { isAdmin } = useAccessesService();
const {
  hasAccess2UnattachOperation,
  hasAccess2GetGroupedOperationList,
  hasAccess2AttachOperation,
} = useAccessAccess();

// Child-components
const drawerRef = ref<{ closeDrawer: () => void; isMobile: boolean }>();

// State
const searchValue = ref("");
const isDialogOpen = ref(false);
const isAccessOperationDialogOpen = ref(false);

// Hooks
watch(
  () => accessStore.activeOperationId,
  () => {
    if (drawerRef.value?.isMobile) drawerRef.value.closeDrawer();
  },
);

const activeName = computed(() => accessStore.activeOperationName);

// Methods
const onSearch = (value: string) => {
  searchValue.value = value || "";
};

const onOpenDialog = (_type: string) => {
  isDialogOpen.value = true;
};

const onCloseDialog = () => {
  isDialogOpen.value = false;
};

const openAccessOperationDialog = () => {
  isAccessOperationDialogOpen.value = true;
};

const closeAccessOperationDialog = () => {
  isAccessOperationDialogOpen.value = false;
};

const refresh = async () => {
  await accessStore.refreshAttachedUsersList();
  await accessStore.getOperations();
};

const onUnAttachSingle = async (item: AccessAttachedUsersListModel) => {
  const data = [
    {
      user_id: item.id,
      operation_id: accessStore.activeOperationId as number,
    },
  ];

  const res = await accessStore.onUnAttach(data);
  if (res !== "error") {
    notify({ title: t("toast.saved"), type: "success" });
    await refresh();
  } else {
    notify({ title: t("toast.error"), type: "error" });
  }
};

const onUnAttachSelected = async () => {
  if (!accessStore.checkedUsers.length) {
    notify({ title: t("access.select_users"), type: "error" });
    return;
  }

  const data = accessStore.checkedUsers.map((userId) => ({
    user_id: userId,
    operation_id: accessStore.activeOperationId as number,
  }));

  const res = await accessStore.onUnAttach(data);
  if (res !== "error") {
    notify({ title: t("toast.saved"), type: "success" });
    await refresh();
  } else {
    notify({ title: t("toast.error"), type: "error" });
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
