const e=`<template>
  <DashboardCashboxExpeditorDebtGeneralTable
    type="invoice"
    :headers="headers"
    :params="params"
    :data="data || []"
    :is-loading="isLoading"
    :save-key="CashboxExpeditorDebtByInvoice"
    :is-excel-file-downloading="isExcelFileDownloading"
    @set-page="setPage"
    @set-page-size="setPageSize"
    @search="search"
    @sort="sortData"
    @refresh="getData"
    @change-table-headers="headers = $event"
    @download-excel-file="onDownloadExcelFile"
  />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ByInvoiceDetailModel } from "~/interfaces/api/cashboxes/expeditor-debt-model";
import type {
  ListParams,
  OrderByParams,
} from "~/interfaces/api/params/list-parameters";
import type { Template } from "~/interfaces/ui/template";
import { CashboxExpeditorDebtByInvoice } from "~/variable/column-constants";

// props
const props = defineProps<{
  id: string;
}>();

// store
const expeditorDebtStore = useExpeditorDebtStore("main");

// states
const { t } = useI18n();
const data = ref<ByInvoiceDetailModel[]>([]);
const isLoading = ref(false);
const isExcelFileDownloading = ref(false);

const params = reactive<ListParams>({
  page: 1,
  page_size: 10,
  filter: [
    {
      field: "expeditor_id",
      value: [props.id],
    },
  ],
  search: null,
  order_by: {
    field: "expeditor_name",
    is_asc: true,
  },
});

const headers = ref<
  (Template & {
    accessorKey?: string;
    showCurrencyCode?: boolean;
    innerType?: string;
  })[]
>(
  getCheckedItemsByKey(CashboxExpeditorDebtByInvoice) || [
    {
      name: t("cash.expeditor_debt.invoice_created_date"),
      key: "invoice",
      type: "object",
      innerType: "date",
      accessorKey: "invoice.created_date",
      checked: true,
    },
    {
      name: t("cash.expeditor_debt.invoice_id"),
      key: "invoice",
      type: "object",
      accessorKey: "invoice.visual_id",
      checked: true,
    },
    {
      name: t("column.category"),
      key: "category",
      type: "object",
      accessorKey: "category.name",
      checked: true,
    },
    {
      name: t("column.product"),
      key: "product",
      type: "object",
      accessorKey: "product.name",
      checked: true,
    },
    {
      name: t("cash.expeditor_debt.original_debt"),
      checked: true,
      key: "original_debt",
      type: "number",
    },
    {
      name: t("cash.expeditor_debt.current_debt"),
      checked: true,
      key: "current_debt",
      type: "number",
    },
    {
      name: t("column.price"),
      checked: true,
      key: "price",
      type: "number",
      showCurrencyCode: true,
    },
    {
      name: t("cash.expeditor_debt.debt_cost"),
      checked: true,
      key: "debt_cost",
      type: "number",
      showCurrencyCode: true,
    },
  ],
);

// hooks
onMounted(async () => await getData());

watch(params, async () => await getData());

// methods
const setPage = (page: number) => {
  params.page = page;
};

const setPageSize = (pageSize: number) => {
  params.page_size = pageSize;
  params.page = 1;
};

const search = (value: string) => {
  params.search = value || null;
  params.page = 1;
};

const sortData = (data: OrderByParams | null) => {
  if (data) {
    const isObjType = headers.value.find(
      (header) => header.key === data.field && header.type === "object",
    );
    params.order_by = {
      field: isObjType ? data.field + "_name" : data.field,
      is_asc: data.is_asc,
    };
    return;
  }
  params.order_by = data;
};

const onDownloadExcelFile = async () => {
  await expeditorDebtStore.onDownloadByInvoiceExcelFile(
    params,
    headers.value,
    (loading: boolean) => {
      isExcelFileDownloading.value = loading;
    },
  );
};

const getData = async () => {
  isLoading.value = true;
  data.value = (await expeditorDebtStore.getByInvoiceList(params)) ?? [];
  isLoading.value = false;
};
<\/script>
`;export{e as default};
