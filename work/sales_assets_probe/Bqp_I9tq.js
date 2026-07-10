const e=`<template>
  <DashboardCashboxIncomeReportDataTableWithCurrency
    :data="incomeReportsStore.byClientStore.data!"
    :currencies="incomeReportsStore.filteredCurrencies"
    :is-loading="incomeReportsStore.byClientStore.isLoading"
    :headers-before="incomeReportsStore.byClientHeadersBefore"
    :headers-after="incomeReportsStore.byClientHeadersAfter"
    :sorted="incomeReportsStore.byClientStore.params.order_by as any"
    :current-size="incomeReportsStore.byClientStore.params.page_size"
    :is-excel-file-downloading="
      incomeReportsStore.byClientStore.isExcelFileDownloading
    "
    @setPageNumber="incomeReportsStore.byClientStore.setPage"
    @setPageSize="incomeReportsStore.byClientStore.setPageSize"
    @onSearch="incomeReportsStore.byClientStore.search"
    @onSortData="incomeReportsStore.byClientStore.sortData"
    @onDownloadExcelFile="onDownloadExcelFile"
    @refresh="incomeReportsStore.byClientStore.refresh"
  />
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";

// Stores
const incomeReportsStore = useCashboxIncomeReportsStore("main");

// Methods
const onDownloadExcelFile = async (headers: Template[]) => {
  incomeReportsStore.byClientStore.templates = headers;
  await incomeReportsStore.byClientStore.onDownloadExcelFile();
};
<\/script>
`;export{e as default};
