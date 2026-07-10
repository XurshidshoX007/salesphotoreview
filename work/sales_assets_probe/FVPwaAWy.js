const e=`<template>
  <card :classes="{ header: 'text-xl font-semibold' }">
    <template #header>{{ t("dashboard.by_categories") }}</template>

    <div class="table-content-container">
      <div class="table-content-header !p-3 justify-between">
        <div class="table-content-btn-group">
          <table-sort-columns
            :templates="headers"
            :save-key="saveKey"
            @on-change-table-headers="onChangeTableHeaders"
          />
          <show-hide-column :headers="headers" :save-key="saveKey" />
          <excel-btn @click="downloadExcelFile" />
          <page-size-btn
            :current-size="pageSize"
            :total-count="
              dashboardStore.productCategoryData?.items?.length
            "
            :page-number="currentPage"
            @set-page-size="setPageSize"
          />
          <search-input no-debounce @change="onSearch" />
          <refresh-btn
            @click="refresh"
            :loading="dashboardStore.productCategoryLoading"
          />
        </div>
      </div>
      <div class="table-content-body !p-0">
        <data-table
          :headers="headers"
          :loading="dashboardStore.productCategoryLoading"
          :is-empty="!dashboardStore.productCategoryData?.items?.length"
          :sorted="sorted"
          @sort="onSort"
        >
          <template #body>
            <c-tr
              v-for="(item, index) in data"
              :key="item.category?.id || index"
            >
              <c-td-no-edit
                v-for="column in headers"
                :is-checked="column.checked"
                :key="column.key"
                :type="column.type"
              >
                <template v-if="column.key === 'category_name'">
                  {{ getNestedValue(item, "category.name", column.type) }}
                </template>
                <template v-else-if="column.key === 'share'">
                  {{ getFormattedShare(item.share) }}
                </template>
                <template v-else>
                  {{
                    getDataValue(
                      item,
                      column.accessorKey || column.key,
                      column.type,
                    )
                  }}
                </template>
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
                  <template v-if="column.key === 'share'">
                    {{
                      getFormattedShare(
                        getDataValue(totals, column.key) as number,
                      )
                    }}
                  </template>
                  <template v-else>
                    {{ getFormattedAmount(getDataValue(totals, column.key)) }}
                  </template>
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
          :page-number="currentPage"
          @set-page-size="setPageSize"
        />
        <page-index
          :available-pages="totalPages"
          :current-page="currentPage"
          @set-page="setPage"
        />
      </div>
    </div>
  </card>
</template>

<script setup lang="ts">
import {
  getDataValue,
  getFormattedAmount,
  getNestedValue,
  type Template,
} from "#imports";
import { useI18n } from "vue-i18n";
import type { OrderByParams } from "~/interfaces/api/params/list-parameters";
import { dashboardSalesProductCategoryTable } from "~/variable/column-constants";

// Composables
const { t } = useI18n();

// Stores
const dashboardStore = useSalesDashboardStore();

// States
const searchValue = ref<string>();
const currentPage = ref<number>(1);
const pageSize = ref<number>(10);
const sorted = ref<OrderByParams>({ field: "", is_asc: true });
const saveKey = dashboardSalesProductCategoryTable;
const headers = computed(() => dashboardStore.productCategoryTemplates);

// Hooks
const tableData = computed(() => {
  if (!dashboardStore.productCategoryData?.items?.length) return [];

  return dashboardStore.productCategoryData.items.map((item) => ({
    category_name: item.category?.name || "",
    category: item.category,
    sales_amount: item.sales_amount || 0,
    count: item.count || 0,
    volume: item.volume || 0,
    share: item.share || 0,
    acb: item.acb || 0,
  }));
});

const filteredData = computed(() => {
  let result = tableData.value || [];

  if (searchValue.value) {
    result = result.filter((item) =>
      item.category_name
        ?.toLowerCase()
        .includes(searchValue.value!.toLowerCase()),
    );
  }

  if (sorted.value.field) {
    result = [...result].sort((a, b) => {
      let aVal: any = a[sorted.value.field as keyof typeof a];
      let bVal: any = b[sorted.value.field as keyof typeof b];

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
  const backendTotal = dashboardStore.productCategoryData?.total;
  const useBackendTotal = backendTotal && !searchValue.value;

  if (useBackendTotal) {
    const totalMap = backendTotal as unknown as Record<string, number>;
    return headers.value.reduce<Record<string, number>>((acc, column) => {
      if (column.type === "number" && column.key in backendTotal) {
        const val = totalMap[column.key];
        acc[column.key] =
          column.key === "share" ? Math.round(val ?? 0) : (val ?? 0);
      }
      return acc;
    }, {});
  }

  return headers.value.reduce<Record<string, number>>((acc, column) => {
    if (column.type === "number") {
      const total =
        filteredData.value?.reduce((total, item) => {
          const value = (item as any)[column.key];
          return total + ((typeof value === "number" ? value : 0) || 0);
        }, 0) || 0;

      acc[column.key] = column.key === "share" ? Math.round(total) : total;
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

const onSearch = (value: string) => {
  searchValue.value = value;
  currentPage.value = 1;
};

const refresh = async () => {
  await dashboardStore.getProductCategory();
};

const transforExcelData = (data: GenericObject[], headers: Template[]) => {
  const result: GenericObject[] = [];
  for (const item of data) {
    const row: GenericObject = {};
    for (const column of headers) {
      row[column.key] = item[column.key];
    }
    result.push(row);
  }
  return result;
};

const downloadExcelFile = () => {
  if (!dashboardStore.productCategoryData?.items?.length) return;

  const transformedData = dashboardStore.productCategoryData.items.map(
    (item) => ({
      category_name: item.category?.name || "",
      sales_amount: item.sales_amount || 0,
      count: item.count || 0,
      volume: item.volume || 0,
      acb: item.acb || 0,
      share: item.share || 0,
    }),
  );

  const header = headers.value.reduce<Record<string, string>>((acc, item) => {
    acc[item.key] = item.name;
    return acc;
  }, {});
  const excelData = transforExcelData(transformedData, headers.value);
  excelData.unshift(header);

  const excelFooter = Object.fromEntries(
    headers.value.map(({ key }) => [
      key,
      key === "category_name"
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
    title: \`\${t("dashboard.by_categories")}-\${getFormattedDate(
      new Date().toISOString(),
      "DD-MM-YYYY",
    )}\`,
  });
};

const onChangeTableHeaders = (newHeaders: Template[]) => {
  dashboardStore.productCategoryTemplates = newHeaders;
};

const onSort = (val: OrderByParams) => {
  sorted.value = val;
};

const getFormattedShare = (
  value: number | string | null | undefined,
): string => {
  if (value === null || value === undefined) return "0 %";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "0 %";
  return \`\${Number(numValue.toFixed(2))} %\`;
};
<\/script>
`;export{e as default};
