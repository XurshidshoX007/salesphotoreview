const e=`<template>
  <card :classes="{ root: 'h-full px-0', content: 'h-full flex flex-col' }">
    <multi-tab
      :tabs="sideMenuTabs"
      v-model:active="sideMenuTab"
      :classes="{
        root: 'px-5',
        tab: 'w-full justify-center',
        body: 'flex-1 overflow-hidden',
        contentWrapper: 'pt-4 h-full',
      }"
    >
      <template #active>
        <access-payment-method-menu-list :data="activeBranchMenu" />
      </template>

      <template #inactive>
        <access-payment-method-menu-list :data="inactiveBranchMenu" />
      </template>
    </multi-tab>
  </card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { AccessPaymentMethodModel } from "~/interfaces/api/access/payment-method-model";

// Store
const paymentMethodStore = useAccessPaymentMethodStore();

// Composables
const { t } = useI18n();

// State
const sideMenuTab = ref("active");

// Variable
const sideMenuTabs: MultiTabProps["tabs"] = [
  { key: "active", title: t("access.active_tab") },
  { key: "inactive", title: t("access.inactive_tab") },
];

// Hooks
const activeBranchMenu = computed(
  () =>
    paymentMethodStore.paymentMethods
      ?.filter((item) => item.is_active)
      .map(toMenuItem) ?? [],
);

const inactiveBranchMenu = computed(
  () =>
    paymentMethodStore.paymentMethods
      ?.filter((item) => !item.is_active)
      .map(toMenuItem) ?? [],
);

// Methods
const toMenuItem = (item: AccessPaymentMethodModel) => ({
  ...item,
  id: item.id,
  name: item.name,
});
<\/script>
`;export{e as default};
