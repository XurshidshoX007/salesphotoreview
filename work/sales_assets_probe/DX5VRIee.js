const e=`<template>
  <section class="space-y-4 min-w-0">
    <div
      class="grid grid-cols-1 gap-4 md:grid-cols-[2fr_3fr] min-w-0 items-stretch"
    >
      <card
        variant="default"
        :classes="{
          root: 'flex flex-col min-w-0 min-h-0',
          header: 'text-black text-base font-semibold lg:text-lg mb-5',
          content: 'flex flex-col gap-4 flex-1 min-w-0',
        }"
      >
        <template #header>{{ t("orders.total_amount_orders") }}</template>

        <div class="flex flex-col gap-4 min-w-0 flex-1">
          <div class="flex flex-col items-center gap-3 min-w-0">
            <div
              class="flex items-center justify-center bg-primary-400 p-1 rounded-[12.5px] shrink-0"
            >
              <div
                class="flex items-center justify-center bg-primary-250 rounded-[12.5px] p-2.5"
              >
                <icon-cash1 class="w-[32px] h-[32px]" />
              </div>
            </div>
            <p
              class="text-center text-base font-semibold text-neutral-900 leading-tight sm:text-lg lg:text-xl xl:text-2xl min-w-0"
            >
              {{ getFormattedAmount(totalAmount) }}
              <span class="text-neutral-400 text-sm ml-0.5">{{
                totalCurrency
              }}</span>
            </p>
          </div>

          <div
            v-if="paymentItems.length"
            class="flex flex-col gap-2 min-w-0 w-full px-0.5"
          >
            <div
              class="flex w-full min-w-0 gap-0.5 items-stretch"
              style="height: 10px"
            >
              <template v-for="item in paymentItems" :key="item.id">
                <div
                  class="h-full flex-shrink-0 cursor-default rounded-sm first:rounded-l-sm last:rounded-r-sm transition-colors min-w-[10px]"
                  :style="{
                    flex: item.displayPercent + ' 1 10px',
                    backgroundColor: item.color,
                  }"
                  v-tooltip="{
                    text: tooltipText(item),
                    placement: 'top',
                    disabled: item.percent > 10,
                  }"
                />
              </template>
            </div>
            <div
              class="flex w-full min-w-0 gap-0.5 text-xs font-semibold text-neutral-900"
            >
              <template v-for="item in paymentItems" :key="item.id">
                <span
                  class="flex-shrink-0 truncate text-center min-w-[10px]"
                  :style="{ flex: item.displayPercent + ' 1 10px' }"
                >
                  {{ item.percent > 10 ? item.percent + "%" : "" }}
                </span>
              </template>
            </div>
          </div>
        </div>
      </card>

      <card
        variant="default"
        :classes="{
          root: 'flex flex-col  min-w-0 min-h-0',
          header: 'text-black text-base font-semibold lg:text-lg mb-5',
        }"
      >
        <template #header>{{
          t("dashboard.payments_by_methods", "По способам оплаты")
        }}</template>
        <div
          v-if="paymentItems.length"
          class="payment-methods-grid grid grid-cols-2 2xl:grid-cols-2 min-[1920px]:grid-cols-3 gap-3 min-w-0 max-h-[11rem] overflow-y-auto pr-3"
        >
          <div
            v-for="item in paymentItems"
            :key="item.id"
            class="rounded-xl border border-neutral-100 px-3 py-2.5 flex flex-col min-[1920px]:items-center gap-0.5 min-w-0 overflow-visible sm:px-4 sm:py-3"
          >
            <div
              class="text-base 2xl:text-xl font-semibold text-center"
              :style="{ color: item.color }"
            >
              {{ getFormattedAmount(item.amount) }}
              <span class="text-[10px] text-neutral-500 sm:text-xs">{{
                item.base_currency_code
              }}</span>
            </div>
            <div class="flex items-center gap-1.5 min-w-0 overflow-visible">
              <span
                class="w-2 h-2 rounded-full shrink-0"
                :style="{ backgroundColor: item.color }"
              />
              <span class="text-xs font-semibold break-all sm:text-sm">{{
                item.name
              }}</span>
            </div>
          </div>
        </div>
        <div
          v-else
          class="relative isolate min-h-[11rem] rounded-xl overflow-hidden flex flex-col items-center justify-center"
        >
          <div
            class="absolute left-0 right-0 bottom-0 z-[1] pointer-events-none overflow-hidden"
            style="top: -5rem; height: calc(100% + 5rem)"
            aria-hidden
          >
            <div
              class="absolute inset-0 grid grid-cols-2 2xl:grid-cols-2 min-[1920px]:grid-cols-3 gap-3 p-3 pr-3 items-center justify-items-center scale-110"
              style="filter: blur(14px); -webkit-filter: blur(14px)"
            >
              <div
                v-for="(c, i) in noDataTextColors"
                :key="i"
                class="flex flex-col items-center justify-center w-full"
              >
                <span
                  class="text-3xl font-semibold tabular-nums"
                  :style="{ color: c, opacity: 0.7 }"
                  >0</span
                >
              </div>
            </div>
          </div>
          <div
            class="relative z-10 flex flex-col items-center justify-center gap-3"
          >
            <icon-cash1
              class="w-10 h-10 text-neutral-400"
              color="currentColor"
            />
            <p class="text-sm font-medium text-neutral-900">
              {{ t("filters.no_data") }}
            </p>
          </div>
        </div>
      </card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";
import type {
  OrderItemModel,
  OrderModel,
} from "~/interfaces/api/dashboard/sales/order-model";
import { getHexByTWColor } from "~/utils/helpers";

// Composables
const { t } = useI18n();

// Stores
const dashboardStore = useSalesDashboardStore();

const noDataTextColors = [
  getHexByTWColor("bg-green-500"),
  getHexByTWColor("bg-bluer"),
  getHexByTWColor("bg-red-550"),
  getHexByTWColor("bg-orange-500"),
  getHexByTWColor("bg-primary-600"),
  getHexByTWColor("bg-purple-500"),
];

// Constants
const MIN_SEGMENT_PERCENT = 2;

// Hooks
const orderTotals = computed(
  () => dashboardStore.orderData as OrderModel | undefined,
);

const totalAmount = computed(() => orderTotals.value?.total?.amount || 0);
const totalCurrency = computed(
  () => orderTotals.value?.total?.base_currency_code || "",
);

const paymentItems = computed<
  (OrderItemModel & {
    percent: number;
    displayPercent: number;
    color: string;
  })[]
>(() => {
  const data = orderTotals.value;
  if (!data?.items?.length) return [];

  const total =
    data.total?.amount || data.items.reduce((s, i) => s + (i.amount || 0), 0);
  if (!total) return [];

  const itemsWithPercent = data.items.map((item) => {
    const percent = (item.amount / total) * 100;
    return {
      ...item,
      percent: Number(percent.toFixed(2)),
      effectivePercent: Math.max(percent, MIN_SEGMENT_PERCENT),
      color: item.hex_color ?? getHexByTWColor("bg-neutral-500"),
    };
  });

  const totalEffective = itemsWithPercent.reduce(
    (s, i) => s + i.effectivePercent,
    0,
  );

  return itemsWithPercent.map((item) => ({
    ...item,
    displayPercent: (item.effectivePercent * 100) / totalEffective,
  }));
});

const tooltipText = (
  item: OrderItemModel & { percent: number; color: string },
): string => {
  const value =
    item.percent < 0.01 && item.percent > 0
      ? "< 0.01"
      : Number(item.percent.toFixed(2));
  return \`\${item.name}: \${value}%\`;
};
<\/script>

<style scoped>
.payment-methods-grid::-webkit-scrollbar {
  width: 6px;
  border-radius: 8px;
}

.payment-methods-grid::-webkit-scrollbar-track {
  background: #e1e4e4;
  border-radius: 8px;
}

.payment-methods-grid::-webkit-scrollbar-thumb {
  background: #299b9b;
  border-radius: 8px;
}

.payment-methods-grid::-webkit-scrollbar-thumb:hover {
  background: #299b9b;
}

.payment-methods-grid {
  scrollbar-width: thin;
  scrollbar-color: #299b9b #e1e4e4;
}
</style>
`;export{e as default};
