const n=`<template>
  <card :classes="{ root: 'p-4 pb-2.5' }" variant="outlined">
    <flex-row
      v-for="item in items"
      :key="item.key"
      :class="
        cn(
          'items-center justify-between text-sm',
          'box-content h-8 py-2 first:pt-0 last:pb-0',
          'shadow-[inset_0_-1px_0_#E1E4EA] last:shadow-none',
          item.class,
        )
      "
    >
      <div>{{ item.title }}</div>
      <slot :name="item.key + '-content'" :item="item">
        <div class="text-sm border rounded-lg px-2.5 py-[3px]">
          {{ item.value || "-" }}
        </div>
      </slot>
    </flex-row>
  </card>
</template>

<script setup lang="ts">
import { cn } from "#imports";
import { useI18n } from "vue-i18n";

// Types
type InfoItem = {
  key: string;
  title: string;
  value: any;
  class?: string;
};

type Props = {
  data?: OrderRefundDetailModel;
};

// Props
const props = defineProps<Props>();

// Composables
const { t } = useI18n();

// Computed
const items = computed((): InfoItem[] => [
  {
    key: "visual_id",
    title: t("column.visual_id"),
    value: { id: props.data?.id, visual_id: props.data?.visual_id },
  },
  {
    key: "agent",
    title: t("users.agents.agent"),
    value: props.data?.agent,
  },
  {
    key: "order_date",
    title: t("column.order_date"),
    value: getFormattedDate(props.data?.order_date, "DD.MM.YYYY HH:mm"),
  },
  {
    key: "created_date",
    title: t("column.created_date"),
    value: getFormattedDate(props.data?.created_date, "DD.MM.YYYY HH:mm"),
  },
  {
    key: "shipped_date",
    title: t("column.shipped_date"),
    value: getFormattedDate(props.data?.shipped_date, "DD.MM.YYYY HH:mm"),
  },
  {
    key: "consignation_term",
    title: t("column.consignation_term_by_order"),
    value: getFormattedDate(props.data?.consignation_term, "DD.MM.YYYY HH:mm"),
  },
  {
    key: "warehouse",
    title: t("sidebar.warehouse"),
    value: props.data?.warehouse?.name,
  },
  {
    key: "price_type",
    title: t("settings_sidebar.price_type"),
    value: props.data?.price_type?.name,
  },
  {
    key: "trade_direction",
    title: t("settings_sidebar.trade_direction"),
    value: props.data?.trade_direction?.name,
  },
  {
    key: "for_consignation",
    title: t("orders.for_consignment"),
    value: props.data?.for_consignation,
  },
  {
    key: "debt",
    title: t("column.debt_by_order"),
    value: props.data?.debt ? getFormattedAmount(props.data.debt) : null,
  },
]);
<\/script>
`;export{n as default};
