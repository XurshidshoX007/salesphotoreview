const n=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="consignmentBalancesHeader"
          :templates="clientsBalancesByConsignationStore.headers"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="clientsBalancesByConsignationStore.headers"
          :save-key="consignmentBalancesHeader"
        />
        <page-size-btn
          :current-size="clientsBalancesByConsignationStore.params.page_size"
          :total-count="clientsBalancesByConsignationStore?.data?.total_count"
          :page-number="clientsBalancesByConsignationStore?.data?.page_number"
          @setPageSize="clientsBalancesByConsignationStore.setPageSize"
        />
        <search-input @change="clientsBalancesByConsignationStore.search" />
        <excel-btn
          @click="clientsBalancesByConsignationStore.onDownloadExcelFile"
          :loading="clientsBalancesByConsignationStore.isExcelFileDownloading"
        />
        <RefreshBtn
          @click="refresh"
          :loading="clientsBalancesByConsignationStore.isDataLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :loading="clientsBalancesByConsignationStore.isDataLoading"
          :isEmpty="!clientsBalancesByConsignationStore.data?.items?.length"
          :headers="clientsBalancesByConsignationStore.headers"
          :sorted="clientsBalancesByConsignationStore.params.order_by"
          @sort="clientsBalancesByConsignationStore.sortData"
        >
          <template #body>
            <c-tr
              v-for="(data, index) in clientsBalancesByConsignationStore.data
                ?.items"
              :key="index"
            >
              <c-td-no-edit
                v-for="key in clientsBalancesByConsignationStore.headers"
                :key="key"
                :header-key="key.key"
                :is-checked="key.checked"
                :class="key.borderX && 'border-r-1'"
                :type="key.type"
              >
                <link-component
                  v-if="key.key === 'visual_id'"
                  :to="
                    getCustomerBalanceDetailsPageUrl(
                      data?.client_id,
                      data.agent_id,
                    )
                  "
                  :is-linkable="hasAccess2ClientBalanceDetail"
                  :value="data[key.key]"
                  target
                />
                <div v-else-if="key.type === 'number'">
                  {{ getFormattedAmount(data[key.key]) }}
                </div>
                <div v-else-if="key.key === 'trade_direction_list'">
                  <show-more :data="data[key.key]" />
                </div>
                <div
                  v-else-if="key.key === 'term_date'"
                  class="pt-2 check underline cursor-pointer"
                  :class="checkTermDate(data[key.key]) && 'text-red'"
                  @click="
                    onOpenChangeDeadline(
                      data?.client_id,
                      data?.client_name,
                      data?.term_date,
                    )
                  "
                >
                  {{ getFormattedDate(data[key.key], "DD.MM.YYYY") }}
                </div>
                <div v-else-if="key?.id && key.status" class="text-end">
                  {{
                    getFormattedAmount(
                      getCombinedBalances(key.status, key.id, data),
                    )
                  }}
                </div>
                <div v-else-if="key.isDynamic && key.dynamicConfig">
                  {{ getDynamicValue(data, key.dynamicConfig) }}
                </div>
                <div v-else-if="key.key === 'supervisor_list'">
                  <show-more :data="data[key.key]" />
                </div>
                <div v-else>
                  {{ data[key.key] }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="clientsBalancesByConsignationStore.params.page_size"
          :total-count="clientsBalancesByConsignationStore?.data?.total_count"
          :page-number="clientsBalancesByConsignationStore?.data?.page_number"
        />
        <page-index
          :available-pages="
            clientsBalancesByConsignationStore.data?.total_pages
          "
          :current-page="clientsBalancesByConsignationStore.data?.page_number"
          @setPage="clientsBalancesByConsignationStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="changeDeadlineInfo.clientId">
        <dashboard-cashbox-customer-balances-change-deadline-dialog
          :changeDeadlineInfo="changeDeadlineInfo"
          @closeDialog="onCloseChangeDeadline"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { consignmentBalancesHeader } from "~/variable/column-constants";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";
import { AppRoutes } from "~/variable/routes";
import {
  getDynamicValue,
  getFormattedAmount,
  getFormattedDate,
} from "#imports";

// store
const clientsBalancesByConsignationStore =
  useClientsBalanceByConsignationStore("main");

// access
const { hasAccess2ClientBalanceDetail } = useCashboxAccess();

// states
const changeDeadlineInfo = ref({
  clientId: "",
  clientName: "",
  currentTerm: "",
});

// methods
const checkTermDate = (date) => {
  return new Date(date) < new Date();
};

const onChangeTableHeaders = (newValue) => {
  clientsBalancesByConsignationStore.headers = newValue;
};

const onOpenChangeDeadline = (clientId, clientName, currentTerm) => {
  if (currentTerm) {
    changeDeadlineInfo.value.clientId = clientId;
    changeDeadlineInfo.value.clientName = clientName;
    changeDeadlineInfo.value.currentTerm = currentTerm;
  }
};

const getCombinedBalances = (type, id, data) => {
  if (type === "paid") {
    return data?.combined_balances?.find(
      (item) => item.payment_method_id === id,
    )?.paid;
  }
  return data?.combined_balances?.find((item) => item.payment_method_id === id)
    ?.debt;
};

function onCloseChangeDeadline() {
  changeDeadlineInfo.value.clientId = "";
  changeDeadlineInfo.value.clientName = "";
  changeDeadlineInfo.value.currentTerm = "";
}

const refresh = async () => {
  await clientsBalancesByConsignationStore.getData();
};

const getCustomerBalanceDetailsPageUrl = (id, agent_id) => {
  return (
    AppRoutes.cashbox.child.customerBalancesDetail.replace(":id", id) +
    "?" +
    params2query({ agent_id })
  );
};
<\/script>
`;export{n as default};
