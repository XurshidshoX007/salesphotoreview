const n=`<template>
  <div class="flex flex-col gap-2.5 w-full min-w-0">
    <div
      class="grid grid-cols-[minmax(0,1fr)_minmax(0,80px)_minmax(0,140px)] gap-2 font-medium p-2.5 text-neutral-600"
    >
      <div>{{ t("labels.name") }}</div>
      <div>{{ t("labels.quantity") }}</div>
      <div class="text-right">{{ t("column.sum") }}</div>
    </div>

    <template v-if="data.length">
      <card
        v-for="bonus in data"
        :key="bonus.id"
        v-model="expandedState[bonus.id]"
        expandable
        variant="secondary"
        size="none"
        :classes="{
          root: 'p-0.5 rounded-lg border-0 bg-neutral-50',
          header:
            '!px-2 !py-2 !gap-2 !mb-0 !justify-start !bg-transparent font-normal',
          content: 'bg-white rounded-lg text-neutral-600 px-2.5 !py-0',
        }"
      >
        <template #header>
          <div
            class="grid grid-cols-[minmax(0,1fr)_minmax(0,80px)_minmax(0,140px)] gap-2 w-full"
          >
            <div class="min-w-0 break-words">{{ bonus.name }}</div>
            <div>
              <span class="h-7 py-1 px-2 bg-white rounded-lg font-semibold">
                {{ bonus.qty }}
              </span>
            </div>
            <div class="text-right">
              <span class="h-7 py-1 px-2 bg-white rounded-lg font-semibold">
                {{ bonus.amount }} {{ baseCurrency }}
              </span>
            </div>
          </div>
        </template>

        <div
          v-for="child in bonus.children"
          :key="child.product.id"
          class="grid grid-cols-[minmax(0,1fr)_minmax(0,80px)_minmax(0,140px)] gap-2 py-2.5 items-center shadow-[inset_0_-1px_0_#E1E4EA] last:shadow-none"
        >
          <div class="min-w-0 break-words">
            {{ child.product.name }}
          </div>
          <div>
            <span class="h-7 py-1 px-2 bg-neutral-50 rounded-lg font-semibold">
              {{ child.count }}
            </span>
          </div>
          <div class="text-right">
            <span class="text-neutral-950 font-semibold">
              {{ getFormattedAmount(child.price) }} {{ baseCurrency }}
            </span>
            <br />
            <span class="text-sm">
              {{ getFormattedAmount(child.returned_count_as_payment) }}
              {{ baseCurrency }}
            </span>
          </div>
        </div>
      </card>
    </template>

    <div v-else class="p-2.5 bg-neutral-50 rounded-lg text-center">
      {{ t("filters.no_data") }}
    </div>

    <div
      class="grid grid-cols-[minmax(0,1fr)_minmax(0,80px)_minmax(0,140px)] gap-2 p-2.5"
    >
      <div>{{ t("labels.totals") }}</div>
      <div>
        <span
          class="h-7 py-1 px-2 bg-primary-600 text-white rounded-lg font-semibold"
        >
          {{ totals.qty }}
        </span>
      </div>
      <div class="text-right">
        <span
          class="h-7 py-1 px-2 bg-primary-600 text-white rounded-lg font-semibold"
        >
          {{ totals.amount }} {{ baseCurrency }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getFormattedAmount } from "#imports";
import { reactive } from "vue";
import { useI18n } from "vue-i18n";
import type { OrderDetailModel } from "~/interfaces/api/orders/order-detail-model";

// Types
type Props = {
  bonuses: OrderDetailModel["bonus_products"];
  baseCurrency?: string;
};

// Props
const props = defineProps<Props>();

// Composables
const { t } = useI18n();

// State (per-bonus expand; keyed when toggled via card v-model)
const expandedState = reactive<Record<string, boolean>>({});

// Computed
const data = computed(() => {
  return props.bonuses.map((bonus) => ({
    ...bonus.key,
    children: bonus.value,
    qty: bonus.value.reduce((acc, item) => acc + item.count, 0),
    amount: bonus.value.reduce((acc, item) => acc + item.price, 0),
  }));
});

const totals = computed(() => {
  return data.value.reduce(
    (acc, item) => {
      acc.qty += item.qty;
      acc.amount += item.amount;

      return acc;
    },
    {
      qty: 0,
      amount: 0,
    },
  );
});
<\/script>
`;export{n as default};
