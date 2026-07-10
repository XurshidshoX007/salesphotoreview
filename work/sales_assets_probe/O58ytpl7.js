const e=`<template>
  <ReportsExpeditorReportDataTable
    :headers="returnExpeditorsStore.byClientsHeaders"
    :loadedData="returnExpeditorsStore.byClientsData"
    :page-size="params.page_size"
    :sorted-data="params.order_by"
    :is-loading="returnExpeditorsStore.isByClientsLoading"
    :isExcelFileDownloading="
      returnExpeditorsStore.isByClientsExcelFileDownloading
    "
    :save-key="reportsReturnExpeditorsByClientHeader"
    :totals="returnExpeditorsStore.totals"
    @onSortData="onSortData"
    @onSearch="onSearch"
    @onChangeHeaders="onChangeHeaders"
    @onSetPage="onSetPage"
    @onSetPageSize="onSetPageSize"
    @refresh="onRefresh"
    @onDownloadExcelFile="onDownloadExcelFile"
  />
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { reportsReturnExpeditorsByClientHeader } from "~/variable/column-constants";

// store
const returnExpeditorsStore = useReportsReturnExpeditorsStore("main");

//props
const props = defineProps({
  isActive: Boolean,
});

// states
const params = reactive({
  ...returnExpeditorsStore.tableParams,
  order_by: { field: "client", is_asc: true },
});

let debounceTimeout: NodeJS.Timeout | null = null;

// hooks
watch(params, async () => {
  await getData();
});

watch(
  () => props.isActive,
  async () => {
    await getData();
  },
);

// methods
const getData = async () => {
  await returnExpeditorsStore.getByClientsData({
    ...params,
    ...returnExpeditorsStore.commonParams,
  });
};

const onSortData = (data: Record<"field" | "is_asc", string | boolean>) =>
  (params.order_by = data);

const onSearch = (value: string) => {
  if (debounceTimeout !== null) {
    clearTimeout(debounceTimeout);
  }
  debounceTimeout = setTimeout(() => {
    params.page = 1;
    params.search = value;
  }, 400);
};

const onChangeHeaders = (newHeaders: Template[]) =>
  (returnExpeditorsStore.byClientsHeaders = newHeaders);

const onSetPage = (newPage: number) => (params.page = newPage);

const onSetPageSize = (newSize: number) => (params.page_size = newSize);

const onDownloadExcelFile = async () =>
  await returnExpeditorsStore.onDownloadByClientsExcelOfTable();

const onRefresh = async () => await getData();
<\/script>
`;export{e as default};
