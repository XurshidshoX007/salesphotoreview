const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header justify-between">
        <div class="table-content-btn-group">
          <table-sort-columns
            :save-key="paymentBalancesTransactionHeader"
            :templates="clientsBalancesStore.transactionHeaders"
            @onChangeTableHeaders="onChangeTableHeaders"
          />
          <ShowHideColumn
            :headers="clientsBalancesStore.paymentHeaders"
            :save-key="paymentBalancesTransactionHeader"
          />
          <page-size-btn
            :current-size="
              clientsBalancesStore.paramsOrderAndPAyments.page_size
            "
            :total-count="transactionsDetail?.total_count"
            :page-number="transactionsDetail?.page_number"
            @setPageSize="onSetPageSize"
          />
          <search-input
            @change="onSearch"
            :value="clientsBalancesStore.paramsOrderAndPAyments.search"
          />
          <excel-btn
            :loading="isExcelFileDownloading"
            @click="onDownloadExcelFile"
          />
          <RefreshBtn @click="refresh" :loading="isLoading" />
        </div>
        <div class="flex items-center gap-x-2">
          <d-input-date-picker
            without-time
            :value="dateTimeFrom"
            without-default
            :title="t('column.date_from')"
            @change="changeDateRange($event, 'from')"
          />
          <d-input-date-picker
            without-time
            :value="dateTimeTo"
            without-default
            :title="t('column.date_to')"
            @change="changeDateRange($event, 'to')"
          />
        </div>
      </div>
      <div class="table-content-body">
        <data-table
          :headers="clientsBalancesStore.paymentHeaders"
          :sorted="clientsBalancesStore.paramsOrderAndPAyments.order_by"
          :loading="isLoading"
          :isEmpty="!transactionsDetail?.items?.length"
          @sort="onSortData"
        >
          <template #body>
            <template v-for="data in transactionsDetail?.items" :key="data?.id">
              <c-tr>
                <c-td-no-edit
                  v-for="key in clientsBalancesStore.paymentHeaders"
                  :key="key"
                  :is-checked="key.checked"
                  :header-key="key.key"
                  :class="{ 'border-r-1': key.borderX }"
                  :type="key.type"
                >
                  <div v-if="key.type === 'date'">
                    {{ getFormattedDate(data[key.key], "DD.MM.YYYY HH:mm") }}
                  </div>
                  <div v-else-if="key.key === 'debt_amount' && data[key.key]">
                    -{{ getFormattedAmount(data[key.key]) }}
                  </div>
                  <div v-else-if="key.key === 'type_id'">
                    <div v-if="data?.type_id === 1">
                      <link-component
                        v-if="data['order_type_name']"
                        :to="\`/orders/orders/details?id=\${data.id}&&type=\${data.type_id}\`"
                        :value="\` \${data['order_type_name']}\`"
                        target
                        :is-linkable="hasAccess2OrderDetail"
                        nonCopyable
                      >
                        <span v-if="data['visual_id']"
                          >({{ data["visual_id"] }})</span
                        >
                      </link-component>
                    </div>
                    <div v-else>
                      <link-component
                        :to="
                          getLinkPathByNavigationType(
                            data?.navigation_type,
                            data?.navigation_parameter_id,
                          )
                        "
                        target
                      >
                        {{ data["type_name"] }}
                        <span v-if="data['visual_id']"
                          >({{ data["visual_id"] }})</span
                        >
                      </link-component>
                    </div>
                  </div>
                  <div v-else-if="key.key === 'operation_type_id'">
                    {{ data["operation_type_name"] }}
                  </div>
                  <div v-else-if="key.type === 'number'">
                    {{ getFormattedAmount(data[key.key]) }}
                  </div>
                  <div v-else-if="key.type === 'boolean'">
                    {{ data[key.key] ? "Есть" : "Нет" }}
                  </div>
                  <div v-else-if="key.key === 'action'">
                    <div v-if="data.type_id === 2" class="flex gap-2">
                      <rounded-icon-btn
                        v-show="hasAccess2UpdateClientPayment"
                        type="edit"
                        :iconSize="20"
                        :tooltip="t('edit')"
                        @click="editOpenModal(data.type_id, data.id)"
                      />
                      <rounded-icon-btn
                        v-show="hasAccess2DeleteClientPayment"
                        type="danger"
                        :tooltip="t('deleted')"
                        @click="
                          deletedOpenModal(
                            data.type_id,
                            data.navigation_parameter_id,
                          )
                        "
                      />
                    </div>
                    <div
                      v-else-if="data.type_id === 3"
                      class="flex gap-2 justify-end"
                    >
                      <rounded-icon-btn
                        v-show="hasAccess2UpdateClientExpensePayment"
                        type="edit"
                        :iconSize="20"
                        :tooltip="t('edit')"
                        @click="editOpenModal(data.type_id, data.id)"
                      />
                      <rounded-icon-btn
                        v-show="hasAccess2DeletedClientExpensePayment"
                        type="danger"
                        :tooltip="t('deleted')"
                        @click="
                          deletedOpenModal(
                            data.type_id,
                            data.navigation_parameter_id,
                          )
                        "
                      />
                    </div>
                  </div>
                  <div v-else>
                    {{ data[key.key] }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="clientsBalancesStore.paramsOrderAndPAyments.page_size"
          :total-count="transactionsDetail?.total_count"
          :page-number="transactionsDetail?.page_number"
        />
        <page-index
          :available-pages="transactionsDetail?.total_pages"
          :current-page="transactionsDetail?.page_number"
          @setPage="onSetPage"
        />
      </div>
      <transition name="modal">
        <DashboardCashboxPaymentCustomersAddPaymentDialog
          v-if="addPaymentModalOpen"
          :payment-id="setSelectedPaymentId"
          :modal-name="t('cash.edit_payment')"
          title-color-for-header="#23C00A"
          @closeDialog="closePaymentDialog"
          @refresh="refresh"
        />
      </transition>
      <transition name="modal">
        <div v-if="deleteDialogId">
          <CommonDeletedDialog
            reason-input
            :isLoading="isDeleteLoading"
            @onInputReason="reasonOfDelete = $event"
            @onSelectExit="deleteDialogId = null"
            @onSelectDelete="onDeletePayment(deleteDialogId)"
          />
        </div>
      </transition>
      <transition name="modal">
        <div v-if="selectedDebt">
          <ClientsExpensePaymentClientExpensesDialog
            :modal-name="t('cash.edit_debt')"
            :debt-id="selectedDebt"
            title-color-for-header="#D10505"
            @refresh="refresh"
            @closeDialog="selectedDebt = null"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ClientsClientTransactionsModel } from "~/interfaces/api/clients/clients-client-transactions-model";
