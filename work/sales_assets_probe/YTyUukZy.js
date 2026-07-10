const n=`<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_2fr_1fr] min-w-0">
    <card
      variant="outlined"
      :classes="{
        root: 'min-w-0 border-neutral-100 flex flex-col gap-4 sm:gap-5',
        header:
          'text-center text-lg sm:text-xl font-medium text-neutral-900 min-w-0',
        content: 'flex flex-col items-center gap-3',
      }"
    >
      <template #header>{{
        t("cash.cash_flow.beginning_period_balances")
      }}</template>
      <div
        class="flex items-center justify-center bg-primary-400 p-1 rounded-xl shrink-0"
      >
        <div
          class="flex items-center justify-center bg-primary-250 rounded-xl p-2.5"
        >
          <icon-cash1 :size="32" :color="'white'" />
        </div>
      </div>
      <p
        class="text-center text-base font-semibold text-neutral-900 leading-tight sm:text-[26px] mb-0"
      >
        {{ getFormattedAmount(beginningTotal) }}
        <span class="text-neutral-400 ml-0.5">{{ currencyLabel }}</span>
      </p>
    </card>

    <div class="flex flex-col gap-4 min-w-0">
      <card
        variant="outlined"
        :classes="{
          root: 'min-w-0 border-neutral-100 flex-1',
          header:
            'flex items-center justify-between text-neutral-900 min-w-0 gap-4',
          content: 'hidden',
        }"
      >
        <template #header>
          <div class="flex flex-col min-w-0">
            <span class="text-lg sm:text-xl font-medium">{{
              t("cash.other_cash_receipts")
            }}</span>
            <p
              class="text-base font-semibold leading-tight sm:text-[26px] text-green-500 mb-0"
            >
              {{ getFormattedAmount(incomeTotal) }}
              <span class="text-inherit ml-0.5">{{ currencyLabel }}</span>
            </p>
          </div>
          <span class="text-green-500">
            <icon-cash-flow-income :size="60" />
          </span>
        </template>
      </card>
      <card
        variant="outlined"
        :classes="{
          root: 'min-w-0 border-neutral-100 flex-1',
          header:
            'flex items-center justify-between  text-neutral-900 min-w-0 gap-4',
          content: 'hidden',
        }"
      >
        <template #header>
          <span class="text-red-500">
            <icon-cash-flow-expense :size="60" />
          </span>
          <div class="flex flex-col min-w-0 text-end">
            <span class="text-lg sm:text-xl font-medium">{{
              t("cash.expenses")
            }}</span>
            <p
              class="text-base font-semibold leading-tight sm:text-[26px] text-red-500 mb-0"
            >
              {{ getFormattedAmount(expenseTotal) }}
              <span class="text-inherit ml-0.5">{{ currencyLabel }}</span>
            </p>
          </div>
        </template>
      </card>
    </div>

    <card
      variant="outlined"
      :classes="{
        root: 'min-w-0 border-neutral-100 flex flex-col gap-4 sm:gap-5',
        header:
          'text-center text-lg sm:text-xl font-medium text-neutral-900 min-w-0',
        content: 'flex flex-col items-center gap-3',
      }"
    >
      <template #header>{{ t("cash.cash_flow.end_period_balances") }}</template>
      <div
        class="flex items-center justify-center bg-primary-400 p-1 rounded-xl shrink-0"
      >
        <div
          class="flex items-center justify-center bg-primary-250 rounded-xl p-2.5"
        >
          <icon-cash1 :size="32" :color="'white'" />
        </div>
      </div>
      <p
        class="text-center text-base font-semibold text-neutral-900 leading-tight sm:text-[26px] mb-0"
      >
        {{ getFormattedAmount(endTotal) }}
        <span class="text-neutral-400 ml-0.5">{{ currencyLabel }}</span>
      </p>
    </card>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { PeriodBalancesModel } from "~/interfaces/api/cashbox/cash-flow-model";
import { getFormattedAmount } from "~/utils/filter";

// Composables
const { t } = useI18n();

// Stores
const cashFlowStore = useCashFlowStore("main");

// States
const currencyLabel = "";

// Hooks
const beginningTotal = computed(() => getBeginningTotal());
const endTotal = computed(() => getEndTotal());
const incomeTotal = computed(() => getIncomeTotal());
const expenseTotal = computed(() => getExpenseTotal());

// Methods
const sumPeriodBalances = (
  items: PeriodBalancesModel[] | undefined,
): number => {
  if (!items?.length) return 0;
  return items.reduce(
    (total, item) => total + (item?.converted_amount ?? item?.amount ?? 0),
    0,
  );
};

const getBeginningTotal = (): number => {
  return sumPeriodBalances(cashFlowStore.data?.beginning_period_balances);
};

const getEndTotal = (): number => {
  return sumPeriodBalances(cashFlowStore.data?.end_period_balances);
};

const getIncomeTotal = (): number => {
  return cashFlowStore.data?.income_statement_flow?.total_amount ?? 0;
};

const getExpenseTotal = (): number => {
  return cashFlowStore.data?.expense_statement_flow?.total_amount ?? 0;
};
<\/script>
`;export{n as default};
