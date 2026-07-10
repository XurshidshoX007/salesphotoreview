const n=`<template>
  <card variant="outlined" :classes="{ root: 'text-sm p-4' }">
    <multi-tab
      variant="filled"
      :tabs="tabs"
      v-model="activeTab"
      :classes="{
        root: 'mb-4',
        contentWrapper: 'text-neutral-950 overflow-x-auto',
        tab: 'w-full justify-center',
      }"
    >
      <template #order_totals>
        <orders-details-totals-by-categories
          :categories="data?.product_categories || []"
          :base-currency="baseCurrency"
        />
      </template>
      <template #bonuses>
        <orders-details-totals-by-bonuses
          :bonuses="data?.bonus_products || []"
          :base-currency="baseCurrency"
        />
      </template>
    </multi-tab>
  </card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// Types
type Props = {
  data?: OrderDetailModel;
  baseCurrency?: string;
};

// Props
const props = defineProps<Props>();

// Composables
const { t } = useI18n();

// States
const activeTab = ref<"order_totals" | "bonuses">("order_totals");

const tabs: MultiTabProps["tabs"] = [
  {
    key: "order_totals",
    title: t("orders.order_summary"),
  },
  {
    key: "bonuses",
    title: t("settings.bonus"),
  },
];
<\/script>
`;export{n as default};