import type { AppResponse } from "~/interfaces/api/response/app-response";
import { useI18n } from "vue-i18n";
import { getFormattedDate } from "~/utils/formatters";
import { getFormattedAmount } from "~/utils/filter";
import { useOrdersAccess } from "~/composables/access/orders/orders";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";
import { paymentBalancesTransactionHeader } from "~/variable/column-constants";

// store
const clientsBalancesStore = useClientsBalancesStore("main");

// states
const { hasAccess2Detail: hasAccess2OrderDetail } = useOrdersAccess();
const {
  hasAccess2DeleteClientPayment,
  hasAccess2UpdateClientPayment,
  hasAccess2DeletedClientExpensePayment,
  hasAccess2UpdateClientExpensePayment,
} = useCashboxAccess();
const { t } = useI18n();
const transactionsDetail =
  ref<
    AppResponse<ClientsClientTransactionsModel & { cash_box_name: string }>
  >();
const dateTimeFrom = ref<string | null>("");
const dateTimeTo = ref<string | null>("");
const setSelectedPaymentId = ref<string | null>(null);
const addPaymentModalOpen = ref<boolean>(false);
const deleteDialogId = ref<string | null>(null);
const deleteDialogPaymentType = ref<string | null>(null);
const isDeleteLoading = ref<boolean>(false);
const reasonOfDelete = ref<string>("");
const selectedDebt = ref<string | null>(null);

// props
const props = defineProps<{
  subDepositOwnerIds: string[];
  isActive: boolean;
}>();

const isExcelFileDownloading = ref<boolean>(false);
const isLoading = ref<boolean>(false);

// hooks
onMounted(async () => {
  clientsBalancesStore.paramsOrderAndPAyments.agent_id_arr = [
    ...props.subDepositOwnerIds,
  ];
});

watch(
  clientsBalancesStore.paramsOrderAndPAyments,
  async () => await getTransactions(),
);

