const e=`<template>
  <flex-col class="page-gap">
    <DashboardCashboxApplicationsPaymentFilter
      :is-loading="paymentRequestStore.isLoading"
      :is-filter-loading="paymentRequestStore.isFilterLoading"
      :params="params"
      :group-type="ApplicationPaymentGroupingType.VanSellingPayments"
      @onSetFilters="onSetFilters"
    />
    <DashboardCashboxApplicationsPaymentDataTable
      :column-save-key="agentPaymentColumn"
      :templates="templates"
      :params="params"
      :is-loading="paymentRequestStore.isLoading"
      :is-excel-file-downloading="paymentRequestStore.isExcelFileDownloading"
      :selected-ids="paymentRequestStore.selectedIds"
      :totals="totals"
      :data="data"
      :allow-order-detail-link="hasAccess2OrderDetailLink"
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
import { agentPaymentColumn } from "~/variable/column-constants";
import { ApplicationPaymentGroupingType } from "~/variable/static-constants";
import { useI18n } from "vue-i18n";
import { useApplicationPaymentTab } from "./useApplicationPaymentTab";
import { useClientsAccess } from "~/composables/access/clients/clients";
import { useOrdersAccess } from "~/composables/access/orders/orders";

const { t } = useI18n();
const { hasAccess2Detail: hasAccess2ClientDetail } = useClientsAccess();
const { hasAccess2Detail: hasAccess2OrderDetailLink } = useOrdersAccess();

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
  groupingType: ApplicationPaymentGroupingType.VanSellingPayments,
  columnSaveKey: agentPaymentColumn,
  excelLabel: t("dashboard.agents"),
  requestCreatorLabel: t("dashboard.request_creator_name"),
});

// expose
defineExpose({ refresh });
<\/script>
`;export{e as default};
