const e=`<template>
  <card :classes="{ header: 'text-xl font-semibold' }">
    <template #header>{{ t("dashboard.sales.debt_by_territories") }}</template>

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
            :total-count="tableData.length"
            :page-number="currentPage"
            @set-page-size="setPageSize"
          />
          <search-input no-debounce @change="onSearch" />
          <refresh-btn
            @click="refresh"
            :loading="dashboardStore.territoryLoading"
          />
        </div>
      </div>
      <div class="table-content-body !p-0">
        <data-table
          :headers="headers"
          :loading="dashboardStore.territoryLoading"
          :is-empty="!tableData.length"
          :sorted="sorted"
          @sort="onSort"
        >
          <template #body>
            <c-tr
              v-for="(item, index) in data"
              :key="item.territory_name || index"
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
        </data-table>
      </div>
      <div v-if="data.length" class="table-content-footer !p-3">
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
import { getDataValue, type Template } from "#imports";
import { useI18n } from "vue-i18n";
import type { OrderByParams } from "~/interfaces/api/params/list-parameters";
import { dashboardSalesTerritoryTable } from "~/variable/column-constants";

// Composables
const { t } = useI18n();

// Stores
const dashboardStore = useSalesDashboardStore();

// States
const saveKey = dashboardSalesTerritoryTable;
const headers = computed(() => dashboardStore.territoryTemplates);

const searchValue = ref<string>();
const sorted = ref<OrderByParams>({ field: "", is_asc: true });
const currentPage = ref<number>(1);
const pageSize = ref<number>(10);

// Hooks
const tableData = computed(() => {
  return (dashboardStore.territoryData || []).map((item) => ({
    territory_name: item.territory?.name || "",
    sales_amount: item.sales_amount || 0,
    acb: item.acb || 0,
    tcb: item.tcb || 0,
    tcb_percent: item.tcb_percent || 0,
  }));
});

const filteredData = computed(() => {
  let result = tableData.value || [];

  if (searchValue.value) {
    result = result.filter((item) =>
      item.territory_name
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

const totalPages = computed(() =>
  Math.ceil((filteredData.value.length || 0) / pageSize.value),
);

const data = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
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
  await dashboardStore.getClientTerritory();
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
  if (!tableData.value.length) return;

  const header = headers.value.reduce<Record<string, string>>((acc, item) => {
    acc[item.key] = item.name;
    return acc;
  }, {});
  const excelData = transforExcelData(tableData.value, headers.value);
  excelData.unshift(header);

  downloadLocalExcelFile({
    headers: headers.value,
    data: excelData,
    title: \`\${t("dashboard.by_territories")}-\${getFormattedDate(
      new Date().toISOString(),
      "DD-MM-YYYY",
    )}\`,
  });
};

const onChangeTableHeaders = (newHeaders: Template[]) => {
  dashboardStore.territoryTemplates = newHeaders;
};

const onSort = (val: OrderByParams) => {
  sorted.value = val;
};
<\/script>
`;export{e as default};
