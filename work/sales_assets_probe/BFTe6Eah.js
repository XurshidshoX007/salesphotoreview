const e=`<template>
  <DashboardCashboxIncomeReportDataTableWithCurrency
    :data="incomeReportsStore.byTerritoryStore.data!"
    :currencies="incomeReportsStore.filteredCurrencies"
    :is-loading="incomeReportsStore.byTerritoryStore.isLoading"
    :headers-before="incomeReportsStore.byTerritoryHeadersBefore"
    :headers-after="incomeReportsStore.byTerritoryHeadersAfter"
    :sorted="incomeReportsStore.byTerritoryStore.params.order_by as any"
    :current-size="incomeReportsStore.byTerritoryStore.params.page_size"
    :is-excel-file-downloading="
      incomeReportsStore.byTerritoryStore.isExcelFileDownloading
    "
    @setPageNumber="incomeReportsStore.byTerritoryStore.setPage"
    @setPageSize="incomeReportsStore.byTerritoryStore.setPageSize"
    @onSearch="incomeReportsStore.byTerritoryStore.search"
    @onSortData="incomeReportsStore.byTerritoryStore.sortData"
    @onDownloadExcelFile="onDownloadExcelFile"
    @refresh="incomeReportsStore.byTerritoryStore.refresh"
  />
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";

// Stores
const incomeReportsStore = useCashboxIncomeReportsStore("main");

// Methods
const onDownloadExcelFile = async (headers: Template[]) => {
  incomeReportsStore.byTerritoryStore.templates = headers;
  await incomeReportsStore.byTerritoryStore.onDownloadExcelFile();
};
<\/script>
`;export{e as default};
