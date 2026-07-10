const n=`<template>
  <side-menu
    variant="tree"
    :data="menu"
    :open-items="openItems"
    @update:open-items="(value) => emit('update:openItems', value)"
  >
    <template #level-1="{ item, hasChildren }">
      <div v-if="item.renderType === 'simpleLabel'" class="leading-6">
        {{ item.name }}
      </div>
      <div v-else class="relative flex items-center rounded-lg gap-1 p-1 h-10">
        <icon-dot v-if="!hasChildren" size="16" class="shrink-0" />
        <span class="truncate" :title="item.name">{{ item.name }}</span>
      </div>
    </template>
  </side-menu>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ClientDuplicationMenuItemType } from "~/interfaces/api/clients/clients-duplication-model";

type Props = {
  balanceChildrenHeaders: ClientDuplicationMenuItemType[];
  teamsChildrenHeaders: ClientDuplicationMenuItemType[][];
  openItems?: Record<string, boolean>;
};

type Emits = {
  (e: "update:openItems", value: Record<string, boolean>): void;
};

// Props
const props = defineProps<Props>();

// Emits
const emit = defineEmits<Emits>();

// Composables
const { t } = useI18n();

// Hooks
const menu = computed<ClientDuplicationMenuItemType[]>(() => [
  {
    id: "balance",
    name: t("column.balance"),
    children: [props.balanceChildrenHeaders],
  },
  { id: "name", name: t("column.name") },
  { id: "company_name", name: t("column.legal_name") },
  { id: "phone", name: t("column.phone") },
  { id: "is_active", name: t("column.status") },
  { id: "inn", name: t("column.inn") },
  { id: "jshshir", name: t("column.pinfl") },
  { id: "category", name: t("column.category") },
  { id: "address", name: t("column.address") },
  { id: "territory", name: t("settings_sidebar.territory") },
  { id: "navigate", name: t("column.navigate") },
  {
    id: "bank_details",
    name: t("clients.duplication.bank_details"),
    children: [
      [
        { id: "number_of_contract", name: t("column.number_of_contract") },
        { id: "account", name: t("clients.account") },
        { id: "bank", name: t("column.bank") },
        { id: "mfo", name: t("column.mfo") },
        { id: "oked", name: t("column.oked") },
        { id: "code_nds", name: t("column.registration_code") },
      ],
    ],
  },
  {
    id: "additional_info",
    name: t("clients.duplication.additional_info"),
    children: [
      [
        { id: "client_type", name: t("column.type") },
        { id: "sales_channel", name: t("settings_sidebar.sales_channel") },
        { id: "client_format", name: t("settings.client_format") },
        { id: "contact", name: t("column.contact_person") },
      ],
    ],
  },
  {
    id: "statistics",
    name: t("clients.statistics"),
    children: [
      [
        { id: "order_count", name: t("clients.duplication.order_count") },
        {
          id: "not_completed_orders",
          name: t("clients.duplication.uncompleted_order_count"),
        },
        { id: "reject_count", name: t("clients.duplication.refusal_count") },
        { id: "bonus_count", name: t("column.bonus") },
        { id: "client_device_count", name: t("labels.equipment") },
      ],
    ],
  },
  { id: "code", name: t("column.code") },
  { id: "last_modified_date", name: t("column.last_modified_date") },
  {
    id: "teams",
    name: t("clients.duplication.teams"),
    children: props.teamsChildrenHeaders,
  },
]);
<\/script>
`;export{n as default};
