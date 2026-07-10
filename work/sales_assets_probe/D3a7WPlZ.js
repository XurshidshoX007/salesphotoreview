const e=`<template>
  <flex-col class="page-gap">
    <DashboardCashboxApplicationsPaymentFilter
      :is-loading="paymentRequestStore.isLoading"
      :is-filter-loading="paymentRequestStore.isFilterLoading"
      :params="params"
      :group-type="ApplicationPaymentGroupingType.ExpeditorPayments"
      @onSetFilters="onSetFilters"
    />
    <DashboardCashboxApplicationsPaymentDataTable
      :column-save-key="paymentRequestColumn"
      :templates="templates"
      :params="params"
      :is-loading="paymentRequestStore.isLoading"
      :is-excel-file-downloading="paymentRequestStore.isExcelFileDownloading"
      :selected-ids="paymentRequestStore.selectedIds"
      :totals="totals"
      :data="data"
      :allow-order-detail-link="hasAcces2OrderDetailLink"
      :allow-client-detail-link="hasAccess2ClientDetail"
      @on-change-templates="onChangeTableHeader"
      @setPageSize="setPageSize"
      @search="search"
      @onDownloadExcelFile="onDownloadExcelFile"
      @sortData="sortData"
      @get-all-item-ids="getAllItemIds"
      @refresh="refresh"
      @onSelectOrder="onSelectOrder"
      @setPage="setPage"
    />
  </flex-col>
</template>

<script setup lang="ts">
import { paymentRequestColumn } from "~/variable/column-constants";
import { ApplicationPaymentGroupingType } from "~/variable/static-constants";
import { useI18n } from "vue-i18n";
import { useClientsAccess } from "~/composables/access/clients/clients";
import { useOrdersAccess } from "~/composables/access/orders/orders";
import { useApplicationPaymentTab } from "./useApplicationPaymentTab";

const { t } = useI18n();
const { hasAccess2Detail: hasAccess2ClientDetail } = useClientsAccess();
const { hasAccess2Detail: hasAcces2OrderDetailLink } = useOrdersAccess();

const {
  paymentRequestStore,
  data,
  totals,
  params,
  templates,
  onSetFilters,
  refresh,
  onDownloadExcelFile,
  onChangeTableHeader,
  setPage,
  setPageSize,
  search,
  sortData,
  getAllItemIds,
  onSelectOrder,
} = useApplicationPaymentTab({
  groupingType: ApplicationPaymentGroupingType.ExpeditorPayments,
  columnSaveKey: paymentRequestColumn,
  excelLabel: t("sidebar.cash_collector"),
  requestCreatorLabel: t("clients.forwarder"),
});

// expose
defineExpose({ refresh });
<\/script>
`;export{e as default};
