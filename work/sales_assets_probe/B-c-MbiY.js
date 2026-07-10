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
        <access-warehouse-menu-list :data="activeWarehouseMenu" />
      </template>

      <template #inactive>
        <access-warehouse-menu-list :data="inactiveWarehouseMenu" />
      </template>
    </multi-tab>
  </card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { AccessWarehouseModel } from "~/interfaces/api/access/warehouse-model";

// Store
const warehouseStore = useAccessWarehouseStore();

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
const activeWarehouseMenu = computed(() =>
  warehouseStore.warehouses
    ?.filter((item) => item.is_active)
    .map(toMenuItem) ?? [],
);

const inactiveWarehouseMenu = computed(() =>
  warehouseStore.warehouses
    ?.filter((item) => !item.is_active)
    .map(toMenuItem) ?? [],
);

// Methods
const toMenuItem = (item: AccessWarehouseModel) => ({
  ...item,
  id: item.id,
  name: item.name,
});
<\/script>
`;export{e as default};
