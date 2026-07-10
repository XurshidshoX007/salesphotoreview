const e=`<template>
  <ReportsExpeditorReportDataTable
    :headers="returnExpeditorsStore.byOrdersHeaders"
    :loadedData="returnExpeditorsStore.byOrdersData"
    :page-size="params.page_size"
    :sorted-data="params.order_by"
    :is-loading="returnExpeditorsStore.isByOrdersLoading"
    :isExcelFileDownloading="
      returnExpeditorsStore.isByOrdersExcelFileDownloading
    "
    :totals="returnExpeditorsStore.totals"
    :statusConstants="statusConstants"
    :save-key="reportsReturnExpeditorsByOrderHeader"
    @onSortData="onSortData"
    @onSearch="onSearch"
    @onChangeHeaders="onChangeHeaders"
    @onSetPage="onSetPage"
    @onSetPageSize="onSetPageSize"
    @onDownloadExcelFile="onDownloadExcelFile"
    @refresh="onRefresh"
    @onOpenDetailDialog="onOpenDetailDialog"
  />
  <transition name="modal">
    <div v-if="orderId">
      <ReportsExpeditorReportByOrdersDetailDialog
        :id="orderId"
        @closeDialog="onCloseDetailDialog"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { ListParams } from "~/interfaces/api/params/list-parameters";
import type { Template } from "~/interfaces/ui/template";
import { reportsReturnExpeditorsByOrderHeader } from "~/variable/column-constants";

// store
const returnExpeditorsStore = useReportsReturnExpeditorsStore("main");

//props
const props = defineProps({
  isActive: Boolean,
});

// states
const params: ListParams = reactive({ ...returnExpeditorsStore.tableParams });
const orderId = ref<string | null>(null);
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

const statusConstants = computed(
  () => returnExpeditorsStore.orderStatusConstants,
);

// methods
const getData = async () => {
  await returnExpeditorsStore.getByOrdersData({
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
  (returnExpeditorsStore.byOrdersHeaders = newHeaders);

const onSetPage = (newPage: number) => (params.page = newPage);

const onSetPageSize = (newSize: number) => (params.page_size = newSize);

const onDownloadExcelFile = async () =>
  await returnExpeditorsStore.onDownloadByOrdersExcelOfTable();

const onOpenDetailDialog = (id: string) => (orderId.value = id);

const onCloseDetailDialog = () => (orderId.value = null);

const onRefresh = async () => await getData();
<\/script>
`;export{e as default};
