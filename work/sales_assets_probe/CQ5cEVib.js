const e=`<template>
  <DashboardCashboxIncomeReportDataTableWithCurrency
    :data="incomeReportsStore.byAgentStore.data!"
    :currencies="incomeReportsStore.filteredCurrencies"
    :is-loading="incomeReportsStore.byAgentStore.isLoading"
    :headers-before="incomeReportsStore.byAgentHeadersBefore"
    :headers-after="incomeReportsStore.byAgentHeadersAfter"
    :sorted="incomeReportsStore.byAgentStore.params.order_by as any"
    :current-size="incomeReportsStore.byAgentStore.params.page_size"
    :is-excel-file-downloading="
      incomeReportsStore.byAgentStore.isExcelFileDownloading
    "
    @setPageNumber="incomeReportsStore.byAgentStore.setPage"
    @setPageSize="incomeReportsStore.byAgentStore.setPageSize"
    @onSearch="incomeReportsStore.byAgentStore.search"
    @onSortData="incomeReportsStore.byAgentStore.sortData"
    @onDownloadExcelFile="onDownloadExcelFile"
    @refresh="incomeReportsStore.byAgentStore.refresh"
  />
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";

// Stores
const incomeReportsStore = useCashboxIncomeReportsStore("main");

// Methods
const onDownloadExcelFile = async (headers: Template[]) => {
  incomeReportsStore.byAgentStore.templates = headers;
  await incomeReportsStore.byAgentStore.onDownloadExcelFile();
};
<\/script>
`;export{e as default};
