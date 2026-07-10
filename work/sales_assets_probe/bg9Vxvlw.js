const e=`<template>
  <flex-col class="gap-2">
    <ToggleDataViewBtn
      :title="t('reports.by_product')"
      header-right
      :is-open="isOpen"
    >
      <template #header>
        <FlexibleItemsMenu
          tabMode
          :items-arr="productCountingTypes"
          :active-item-id="activeTabId"
          :is-btn-loading="returnExpeditorsStore.isByProductsLoading"
          @onChangeActiveItem="onChangeTabId"
        />
      </template>
      <template #body>
        <ReportsExpeditorReportDataTable
          :headers="returnExpeditorsStore.byProductsHeaders"
          :loadedData="loadedData"
          :page-size="params.page_size"
          :sorted-data="params.order_by"
          :is-loading="returnExpeditorsStore.isByProductsLoading"
          :isExcelFileDownloading="
            returnExpeditorsStore.isByProductsExcelFileDownloading
          "
          :save-key="reportsReturnExpeditorsByProductHeader"
          :totals="totals"
          @onSortData="onSortData"
          @onSearch="onSearch"
          @onChangeHeaders="onChangeHeaders"
          @onSetPage="onSetPage"
          @onSetPageSize="onSetPageSize"
          @refresh="onRefresh"
          @onDownloadExcelFile="onDownloadExcelFile"
        />
      </template>
    </ToggleDataViewBtn>
  </flex-col>
</template>

<script setup lang="ts">
import type { ListParams } from "~/interfaces/api/params/list-parameters";
import type { ReportsReturnExpeditorsByProductsModel } from "~/interfaces/api/reports/return-expeditors/by-products-model";
import type { ReportsReturnExpeditorTotalModel } from "~/interfaces/api/reports/return-expeditors/total-model";
import type { Template } from "~/interfaces/ui/template";
import { useI18n } from "vue-i18n";
import { reportsReturnExpeditorsByProductHeader } from "~/variable/column-constants";

// store
const returnExpeditorsStore = useReportsReturnExpeditorsStore("main");

//emits

const emit = defineEmits(["changeTab"]);

// props
const props = defineProps<{
  pageTitle: string;
  isOpen: boolean;
}>();

// states
const { t } = useI18n();

let params: ListParams = reactive({
  ...returnExpeditorsStore.tableParams,
  order_by: { field: "product", is_asc: true },
});

const activeTabId = ref<number>(1);
let debounceTimeout: NodeJS.Timeout | null = null;

const memorizedData = ref<
  Record<
    number,
    Record<
      "data" | "totals",
      ReportsReturnExpeditorsByProductsModel | ReportsReturnExpeditorTotalModel
    >
  >
>({});

// hooks
const loadedData = computed(() => {
  if (memorizedData.value[activeTabId.value])
    return memorizedData.value[activeTabId.value].data;
  return returnExpeditorsStore.byProductsData;
});

const totals = computed(() => {
  if (memorizedData.value[activeTabId.value])
    return memorizedData.value[activeTabId.value].totals;
  return returnExpeditorsStore.totals;
});

const productCountingTypes = computed(
  () => returnExpeditorsStore.productCountingTypes,
);

const setTabIdToInit = () => {
  if (productCountingTypes.value) {
    activeTabId.value = productCountingTypes.value[0].id;
  }
};

watchEffect(() => {
  if (productCountingTypes.value) {
    setTabIdToInit();
  }
});

watch(params, async () => {
  memorizedData.value = {};
  await getData();
});

watch(
  () => returnExpeditorsStore.commonParams,
  () => {
    memorizedData.value = {};
    setTabIdToInit();
  },
  { deep: true },
);

watch(
  () => props.isOpen,
  async () => {
    await getData();
  },
);

// methods
const onChangeTabId = async (newTabId: number) => {
  activeTabId.value = newTabId;

  await handelMemoData();
};

const handelMemoData = async () => {
  if (!memorizedData.value[activeTabId.value]) {
    const _params = {
      ...params,
      ...returnExpeditorsStore.commonParams,
      product_counting_type: activeTabId.value,
    };
    const [_, totals] = await Promise.all([
      returnExpeditorsStore.getByProductsData(_params),
      returnExpeditorsStore.getTotals(_params, true),
    ]);
    memorizedData.value[activeTabId.value] = {
      data: returnExpeditorsStore.byProductsData,
      totals,
    };
  }
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
  (returnExpeditorsStore.byProductsHeaders = newHeaders);

const onSetPage = (newPage: number) => {
  params.page = newPage;
};

const onSetPageSize = (newSize: number) => (params.page_size = newSize);

const getData = async () => {
  await returnExpeditorsStore.getByProductsData({
    ...params,
    ...returnExpeditorsStore.commonParams,
  });
  await returnExpeditorsStore.getTotals();
};

const onDownloadExcelFile = async () =>
  await returnExpeditorsStore.onDownloadByProductsExcelOfTable(
    activeTabId.value,
  );

const onRefresh = async () => {
  await getData();
};
<\/script>
`;export{e as default};
