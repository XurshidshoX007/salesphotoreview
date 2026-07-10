const n=`<template>
  <card :classes="{ root: 'p-4 pb-2.5' }" variant="outlined">
    <div class="flex gap-3 mb-2">
      <div class="w-[125px] h-[88px] shrink-0">
        <img
          v-if="client?.photo_url"
          :src="client.photo_url"
          alt="client-image"
          class="w-full h-full object-cover"
        />
        <flex-col
          v-else
          class="size-full rounded-lg bg-neutral-150 items-center justify-center gap-2.5 text-neutral-400"
        >
          <icon-image-no-exist class="text-2xl text-neutral-400" />
          <div class="text-sm">{{ t("photo_not_available") }}</div>
        </flex-col>
      </div>

      <div class="space-y-2.5 overflow-hidden min-w-0">
        <div class="font-medium truncate" :title="client?.name">
          {{ client?.name }}
        </div>
        <div class="text-sm truncate" :title="client?.company_name">
          {{ client?.company_name }}
        </div>
        <link-component
          :to="'/clients/about-clients/' + client?.id"
          :value="client?.visual_id ?? ''"
          non-copyable
          class="text-sm"
        />
      </div>
    </div>

    <flex-row
      v-for="(item, index) in clientInfoKeyValue"
      :key="item.key"
      :class="
        cn(
          'items-center justify-between text-sm',
          'box-content h-8 py-2 first:pt-0 last:pb-0',
          'shadow-[inset_0_-1px_0_#E1E4EA] last:shadow-none',
        )
      "
    >
      <div>{{ item.title }}</div>
      <div :class="cn('text-sm border rounded-lg px-2.5 py-[3px]', item.class)">
        {{ item.value || "-" }}
      </div>
    </flex-row>
  </card>
</template>

<script setup lang="ts">
import { cn } from "#imports";
import { useI18n } from "vue-i18n";
import type { OrderDetailClientModel } from "~/interfaces/api/orders/order-detail-model";

// Types
type Props = {
  client?: OrderDetailClientModel;
  baseCurrency?: string;
};

// Composables
const { t } = useI18n();

// Props
const { client, baseCurrency } = defineProps<Props>();

// Hooks
const clientInfoKeyValue = computed(() => {
  return [
    {
      key: "contact",
      title: t("column.contact_person"),
      value: client?.contact,
      class: "border-none",
    },
    {
      key: "territory",
      title: t("settings_sidebar.territory"),
      value: client?.territory?.name,
    },
    {
      key: "category",
      title: t("column.category"),
      value: client?.category?.name,
    },
    {
      key: "debt",
      title: t("reports.universal_sales_report.order_debt"),
      value: \`\${getFormattedAmount(client?.debt ?? 0)} \${baseCurrency ?? ""}\`,
      get class() {
        return (client?.debt ?? 0) > 0
          ? "text-primary-600"
          : (client?.debt ?? 0) < 0
            ? "text-red-550"
            : "";
      },
    },
    {
      key: "balance",
      title: t("column.balance"),
      value: \`\${getFormattedAmount(client?.balance?.amount ?? 0)} \${baseCurrency ?? ""}\`,
      get class() {
        return (client?.balance?.amount ?? 0) > 0
          ? "text-primary-600"
          : (client?.balance?.amount ?? 0) < 0
            ? "text-red-550"
            : "";
      },
    },
  ];
});
<\/script>
`;export{n as default};
