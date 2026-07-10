const e=`<template>
  <div class="filter-content-container !gap-0 !p-0">
    <div class="filter-content-header p-4 pb-2! items-center!">
      <page-title-20 :title="t('cash.cashbox_balances.title')" />
      <div class="flex items-center gap-4">
        <d-input-date-picker
          :value="selectedDate"
          without-label
          value-for
          @change="onSelectDate"
        />
      </div>
    </div>

    <div class="table-content-container !border-none !rounded-t-0">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="cashboxCashBalances"
          :templates="headers"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn :headers="headers" :save-key="cashboxCashBalances" />
        <page-size-btn
          :current-size="cashboxBalancesStore.params.page_size"
          :total-count="totalCount"
          :page-number="paginationData.current_page"
          @setPageSize="cashboxBalancesStore.setPageSize"
        />
        <search-input @change="onSearch" :value="searchParams" />
        <excel-btn @click="onDownloadExcelFile" />
        <RefreshBtn
          @click="refresh"
          :loading="cashboxBalancesStore.isLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="headers"
          @sort="sortData"
          :sorted="orderBy"
          :loading="cashboxBalancesStore.isLoading"
          :isEmpty="!pagedData.length"
        >
          <template #body>
            <c-tr
              v-for="(row, index) in pagedData"
              :key="\`\${row.cash_box.id}_\${index}\`"
            >
              <c-td-no-edit
                v-for="column in headers"
                :key="column.key"
                :is-checked="column.checked"
                :type="column.type"
              >
                <div :class="column.right && 'text-end'">
                  {{ getDataValue(row, column.key, column.type) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
          <template #footer v-if="searchData.length">
            <c-tr class="bg-neutral-50 border-t-0 border-b">
              <c-td-no-edit
                v-for="column in headers"
                :key="column.key"
                :is-checked="column.checked"
                :type="column.type"
              >
                <div
                  v-if="column.key === 'cash_box.name'"
                  class="text-sm font-semibold"
                >
                  {{ t("column.total") }}
                </div>
                <div
                  v-else
                  class="text-sm font-semibold"
                  :class="column.right && 'text-end'"
                >
                  {{ getDataValue(totalAmounts, column.key, column.type) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div v-if="searchData.length" class="table-content-footer">
        <curren-page-btn
          :current-size="cashboxBalancesStore.params.page_size"
          :total-count="totalCount"
          :page-number="paginationData.current_page"
        />
        <page-index
          :available-pages="paginationData.total_page"
          :current-page="paginationData.current_page"
          @setPage="setPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { Template } from "~/interfaces/ui/template";
import { cashboxCashBalances } from "~/variable/column-constants";
import { getDataValue } from "#imports";
import { getCheckedItemsByKey } from "~/utils/local-storage";

// Stores
const cashboxBalancesStore = useCashboxBalancesStore("main");

// Composables
const { t } = useI18n();

// States
const headers = ref<Template[]>([]);
const searchParams = ref<string | null>(null);
const selectedDate = ref<string | null>(null);
const orderBy = ref<{ field: string; is_asc: boolean }>({
  field: "cash_box.name",
  is_asc: true,
});
const page = ref(1);
const availableCurrencyKeys = ref<Set<string>>(new Set());

const headersBefore: Template[] = [
  {
    name: t("cash.cash"),
    key: "cash_box.name",
    type: "object",
    checked: true,
  },
  {
    name: t("cash.cashbox_balances.total_amount"),
    key: "total_amount",
    type: "number",
    checked: true,
    right: true,
  },
];

// Hooks
onMounted(() => {
  cashboxBalancesStore.getPaymentMethods();
  applyFilters(selectedDate.value);
});

const tableRows = computed(() =>
  (cashboxBalancesStore.data || []).map((row) => ({
    ...row,
    total_amount: row.total_amount.amount,
    ...Object.fromEntries(
      (row.balance_by_currency_ids || []).map((item) => {
        availableCurrencyKeys.value.add(item.key);
        return [\`currency_\${item.key}\`, item.value];
      }),
    ),
  })),
);

const _headers = computed(() => {
  const activeCurrencies =
    cashboxBalancesStore.paymentMethods?.items.filter((item) =>
      availableCurrencyKeys.value.has(item.id!),
    ) || [];

  return [
    ...headersBefore,
    ...activeCurrencies.map((item) => ({
      id: item.id,
      name: item.name,
      checked: true,
      key: \`currency_\${item.id}\`,
      type: "number",
      right: true,
    })),
  ] as Template[];
});

watchEffect(() => {
  headers.value = _headers.value;
});

const searchData = computed(() => {
  const term = searchParams.value?.trim().toLowerCase();
  let result = tableRows.value;

  if (term) {
    result = result.filter((row) =>
      row.cash_box?.name?.toLowerCase().includes(term),
    );
  }

  if (orderBy.value) {
    const { field, is_asc } = orderBy.value;
    result = [...result].sort((a, b) => {
      const aVal = getDataValue(a, field, "object") ?? "";
      const bVal = getDataValue(b, field, "object") ?? "";
      if (aVal < bVal) return is_asc ? -1 : 1;
      if (aVal > bVal) return is_asc ? 1 : -1;
      return 0;
    });
  }

  return result;
});

const totalCount = computed(() => searchData.value.length);

const paginationData = computed(() => ({
  total_page:
    totalCount.value > 0
      ? Math.ceil(totalCount.value / cashboxBalancesStore.params.page_size)
      : 1,
  current_page: page.value,
}));

const pagedData = computed(() => {
  const start = (page.value - 1) * cashboxBalancesStore.params.page_size;
  return searchData.value.slice(
    start,
    start + cashboxBalancesStore.params.page_size,
  );
});

watch(searchData, () => {
  page.value = 1;
});

const totalAmounts = computed(() => {
  let total_amount = 0;
  const currencyTotals: Record<string, number> = {};

  for (const row of searchData.value) {
    total_amount += row.total_amount ?? 0;
    for (const { key, value } of row.balance_by_currency_ids ?? []) {
      currencyTotals[\`currency_\${key}\`] =
        (currencyTotals[\`currency_\${key}\`] ?? 0) + value;
    }
  }

  return { total_amount, ...currencyTotals };
});

// Methods
const applyFilters = (date: string | null) => {
  cashboxBalancesStore.params.for_date = date;
};

const onSelectDate = (newDate: string | null) => {
  selectedDate.value = newDate;
  applyFilters(newDate);
};

const onChangeTableHeaders = (newValue: Template[]) => {
  headers.value = newValue;
};

const onSearch = (value: string) => {
  searchParams.value = value;
};

const sortData = (data: { field: string; is_asc: boolean }) => {
  orderBy.value = data;
  page.value = 1;
};

const setPage = (newPage: number) => {
  page.value = newPage;
};

const onDownloadExcelFile = () => {
  const checkedHeaders = headers.value.filter((h) => h.checked !== false);

  const headerRow = checkedHeaders.reduce(
    (acc, item) => {
      acc[item.key] = item.name;
      return acc;
    },
    {} as Record<string, string>,
  );

  const excelData = searchData.value.map((row) => {
    const result: Record<string, any> = {};
    for (const header of checkedHeaders) {
      result[header.key] = getDataValue(row, header.key, header.type) ?? "";
    }
    return result;
  });

  excelData.unshift(headerRow);

  downloadLocalExcelFile({
    headers: checkedHeaders,
    data: excelData,
    title: t("cash.cashbox_balances.title"),
  });
};

const refresh = async () => {
  await cashboxBalancesStore.refresh();
};
<\/script>
`;export{e as default};
