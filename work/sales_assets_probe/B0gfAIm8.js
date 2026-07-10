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
        <access-users-menu-list :data="activeUserMenu" />
      </template>

      <template #inactive>
        <access-users-menu-list :data="inactiveUserMenu" />
      </template>
    </multi-tab>
  </card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// Composables
const { t } = useI18n();

// Store
const accessStore = useAccessUsersStore();

// State
const sideMenuTab = ref("active");

// Variable
const sideMenuTabs: MultiTabProps["tabs"] = [
  { key: "active", title: t("access.active_tab") },
  { key: "inactive", title: t("access.inactive_tab") },
];

// Hooks
const activeUserMenu = computed(
  () =>
    accessStore.users?.filter((item) => item.is_active).map(toMenuItem) ?? [],
);

const inactiveUserMenu = computed(
  () =>
    accessStore.users?.filter((item) => !item.is_active).map(toMenuItem) ?? [],
);

// Methods
const toMenuItem = (item: AccessUsersModel) => ({
  ...item,
  id: item.user.id,
  name: item.user.name,
});
<\/script>
`;export{e as default};
