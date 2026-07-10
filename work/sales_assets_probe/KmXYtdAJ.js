const e=`<template>
  <DashboardCashboxExpeditorDebtGeneralTable
    type="expeditor"
    :headers="expeditorDebtStore.headers"
    :data="expeditorDebtStore.data || []"
    :is-loading="expeditorDebtStore.isLoading"
    :is-excel-file-downloading="expeditorDebtStore.isExcelFileDownloading"
    :params="expeditorDebtStore.params"
    :save-key="CashboxExpeditorDebt"
    @refresh="expeditorDebtStore.refresh"
    @search="expeditorDebtStore.search"
    @set-page-size="expeditorDebtStore.setPageSize"
    @set-page="expeditorDebtStore.setPage"
    @sort="expeditorDebtStore.sortData"
    @change-table-headers="onChangeTableHeaders"
    @download-excel-file="expeditorDebtStore.onDownloadExcelFile"
  />
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { CashboxExpeditorDebt } from "~/variable/column-constants";

// store
const expeditorDebtStore = useExpeditorDebtStore("main");

// hooks
onMounted(async () => await expeditorDebtStore.getData());

// methods
const onChangeTableHeaders = (newHeaders: Template[]) => {
  expeditorDebtStore.headers = newHeaders;
};
<\/script>
`;export{e as default};
