const e=`<template>
  <div class="h-full">
    <access-drawer-layout ref="drawerRef">
      <template #sidebar>
        <access-warehouse-menu />
      </template>

      <template #content>
        <access-warehouse-filter v-if="warehouseStore.activeWarehouseId" />

        <card
          v-if="warehouseStore.activeWarehouseId"
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
                :loading="warehouseStore.isAttachedUsersLoading"
                @click="warehouseStore.getAttachedUsers()"
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

          <access-warehouse-table
            :search-value="searchValue"
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
      <div v-if="isDialogOpen">
        <access-warehouse-attach-user-dialog
          :name="activeName"
          @close-dialog="isDialogOpen = false"
        />
      </div>
    </transition>

    <toolbar
      :is-open="!!warehouseStore.checkedUsers.length"
      class="text-white"
      @close="warehouseStore.checkedUsers = []"
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
            {{ warehouseStore.checkedUsers.length }}
          </span>
        </template>
        <template #total>
          <span class="font-bold">
            {{ warehouseStore.attachedUsers?.length || 0 }}
          </span>
        </template>
      </i18n-t>

      <access-unattach-button
        :loading="isMultiUnattachLoading"
        :class="
          cn(
            '!text-white !bg-orange-500 hover:!bg-orange-600 !border-orange-500',
            isMultiUnattachLoading && '[&_path]:fill-white',
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
import type { AccessWarehouseAttachedUserModel } from "~/interfaces/api/access/warehouse-model";
import { cn } from "~/utils/helpers";

// Store
const warehouseStore = useAccessWarehouseStore();

// Composables
const { t } = useI18n();

// Child-components
const drawerRef = ref<{ closeDrawer: () => void; isMobile: boolean }>();

// State
const searchValue = ref("");
const isDialogOpen = ref(false);
const isMultiUnattachLoading = ref(false);

// Computed
const activeName = computed(
  () =>
    warehouseStore.warehouses.find(
      (item) => item.id === warehouseStore.activeWarehouseId,
    )?.name,
);

// Hooks
watch(
  () => warehouseStore.activeWarehouseId,
  () => {
    if (drawerRef.value?.isMobile) drawerRef.value.closeDrawer();
  },
);

// Methods
const onSearch = (value: string) => {
  searchValue.value = value || "";
};

const refresh = async () => {
  await warehouseStore.refreshAttachedUsers();
  await warehouseStore.getWarehouses();
};

const onUnAttachSingle = async (item: AccessWarehouseAttachedUserModel) => {
  await warehouseStore.unattachUsers({
    warehouse_id: warehouseStore.activeWarehouseId!,
    user_id_arr: [item.id],
  });
};

const onUnAttachSelected = async () => {
  if (!warehouseStore.checkedUsers.length) return;

  try {
    isMultiUnattachLoading.value = true;

    await warehouseStore.unattachUsers({
      warehouse_id: warehouseStore.activeWarehouseId!,
      user_id_arr: warehouseStore.checkedUsers,
    });

    notify({ title: t("toast.success"), type: "success" });
    await refresh();
  } catch {
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isMultiUnattachLoading.value = false;
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
