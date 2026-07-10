const n=`<template>
  <side-menu variant="tree" :data="menu" :open-items="props.openItems">
    <template #default="{ item, hasChildren }">
      <!-- BALANCE (Tag with formatted amount) -->
      <div
        v-if="item.renderType === 'balance'"
        class="h-10 flex items-center justify-end"
      >
        <tag
          variant="outlined"
          class="font-medium text-lg h-8"
          :color="
            props.mergeInfo?.is_balance_zero === false ? 'danger' : 'primary'
          "
        >
          {{ getFormattedBalance(props.client.balance?.balance || 0) }}
        </tag>
      </div>

      <!-- TEAMS HEADER (badge circles) -->
      <div
        v-else-if="item.renderType === 'teams'"
        class="h-10 flex items-center bg-[#EFF6F6] px-3 rounded-lg"
      >
        <div
          v-for="(team, index) in props.client.teams"
          :key="index"
          class="bg-primary-600 text-white size-7 border-2 border-white rounded-full font-extrabold flex items-center justify-center leading-none"
          :style="{ marginLeft: index === 0 ? '0' : '-8px' }"
        >
          {{ team.ordinal_number }}
        </div>
      </div>

      <!-- BALANCE DETAIL -->
      <div
        v-else-if="item.renderType === 'balanceDetail'"
        class="h-6 text-right"
      >
        {{
          item.balanceItem ? getFormattedBalance(item.balanceItem.balance) : " "
        }}
      </div>

      <!-- MERGE DETAILS (statistics, code, date) -->
      <clients-duplication-merge-details
        v-else-if="item.renderType === 'mergeDetails' && !!item.fieldKey"
        :data="props.client"
        :field-key="item.fieldKey"
      />

      <!-- TEAM MEMBER -->
      <div
        v-else-if="item.renderType === 'teamMember'"
        class="flex items-center justify-between gap-1 h-6 px-3"
      >
        <span class="truncate">{{ item.teamValue }}</span>
        <component :is="item.teamIcon" class="shrink-0 text-primary-600" />
      </div>

      <!-- SIMPLE LABEL (balance/teams children in Menu) -->
      <div v-else-if="item.renderType === 'simpleLabel'" class="leading-6">
        {{ item.name }}
      </div>

      <!-- GROUP (fallback for items with children) -->
      <div
        v-else-if="hasChildren"
        class="flex items-center justify-between h-10 bg-[#EFF6F6] px-3 rounded-lg"
      >
        <span>{{ item.name }}</span>
        <component
          v-if="item.icon"
          :is="item.icon"
          class="text-primary-600 shrink-0"
        />
      </div>

      <!-- FIELD (fallback for leaves) -->
      <clients-duplication-field
        v-else
        :field-key="item.id as keyof ClientDuplicationsModel"
        :label="item.name"
        :data="props.client"
        :differences-between-main-and-others="
          props.differencesBetweenMainAndOthers
        "
        :differences-between-main-and-original="
          props.differencesBetweenMainAndOriginal
        "
        :read-only="props.readOnly"
        :with-label="props.withLabel"
        @update:difference="onUpdateDifference"
        @reset:difference="onReset"
      />
    </template>
  </side-menu>
</template>

<script setup lang="ts">
import {
  ClientsDuplicationMergeDetails,
  IconCheckList,
  IconGroup,
  IconPerson,
  IconPersonalCard,
  IconStatistics,
  IconVehicle,
  Tag,
} from "#components";
import { useI18n } from "vue-i18n";
import type {
  ClientDuplicationMenuItemType,
  ClientDuplicationMergeInfoType,
  ClientDuplicationsModel,
} from "~/interfaces/api/clients/clients-duplication-model";

type MenuItem = ClientDuplicationMenuItemType;

type Props = {
  client: ClientDuplicationsModel;
  mergeInfo?: ClientDuplicationMergeInfoType;
  openItems?: Record<string, boolean>;
  readOnly?: boolean;
  withLabel?: boolean;
  hiddenItems?: string[];
  differencesBetweenMainAndOthers?: Record<string, Record<string, boolean>>;
  differencesBetweenMainAndOriginal?: Record<string, boolean>;
};

type Emits = {
  (
    e: "update:difference",
    fieldKey: keyof ClientDuplicationsModel,
    value: ClientDuplicationsModel[keyof ClientDuplicationsModel],
  ): void;
  (e: "reset:difference", fieldKey: keyof ClientDuplicationsModel): void;
};

// Props
const props = defineProps<Props>();

// Emits
const emit = defineEmits<Emits>();

// Composables
const { t } = useI18n();

// Hooks
const menu = computed((): MenuItem[] => {
  const _menu: MenuItem[] = [
    {
      id: "balance",
      name: t("column.balance"),
      renderType: "balance",
      children: [
        props.client.balance?.details?.map(
          (item, index): MenuItem => ({
            id: \`balance_detail_\${index}\`,
            name: "",
            renderType: "balanceDetail",
            balanceItem: item,
          }),
        ) || [],
      ],
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
      icon: IconPersonalCard,
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
      icon: IconCheckList,
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
      icon: IconStatistics,
      children: [
        [
          {
            id: "order_count",
            name: t("clients.duplication.order_count"),
            renderType: "mergeDetails",
            fieldKey: "order_count",
          },
          {
            id: "not_completed_orders",
            name: t("clients.duplication.uncompleted_order_count"),
            renderType: "mergeDetails",
            fieldKey: "not_completed_orders",
          },
          {
            id: "reject_count",
            name: t("clients.duplication.refusal_count"),
            renderType: "mergeDetails",
            fieldKey: "reject_count",
          },
          {
            id: "bonus_count",
            name: t("column.bonus"),
            renderType: "mergeDetails",
            fieldKey: "bonus_count",
          },
          {
            id: "client_device_count",
            name: t("labels.equipment"),
            renderType: "mergeDetails",
            fieldKey: "client_device_count",
          },
        ],
      ],
    },
    {
      id: "code",
      name: t("column.code"),
      renderType: "mergeDetails",
      fieldKey: "code",
    },
    {
      id: "last_modified_date",
      name: t("column.last_modified_date"),
      renderType: "mergeDetails",
      fieldKey: "last_modified_date",
    },
    {
      id: "teams",
      name: t("clients.duplication.teams"),
      renderType: "teams",
      children: props.client.teams.map((team): MenuItem[] => [
        {
          id: "ordinal_number",
          name: "",
          renderType: "teamMember",
          teamValue: String(team.ordinal_number),
          teamIcon: IconGroup,
        },
        {
          id: "agent",
          name: "",
          renderType: "teamMember",
          teamValue: team.agent?.name,
          teamIcon: IconPerson,
        },
        {
          id: "expeditor",
          name: "",
          renderType: "teamMember",
          teamValue: team.expeditor?.name,
          teamIcon: IconVehicle,
        },
      ]),
    },
  ];

  return _menu.filter(
    (item) => !props.hiddenItems?.includes(item.id as string),
  );
});

// Methods
const getFormattedBalance = (balance: number) => {
  return [
    getFormattedAmount(balance),
    props.client.balance?.base_currency_code,
  ].join(" ");
};

const onUpdateDifference = (
  fieldKey: keyof ClientDuplicationsModel,
  value: ClientDuplicationsModel[keyof ClientDuplicationsModel],
) => {
  emit("update:difference", fieldKey, value);
};

const onReset = (fieldKey: keyof ClientDuplicationsModel) => {
  emit("reset:difference", fieldKey);
};
<\/script>

<style scoped>
:deep([data-id="balance"] [data-slot="group-wrapper"])::before,
:deep([data-id="balance"] [data-slot="item-wrapper"])::before {
  content: none !important;
}
</style>
`;export{n as default};
