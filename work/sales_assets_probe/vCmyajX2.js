const e=`<template>
  <card :classes="{ header: 'mb-4' }">
    <template #header> {{ t("dashboard.by_categories") }} </template>

    <div class="table-content-container">
      <div class="table-content-header !p-3 justify-between">
        <div class="table-content-btn-group">
          <table-sort-columns
            :templates="headers"
            :save-key="dashboardFinanceCategorySalesHeader"
            @onChangeTableHeaders="onChangeTableHeaders"
          />
          <show-hide-column
            :headers="headers"
            :save-key="dashboardFinanceCategorySalesHeader"
          />
          <excel-btn @click="downloadExcelFile" />
          <page-size-btn
            :current-size="pageSize"
            :total-count="categorySalesStore.data?.length"
            :page-number="pageNumber"
            @setPageSize="setPageSize"
          />
          <search-input no-debounce @change="searchValue = $event" />
          <refresh-btn
            @click="categorySalesStore.refresh()"
            :loading="categorySalesStore.isLoading"
          />
        </div>
      </div>
      <div class="table-content-body !p-0">
        <data-table
          :headers="headers"
          :loading="categorySalesStore.isLoading"
          :is-empty="!categorySalesStore.data?.length"
          :sorted="sorted"
          @sort="onSort"
        >
          <template #body>
            <c-tr
              v-for="item in data"
              :key="item.group.id"
              class="cursor-pointer"
            >
              <c-td-no-edit
                v-for="column in headers"
                :is-checked="column.checked"
                :key="column.key"
                :type="column.type"
              >
                {{
                  getDataValue(
                    item,
                    column.accessorKey || column.key,
                    column.type,
                  )
                }}
              </c-td-no-edit>
            </c-tr>
          </template>
          <template #footer>
            <c-tr class="border-b-0 bg-neutral-50">
              <c-td-no-edit
                v-for="(column, index) in headers"
                :key="column.key"
                :is-checked="column.checked"
              >
                <div
                  v-show="index === 0"
                  class="font-semibold whitespace-nowrap"
                >
                  {{ t("column.total") }}
                </div>

                <div
                  v-if="column.checked"
                  class="text-end font-semibold whitespace-nowrap"
                >
                  {{ getFormattedAmount(getDataValue(totals, column.key)) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div v-if="data?.length" class="table-content-footer !p-3">
        <curren-page-btn
          :current-size="pageSize"
          :total-count="filteredData.length"
          :page-number="pageNumber"
          @setPageSize="setPageSize"
        />
        <page-index
          :available-pages="totalPages"
          :current-page="currentPage"
          @setPage="setPage"
        />
      </div>
    </div>
  </card>
</template>

<script setup lang="ts">
import { getDataValue, getFormattedAmount, type Template } from "#imports";
import { useI18n } from "vue-i18n";
import { dashboardFinanceCategorySalesHeader } from "~/variable/column-constants";
import type { OrderByParams } from "~/interfaces/api/params/list-parameters";

// Types
type Props = {
  currencies: SharedApiCurrenciesModel[];
};

// Props
const props = defineProps<Props>();

// Composables
const { t } = useI18n();

// Stores
const { categorySalesStore, params } = useDashboardFinanceStore();

// States
const currencyHeaders = ref<Template[]>([]);
const searchValue = ref<string>();
const currentPage = ref<number>(1);
const pageNumber = ref<number>(1);
const pageSize = ref<number>(10);
const headers = ref<Template[]>([]);
const sorted = ref<OrderByParams>({ field: "", is_asc: true });

// Hooks
watch(
  () => params,
  (params) => {
    if (!params.date_filter) return;

    categorySalesStore.getData();
  },
  { immediate: true, deep: true },
);

watch(
  [() => props.currencies, () => categorySalesStore.data] as const,
  ([currencies, data]) => {
    if (!currencies.length || !data?.length) return;

    currencyHeaders.value = currencies
      .filter((currency) =>
        categorySalesStore.data?.some(
          (item) => item[currency.id] !== undefined,
        ),
      )
      .map<Template>((currency) => ({
        name: currency.name,
        key: currency.id,
        type: "number",
        checked: true,
      }));
  },
);

watch(
  currencyHeaders,
  (currencyHeaders) => {
    if (!currencyHeaders.length) return;

    headers.value = getCheckedItemsByKey(
      dashboardFinanceCategorySalesHeader,
    ) || [
      {
        name: t("column.name"),
        key: "group",
        type: "object",
        accessorKey: "group.name",
        checked: true,
      },
      {
        name: t("column.total_sum"),
        key: "total_amount",
        type: "number",
        checked: true,
      },
      ...currencyHeaders,
      {
        name: t("column.percentage"),
        key: "proportion",
        type: "number",
        checked: true,
      },
    ];
  },
  { immediate: true },
);

const filteredData = computed(() => {
  let result = categorySalesStore.data || [];

  if (searchValue.value) {
    result = result.filter((item) =>
      item.group.name.toLowerCase().includes(searchValue.value!.toLowerCase()),
    );
  }

  if (sorted.value.field) {
    result = [...result].sort((a, b) => {
      let aVal: any = a[sorted.value.field];
      let bVal: any = b[sorted.value.field];

      if (sorted.value.field === "group_name") {
        aVal = a.group.name;
        bVal = b.group.name;
      }

      if (aVal === bVal) return 0;

      const modifier = sorted.value.is_asc ? 1 : -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * modifier;
      }

      return ((aVal || 0) - (bVal || 0)) * modifier;
    });
  }

  return result;
});

const totalPages = computed(() => {
  const totalItems = filteredData.value.length || 0;
  return Math.ceil(totalItems / pageSize.value);
});

const data = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;

  return filteredData.value.slice(start, end);
});

const totals = computed(() => {
  return headers.value.reduce<Record<string, number>>((acc, column) => {
    if (column.type === "number") {
      const total =
        filteredData.value?.reduce((total, item) => {
          return total + ((item[column.key] as number) || 0);
        }, 0) || 0;

      acc[column.key] = column.key === "proportion" ? Math.ceil(total) : total;
    }
    return acc;
  }, {});
});

// Methods
const setPageSize = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const setPage = (page: number) => {
  currentPage.value = page;
};

const transforExcelData = (data: GenericObject[], headers: Template[]) => {
  const result: GenericObject[] = [];
  for (const item of data) {
    const row: GenericObject = {};
    for (const column of headers) {
      if (column.key === "group") {
        row[column.key] = item.group.name;
      } else {
        row[column.key] = item[column.key];
      }
    }
    result.push(row);
  }
  return result;
};

const downloadExcelFile = () => {
  if (!filteredData.value.length) return;

  const header = headers.value.reduce<Record<string, string>>((acc, item) => {
    acc[item.key] = item.name;
    return acc;
  }, {});
  const excelData = transforExcelData(filteredData.value, headers.value);
  excelData.unshift(header);

  const excelFooter = Object.fromEntries(
    headers.value.map(({ key }) => [
      key,
      key === "group"
        ? t("column.total")
        : totals.value && typeof getDataValue(totals.value, key) === "number"
          ? getDataValue(totals.value, key)
          : "",
    ]),
  );
  excelData.push(excelFooter);

  downloadLocalExcelFile({
    headers: headers.value,
    data: excelData,
    title: \`dashboard-finance-category-sales-\${getFormattedDate(
      new Date().toISOString(),
      "DD-MM-YYYY",
    )}\`,
  });
};

const onChangeTableHeaders = (newHeaders: Template[]) => {
  headers.value = newHeaders;
};

const onSort = (val: OrderByParams) => {
  sorted.value = val;
};
<\/script>
`;export{e as default};