watch(
  () => props.subDepositOwnerIds,
  (newSubDepositOwnerIds) => {
    if (props.isActive) {
      clientsBalancesStore.paramsOrderAndPAyments.agent_id_arr =
        newSubDepositOwnerIds;
      clientsBalancesStore.paramsOrderAndPAyments.page = 1;
    }
  },
);

watch(
  () => transactionsDetail.value?.total_pages,
  (value) => {
    if (value && clientsBalancesStore.paramsOrderAndPAyments.page > value) {
      clientsBalancesStore.paramsOrderAndPAyments.page = value;
    }
  },
);

// methods
const deletePayment = (id: string, type: number) => {
  deleteDialogId.value = id;
  deleteDialogPaymentType.value = type;
};

const changeDateRange = (event: any, type: string) => {
  if (type === "from") {
    dateTimeFrom.value = event;
    clientsBalancesStore.paramsOrderAndPAyments.date_range = {
      ...clientsBalancesStore.paramsOrderAndPAyments.date_range,
      from_value: event,
    };
  } else {
    dateTimeTo.value = event;
    clientsBalancesStore.paramsOrderAndPAyments.date_range = {
      ...clientsBalancesStore.paramsOrderAndPAyments.date_range,
      to_value: event,
    };
  }
  clientsBalancesStore.paramsOrderAndPAyments.page = 1;
};

const onChangeTableHeaders = (param: any) => {
  clientsBalancesStore.paymentHeaders = param;
};

const getTransactions = async () => {
  isLoading.value = true;
  transactionsDetail.value = await clientsBalancesStore.getOrderAndPayment(
    clientsBalancesStore.paramsOrderAndPAyments,
  );
  isLoading.value = false;
};

const onSearch = (value: string) => {
  clientsBalancesStore.paramsOrderAndPAyments.search = value;
};

const refresh = async () => {
  await getTransactions();
};

const onDownloadExcelFile = async () => {
  isExcelFileDownloading.value = true;
  await clientsBalancesStore.onDownloadTransactionsCommonExcelFile(
    clientsBalancesStore.paymentHeaders,
    clientsBalancesStore.paramsOrderAndPAyments,
  );
  isExcelFileDownloading.value = false;
};

const onSortData = (
  value: {
    field?: string;
    is_asc?: boolean;
  } | null,
) => {
  if (value?.field === "order_type_name") value.field = "order_type";

  clientsBalancesStore.paramsOrderAndPAyments.order_by = value;
};

const onSetPage = (value: number) => {
  clientsBalancesStore.paramsOrderAndPAyments.page = value;
};

const onSetPageSize = (pageSize: number) => {
  clientsBalancesStore.paramsOrderAndPAyments.page_size = pageSize;
};

const paymentSingleEdit = (id: string) => {
  setSelectedPaymentId.value = id;
  addPaymentModalOpen.value = true;
};

const closePaymentDialog = async () => {
  setSelectedPaymentId.value = null;
  addPaymentModalOpen.value = false;
};

const onDeletePayment = async (paymentId: string) => {
  isDeleteLoading.value = true;
  const payment = {
    identity: paymentId,
    payment_type: deleteDialogPaymentType.value,
  };
  let responseDeleted = null;
  if (deleteDialogPaymentType.value === 1) {
    responseDeleted = await clientsBalancesStore.deletePayment(
      payment,
      reasonOfDelete.value,
    );
  } else {
    responseDeleted = await clientsBalancesStore.deleteDebt(
      deleteDialogId.value,
      reasonOfDelete.value,
    );
  }

  if (responseDeleted !== "error") {
    await getTransactions();
    deleteDialogId.value = null;
  }
  isDeleteLoading.value = false;
};

const getLinkPathByNavigationType = (
  navigationType: number,
  navigationParameterId: string,
) => {
  switch (navigationType) {
    case 1:
      return {
        path: "/orders/orders/details",
        query: { id: navigationParameterId },
        target: "_blank",
      };
    case 2:
      return \`/dashboard/cashbox/payment-customers/history/\${navigationParameterId}\`;
    default:
      break;
  }
};

const editOpenModal = (type: number, id: string) => {
  if (type === 2) {
    paymentSingleEdit(id);
  } else {
    selectedDebt.value = id;
  }
};

const deletedOpenModal = (type: number, id: string) => {
  if (type === 2) {
    deletePayment(id, 1);
  } else {
    deletePayment(id, 3);
  }
};
<\/script>
`;export{e as default};
