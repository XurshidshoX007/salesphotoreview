const n=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :templates="paymentCancellationStore.templates"
          :save-key="paymentCancellationHeader"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="paymentCancellationStore.templates"
          :save-key="paymentCancellationHeader"
        />
        <page-size-btn
          :current-size="paymentCancellationStore.params.page_size"
          :total-count="paymentCancellationStore?.data?.total_count"
          :page-number="paymentCancellationStore?.data?.page_number"
          @setPageSize="paymentCancellationStore.setPageSize"
        />
        <search-input @change="paymentCancellationStore.search" />
        <excel-btn
          :loading="paymentCancellationStore.isExcelFileDownloading"
          @click="paymentCancellationStore.onDownloadExcelFile"
        />
        <RefreshBtn
          @click="refresh"
          :loading="paymentCancellationStore.isLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="paymentCancellationStore.templates"
          :loading="paymentCancellationStore.isLoading"
          :isEmpty="!paymentCancellationStore.data?.items?.length"
          :sorted="paymentCancellationStore.params.order_by"
          @sort="paymentCancellationStore.sortData"
        >
          <template #body>
            <c-tr
              v-for="(data, index) in paymentCancellationStore.data?.items"
              :key="data.id"
            >
              <c-td-no-edit
                v-for="col in paymentCancellationStore.templates"
                :key="col"
                :is-checked="col.checked"
                :type="col.key"
              >
                <div v-if="col.type === 'date'">
                  {{ getFormattedDate(data[col.key], "DD.MM.YYYY HH:mm") }}
                </div>
                <link-component
                  v-else-if="col.key === 'income_payment_visual_id'"
                  :value="data['income_payment']?.visual_id"
                  @click="openPaymentCancellationDetailDialog(data?.id)"
                />
                <div v-else-if="col.key === 'status'">
                  <StatusBtnForTable readonly :status-data="data[col.key]" />
                </div>
                <div v-else-if="col.key === 'accessed_for_user_name'">
                  {{ data["accessed_for_user"]?.name }}
                </div>
                <div v-else-if="col.key === 'payment_cancellation_reason_name'">
                  {{ data["payment_cancellation_reason"]?.name }}
                </div>
                <div v-else-if="col.key === 'created_by_name'">
                  {{ data["created_by"]?.name }}
                </div>
                <div v-else-if="col.key === 'action'" :key="index">
                  <rounded-icon-btn
                    v-if="
                      data.status?.id === 1 &&
                      hasAccess2ClientPaymentCancellationDelete
                    "
                    icon="not-active"
                    type="danger"
                    :tooltip="t('cash.closed_access_to_change_payment')"
                    @click="openPaymentCancellationAccessDialog(data?.id)"
                  />
                </div>
                <div v-else>
                  {{ data[col.key] }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="paymentCancellationStore.params.page_size"
          :total-count="paymentCancellationStore?.data?.total_count"
          :page-number="paymentCancellationStore?.data?.page_number"
        />
        <page-index
          :available-pages="paymentCancellationStore.data?.total_pages"
          :current-page="paymentCancellationStore.data?.page_number"
          @setPage="paymentCancellationStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <DashboardCashboxPaymentCancellationDeleteAccessDialog
        v-if="paymentCancellationAccessId"
        :access-id="paymentCancellationAccessId"
        @closeDialog="paymentCancellationAccessId = null"
        @refresh="paymentCancellationStore.refresh()"
      />
    </transition>
    <transition name="modal">
      <DashboardCashboxPaymentCustomersPaymentCancellationDetail
        v-if="paymentCancellationDetailId"
        :id="paymentCancellationDetailId"
        @closeDialog="paymentCancellationDetailId = null"
      />
    </transition>
  </div>
</template>

<script setup>
import { getFormattedDate } from "~/utils/formatters";
import { paymentCancellationHeader } from "~/variable/column-constants";
import { usePaymentCancellationStore } from "~/stores/dashboard/cashbox/payment-customers/payment-cancellation";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";
import { useI18n } from "vue-i18n";

// store
const paymentCancellationStore = usePaymentCancellationStore("main");

// state
const { t } = useI18n();
const paymentCancellationAccessId = ref(null);
const paymentCancellationDetailId = ref(null);
const { hasAccess2ClientPaymentCancellationDelete } = useCashboxAccess();
// methods

const onChangeTableHeaders = (newValue) => {
  paymentCancellationStore.templates = newValue;
};

const refresh = () => {
  paymentCancellationStore.refresh();
};

const openPaymentCancellationAccessDialog = (data) => {
  paymentCancellationAccessId.value = data;
};

const openPaymentCancellationDetailDialog = (data) => {
  paymentCancellationDetailId.value = data;
};
<\/script>
`;export{n as default};
