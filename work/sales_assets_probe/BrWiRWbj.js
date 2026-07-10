const e=`<template>
  <div class="h-full">
    <access-drawer-layout ref="drawerRef">
      <template #sidebar>
        <access-payment-method-menu />
      </template>

      <template #content>
        <card
          v-if="paymentMethodStore.activePaymentMethodId"
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
                :loading="paymentMethodStore.isAllowedUsersLoading"
                @click="paymentMethodStore.getAllowedUsers"
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

          <access-payment-method-table
            :search-value="searchValue"
            :on-restrict="onRestrictSingle"
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
        <access-payment-method-attach-user-dialog
          :name="activeName"
          @close-dialog="isDialogOpen = false"
        />
      </div>
    </transition>

    <toolbar
      :is-open="!!paymentMethodStore.checkedUsers.length"
      class="text-white"
      @close="paymentMethodStore.checkedUsers = []"
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
            {{ paymentMethodStore.checkedUsers.length }}
          </span>
        </template>
        <template #total>
          <span class="font-bold">
            {{ paymentMethodStore.allowedUsers?.length || 0 }}
          </span>
        </template>
      </i18n-t>

      <access-unattach-button
        :loading="isMultiRestrictLoading"
        :class="
          cn(
            '!text-white !bg-orange-500 hover:!bg-orange-600 !border-orange-500',
            isMultiRestrictLoading && '[&_path]:fill-white',
          )
        "
        @click="onRestrictMultiple"
      />
    </toolbar>
  </div>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { cn } from "tailwind-variants";

// Store
const paymentMethodStore = useAccessPaymentMethodStore();

// Composable
const { t } = useI18n();

// Child-components
const drawerRef = ref<{ closeDrawer: () => void; isMobile: boolean }>();

// States
const searchValue = ref<string>("");
const isDialogOpen = ref<boolean>(false);
const isMultiRestrictLoading = ref<boolean>(false);

// Computed
const activeName = computed(
  () =>
    paymentMethodStore.paymentMethods.find(
      (item) => item.id === paymentMethodStore.activePaymentMethodId,
    )?.name || "",
);

// Hook
watch(
  () => paymentMethodStore.activePaymentMethodId,
  () => {
    if (drawerRef.value?.isMobile) drawerRef.value.closeDrawer();
  },
);

// Methods
const onSearch = (value: string) => {
  searchValue.value = value || "";
};

const refresh = async () => {
  await paymentMethodStore.refreshAllowedUsers();
  await paymentMethodStore.getPaymentMethods();
};

const onRestrictSingle = async (itemId: string) => {
  await paymentMethodStore.restrictPaymentMethods({
    user_id_arr: [itemId],
    currency_id: paymentMethodStore.activePaymentMethodId!,
  });
};

const onRestrictMultiple = async () => {
  if (!paymentMethodStore.checkedUsers.length) return;

  try {
    isMultiRestrictLoading.value = true;
    await paymentMethodStore.restrictPaymentMethods({
      user_id_arr: paymentMethodStore.checkedUsers,
      currency_id: paymentMethodStore.activePaymentMethodId!,
    });
    await refresh();
    notify({ title: t("toast.success"), type: "success" });
    paymentMethodStore.checkedUsers = [];
  } catch {
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isMultiRestrictLoading.value = false;
  }
};
<\/script>
`;export{e as default};
