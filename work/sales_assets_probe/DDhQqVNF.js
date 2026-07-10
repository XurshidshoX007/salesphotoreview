const n=`<template>
  <div class="h-full">
    <access-drawer-layout ref="drawerRef">
      <template #sidebar>
        <access-branch-menu />
      </template>

      <template #content>
        <access-branch-filter v-if="branchStore.activeBranchId" />

        <card
          v-if="branchStore.activeBranchId"
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
                :loading="branchStore.isAttachedUsersLoading"
                @click="branchStore.getAttachedUsers"
              />
            </div>

            <div
              class="flex rounded-lg overflow-hidden cursor-pointer border font-normal text-sm"
            >
              <m-btn
                group="outlined"
                class="!border-l-none !border-t-none !border-b-none !border-r !rounded-[0px] last:!border-r-none !px-4 !bg-transparent hover:!bg-neutral-50"
                @click="isDialogOpen = true"
              >
                {{ t("access.users") }}
              </m-btn>
            </div>
          </template>

          <access-branch-table
            :search-value="searchValue"
            :un-attachching-item-id="unAttachchingItemId"
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
        <access-branch-attach-user-dialog
          :name="activeName"
          @close-dialog="isDialogOpen = false"
        />
      </div>
    </transition>

    <toolbar
      :is-open="!!branchStore.checkedUsers.length"
      class="text-white"
      @close="branchStore.checkedUsers = []"
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
            {{ branchStore.checkedUsers.length }}
          </span>
        </template>
        <template #total>
          <span class="font-bold">
            {{ branchStore.attachedUsers?.length || 0 }}
          </span>
        </template>
      </i18n-t>

      <access-unattach-button
        :loading="branchStore.isUnattachLoading"
        :class="
          cn(
            '!text-white !bg-orange-500 hover:!bg-orange-600 !border-orange-500',
            branchStore.isUnattachLoading && '[&_path]:fill-white',
          )
        "
        @click="onUnAttachSelected"
      />
    </toolbar>
  </div>
</template>

<script setup lang="ts">
import type { AccessBranchAttachedUserModel } from "~/interfaces/api/access/branch-model";
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { cn } from "~/utils/helpers";

// Store
const branchStore = useAccessBranchStore();

// Composables
const { t } = useI18n();

// Child-components
const drawerRef = ref<{ closeDrawer: () => void; isMobile: boolean }>();

// States
const searchValue = ref("");
const isDialogOpen = ref(false);
const unAttachchingItemId = ref<string | null>(null);

// Computed
const activeName = computed(
  () =>
    branchStore.branches.find((item) => item.id === branchStore.activeBranchId)
      ?.name,
);

// Hooks
watch(
  () => branchStore.activeBranchId,
  () => {
    if (drawerRef.value?.isMobile) drawerRef.value.closeDrawer();
  },
);

// Methods
const onSearch = (value: string) => {
  searchValue.value = value || "";
};

const refresh = async () => {
  await branchStore.refreshAttachedUsers();
  await branchStore.getBranches();
};

const onUnAttachSingle = async (item: AccessBranchAttachedUserModel) => {
  unAttachchingItemId.value = item.id;
  const res = await branchStore.unattachUsers([item.id]);

  if (res !== "error") {
    notify({ title: t("toast.success"), type: "success" });
    await refresh();
  } else {
    notify({ title: t("toast.error"), type: "error" });
  }
  unAttachchingItemId.value = null;
};

const onUnAttachSelected = async () => {
  if (!branchStore.checkedUsers.length) return;

  const res = await branchStore.unattachUsers(branchStore.checkedUsers);

  if (res !== "error") {
    await refresh();
    notify({ title: t("toast.success"), type: "success" });
    branchStore.checkedUsers = [];
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
`;export{n as default};
