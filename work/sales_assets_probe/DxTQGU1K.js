const e=`<template>
  <div v-show="allowToCreate && !allowToList" class="w-full flex justify-end">
    <m-btn>{{ t("clients.add") }}</m-btn>
  </div>
  <div v-show="allowToList" class="table-content-container">
    <div class="table-content-header justify-between">
      <div class="table-content-btn-group">
        <table-sort-columns
          :templates="headers"
          :save-key="paymentCustomerHeader"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn :headers="headers" :save-key="paymentCustomerHeader" />
        <page-size-btn
          :current-size="clientsPaymentStore.params.page_size"
          :total-count="clientsPaymentStore?.data?.total_count"
          :page-number="clientsPaymentStore?.data?.page_number"
          @setPageSize="clientsPaymentStore.setPageSize"
        />
        <search-input @change="clientsPaymentStore.search" />
        <excel-btn
          @click="clientsPaymentStore.onDownloadExcelFile"
          :loading="clientsPaymentStore.isExcelFileDownloading"
        />
        <RefreshBtn @click="refresh" :loading="clientsPaymentStore.isLoading" />
      </div>
      <link-component
        v-if="hasAccess2ClientPaymentCancellationList"
        to="/dashboard/cashbox/payment-customers/payment-cancellation"
        :value="t('cash.list_of_payments_allowed_for_change')"
        non-copyable
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="headers"
        :loading="clientsPaymentStore.isLoading"
        :isEmpty="!clientsPaymentStore.data?.items?.length"
        :check="isTableAllChecked"
        :indeterminate="isTableIndeterminate"
        :sorted="clientsPaymentStore.params.order_by"
        @getAllId="getAllPaymentsId"
        @sort="clientsPaymentStore.sortData"
      >
        <template #body>
          <c-tr
            v-for="(data, index) in clientsPaymentStore.data?.items"
            :key="data.id"
          >
            <c-td-no-edit
              v-for="col in headers"
              :key="col"
              :is-checked="col.checked"
              :type="col.key"
            >
              <div v-if="col.key === 'checkbox'">
                <Checkbox
                  :id="data.id.identity"
                  :checked="isTableChecked(data.id?.identity)"
                  @change="onSelectPayment(data.id?.identity)"
                />
              </div>
              <div v-else-if="col.key === 'client_name'">
                <link-component
                  :is-linkable="allowToClientDetail"
                  :value="data[col.key]"
                  :to="\`/clients/about-clients/\${data.client_id}\`"
                />
              </div>
              <div v-else-if="col.type === 'date'">
                <link-component
                  v-if="col.key === 'payment_date'"
                  non-copyable
                  @click="openDetailDialog(data.id)"
                  :value="getFormattedDate(data[col.key])"
                />

                <div v-else>
                  {{ getFormattedDate(data[col.key], "DD.MM.YYYY HH:mm") }}
                </div>
              </div>
              <div
                v-else-if="col.key === 'action'"
                :key="index"
                class="flex gap-2"
              >
                <rounded-icon-btn
                  v-if="
                    data?.cancellation_access_id &&
                    hasAccess2ClientPaymentCancellationDelete
                  "
                  icon="not-active"
                  type="danger"
                  :tooltip="t('cash.closed_access_to_change_payment')"
                  @click="
                    openPaymentCancellationAccessDialog(
                      data.cancellation_access_id,
                    )
                  "
                />
                <rounded-icon-btn
                  v-else-if="hasAccess2ClientPaymentCancellationCreate"
                  icon="access"
                  :tooltip="t('cash.access_to_change_payment')"
                  @click="openPaymentCancellationDialog(data)"
                />
                <rounded-icon-btn
                  v-show="allowToUpdate"
                  type="edit"
                  :iconSize="20"
                  :tooltip="t('edit')"
                  @click="paymentSingleEdit(data.id)"
                />
                <rounded-icon-btn
                  v-show="allowToDelete"
                  type="danger"
                  :tooltip="t('deleted')"
                  @click="deleteDialogId = data.id"
                />
              </div>
              <div v-else-if="col.type === 'boolean'">
                {{ data[col.key] ? t("filters.yes") : t("filters.no") }}
              </div>
              <link-component
                v-else-if="col.key === 'visual_id'"
                :is-linkable="allowToHistory"
                :value="data['visual_id']"
                :to="\`/dashboard/cashbox/payment-customers/history/\${data?.id.identity}\`"
              />
              <div
                v-else-if="col.key === 'balance'"
                class="text-nowrap text-end"
              >
                {{ getFormattedAmount(data[col.key]) }}
                <span>{{ data["balance_base_currency_code"] }}</span>
              </div>
              <div
                v-else-if="col.key === 'payment_amount'"
                class="text-nowrap text-end"
              >
                {{ getFormattedAmount(data[col.key]) }}
                <span>{{ data["payment_base_currency_code"] }}</span>
              </div>
              <div v-else-if="col.type === 'number'">
                {{ getFormattedAmount(data[col.key]) }}
              </div>
              <div v-else>
                {{ data[col.key] }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
        <template #footer>
          <c-tr
            v-if="clientsPaymentStore.data?.items?.length"
            class="border-b-1 border-t-1 bg-neutral-50"
          >
            <c-td-no-edit
              v-for="col in headers"
              :key="col"
              :is-checked="col.checked"
              :type="col.key"
            >
              <div v-if="col.key === 'hidden_visual_id'">
                {{ t("warehouse.common") }}
              </div>
              <div
                class="text-end fs-14 fw-6 text-gray-3"
                v-else-if="col.key === 'payment_amount'"
              >
                {{
                  getFormattedAmount(
                    tableTotalSumma(clientsPaymentStore.data?.items),
                  )
                }}
              </div>
              <div v-else></div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="clientsPaymentStore.params.page_size"
        :total-count="clientsPaymentStore?.data?.total_count"
        :page-number="clientsPaymentStore?.data?.page_number"
      />
      <page-index
        :available-pages="clientsPaymentStore.data?.total_pages"
        :current-page="clientsPaymentStore.data?.page_number"
        @setPage="clientsPaymentStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="deleteDialogId">
      <CommonDeletedDialog
        @onSelectExit="deleteDialogId = null"
        @onSelectDelete="onDeletePayment(deleteDialogId)"
        reason-input
        :isLoading="isDeleteLoading"
        @onInputReason="reasonOfDelete = $event"
      />
    </div>
  </transition>
  <transition name="modal">
    <div v-if="isGroupProcessModalOpen">
      <lazy-dashboard-cashbox-payment-customers-group-process-dialog
        :paymentsIds="clientsPaymentStore.paymentIdentities"
        @closeDialog="onCloseGroupProcessDialog"
      />
    </div>
  </transition>
  <transition name="modal">
    <DashboardCashboxPaymentCustomersPaymentCancellationDialog
      v-if="paymentCancellationItem"
      :item="paymentCancellationItem"
      @closeDialog="closePaymentCancellationDialog"
    />
  </transition>
  <transition name="modal">
    <DashboardCashboxPaymentCustomersPaymentCancellationDeleteAccessDialog
      v-if="paymentCancellationAccessId"
      :access-id="paymentCancellationAccessId"
      @closeDialog="paymentCancellationAccessId = null"
      @refresh="clientsPaymentStore.refresh()"
    />
  </transition>
  <transition name="modal">
    <DashboardCashboxPaymentCustomersAddPaymentDialog
      v-if="editingItemId"
      :payment-id="editingItemId"
      @closeDialog="closePaymentDialog"
      @refresh="clientsPaymentStore.refresh()"
    />
  </transition>
  <transition name="modal">
    <div v-if="openedDetailId">
      <DashboardCashboxPaymentCustomersDetailDialog
        :id="openedDetailId"
        @closeDialog="closeDetailDialog"
      />
    </div>
  </transition>
</template>

<script setup>
import { getFormattedDate } from "~/utils/formatters";
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";
import { paymentCustomerHeader } from "~/variable/column-constants";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";
import { useClientsPaymentStore } from "#imports";

// store
const clientsPaymentStore = useClientsPaymentStore("main");

// props
const props = defineProps({
  allowToCreate: Boolean,
  allowToList: Boolean,
  allowToDelete: Boolean,
  allowToUpdate: Boolean,
  allowToHistory: Boolean,
  allowToClientDetail: Boolean,
});

// state
const { t } = useI18n();
const deleteDialogId = ref(null);
const reasonOfDelete = ref("");
const isDeleteLoading = ref(false);
const isGroupProcessModalOpen = ref(false);
const editingItemId = ref(null);
const openedDetailId = ref(null);
const paymentCancellationItem = ref(null);
const paymentCancellationAccessId = ref(null);
const {
  hasAccess2ClientPaymentCancellationCreate,
  hasAccess2ClientPaymentCancellationList,
  hasAccess2ClientPaymentCancellationDelete,
} = useCashboxAccess();

// hooks

const isTableAllChecked = computed(() => {
  if (!clientsPaymentStore.data?.items?.length) return false;
  return clientsPaymentStore.data?.items?.every((item) =>
    clientsPaymentStore.paymentIdentities.includes(item?.id?.identity),
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !clientsPaymentStore.data?.items?.length)
    return false;
  return clientsPaymentStore.data?.items?.some((item) =>
    clientsPaymentStore.paymentIdentities.includes(item?.id?.identity),
  );
});

const headers = computed(() => {
  if (!props.allowToUpdate)
    return clientsPaymentStore.templates?.filter(
      (header) => header.key !== "checkbox",
    );
  return clientsPaymentStore.templates;
});

// methods

const onChangeTableHeaders = (newValue) => {
  clientsPaymentStore.templates = newValue;
};

const onDeletePayment = async (paymentId) => {
  try {
    isDeleteLoading.value = true;
    await clientsPaymentStore.deletePayment(paymentId, reasonOfDelete.value);
    deleteDialogId.value = null;
  } catch (error) {
  } finally {
    isDeleteLoading.value = false;
  }
};

const getAllPaymentsId = (checked) => {
  if (!checked) {
    clientsPaymentStore.setNullPaymentIdentities();
  } else {
    clientsPaymentStore.paymentIdentities = clientsPaymentStore.data?.items.map(
      (payment) => payment.id?.identity,
    );
  }
};

const isTableChecked = (paymentIdentity) => {
  return !!clientsPaymentStore.paymentIdentities?.find(
    (identity) => paymentIdentity === identity,
  );
};

const onSelectPayment = (paymentIdentity) => {
  if (!isTableChecked(paymentIdentity)) {
    clientsPaymentStore.paymentIdentities.push(paymentIdentity);
  } else {
    clientsPaymentStore.paymentIdentities =
      clientsPaymentStore.paymentIdentities.filter(
        (identity) => identity !== paymentIdentity,
      );
  }
};

const refresh = () => {
  clientsPaymentStore.refresh();
};

const tableTotalSumma = (data) => {
  return data?.reduce((a, b) => a + b?.payment_amount, 0);
};

const closePaymentDialog = async () => {
  editingItemId.value = null;
};

const onCloseGroupProcessDialog = () => {
  clientsPaymentStore.refresh();
  isGroupProcessModalOpen.value = false;
};

const paymentSingleEdit = (id) => {
  editingItemId.value = id?.identity;
};

const openPaymentCancellationDialog = (data) => {
  paymentCancellationItem.value = data;
};

const openPaymentCancellationAccessDialog = (data) => {
  paymentCancellationAccessId.value = data;
};

const closePaymentCancellationDialog = () => {
  paymentCancellationItem.value = null;
};

const openDetailDialog = (id) => {
  openedDetailId.value = id?.identity;
};

const closeDetailDialog = () => {
  openedDetailId.value = null;
};
<\/script>
`;export{e as default};
