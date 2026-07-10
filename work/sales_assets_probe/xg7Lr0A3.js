const n=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header justify-between">
        <div class="table-content-btn-group">
          <table-sort-columns
            :save-key="customerBalancesTransactionHeader"
            :templates="clientsBalancesStore.transactionHeaders"
            @onChangeTableHeaders="onChangeTableHeaders"
          />
          <ShowHideColumn
            :headers="clientsBalancesStore.transactionHeaders"
            :save-key="customerBalancesTransactionHeader"
          />
          <page-size-btn
            :current-size="clientsBalancesStore.paramsTransaction.page_size"
            :total-count="clientsBalancesStore.transactions?.total_count"
            :page-number="clientsBalancesStore.transactions?.page_number"
            @setPageSize="onSetPageSize"
          />
          <search-input @change="onSearch" />
          <excel-btn
            :loading="isExcelFileDownloading"
            @click="onDownloadExcelFile"
          />
          <RefreshBtn
            @click="refresh"
            :loading="clientsBalancesStore.loadingTransaction"
          />
        </div>
        <Checkbox
          id="hide-total-block=secret"
          :title="t('dashboard.show_system_transaction')"
          :checked="include_system_transactions"
          @change="onSystemCheckbox"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="clientsBalancesStore.transactionHeaders"
          :sorted="clientsBalancesStore.paramsTransaction.order_by"
          :loading="clientsBalancesStore.loadingTransaction"
          :isEmpty="!clientsBalancesStore.transactions?.items?.length"
          @sort="onSortData"
        >
          <template #body>
            <template
              v-for="data in clientsBalancesStore.transactions?.items"
              :key="data?.id"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in clientsBalancesStore.transactionHeaders"
                  :key="key"
                  :is-checked="key.checked"
                  :header-key="key.key"
                  :class="{ 'border-r-1': key.borderX }"
                  :type="key.type"
                >
                  <div v-if="key.type === 'date'">
                    {{ getFormattedDate(data[key.key], "DD.MM.YYYY HH:mm") }}
                  </div>
                  <div v-else-if="key.key === 'type_id'">
                    <link-component
                      :to="
                        getLinkPathByNavigationType(
                          data?.navigation_type,
                          data?.navigation_parameter_id,
                        )
                      "
                      target
                      :is-linkable="isLinkable(data?.navigation_type)"
                    >
                      {{ data["type_name"] }}
                      <span v-if="data['visual_id']"
                        >({{ data["visual_id"] }})</span
                      >
                    </link-component>
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
          :current-size="clientsBalancesStore.paramsTransaction.page_size"
          :total-count="clientsBalancesStore.transactions?.total_count"
          :page-number="clientsBalancesStore.transactions?.page_number"
        />
        <page-index
          :available-pages="clientsBalancesStore.transactions?.total_pages"
          :current-page="clientsBalancesStore.transactions?.page_number"
          @setPage="onSetPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getFormattedDate } from "~/utils/formatters";
import { useI18n } from "vue-i18n";
import { useOrdersAccess } from "~/composables/access/orders/orders";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";
import { customerBalancesTransactionHeader } from "~/variable/column-constants";

// store
const clientsBalancesStore = useClientsBalancesStore("main");

// states
const { hasAccess2Detail: hasAccess2OrderDetail } = useOrdersAccess();
const { hasAccess2ClientPaymentHistory } = useCashboxAccess();
const { t } = useI18n();
const isExcelFileDownloading = ref<boolean>(false);
const include_system_transactions = ref(false);
// props
const props = defineProps<{
  subDepositOwnerIds: string[];
  isActive: boolean;
}>();

// methods

onMounted(async () => {
  if (props.isActive) {
    await clientsBalancesStore.getClientTransactions();
  }
});

watch(
  () => props.subDepositOwnerIds,
  (newSubDepositOwnerIds) => {
    if (props.isActive) {
      clientsBalancesStore.paramsTransaction.sub_deposit_owner_id_arr =
        newSubDepositOwnerIds;
      clientsBalancesStore.paramsTransaction.page = 1;
    }
  },
);

const onSystemCheckbox = (isChecked: boolean) => {
  include_system_transactions.value = isChecked;
  clientsBalancesStore.paramsTransaction.include_system_transactions =
    isChecked;
  clientsBalancesStore.paramsTransaction.page = 1;
};
const onChangeTableHeaders = (param: any) => {
  clientsBalancesStore.transactionHeaders = param;
};

const onSearch = (value: string) => {
  clientsBalancesStore.paramsTransaction.search = value;
};

const refresh = async () => {
  await clientsBalancesStore.getClientTransactions();
};

const onDownloadExcelFile = async () => {
  isExcelFileDownloading.value = true;
  await clientsBalancesStore.onDownloadTransactionsExcelFile(
    clientsBalancesStore.transactionHeaders,
    clientsBalancesStore.paramsTransaction,
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

  clientsBalancesStore.paramsTransaction.order_by = value;
};

const onSetPage = (value: number) => {
  clientsBalancesStore.paramsTransaction.page = value;
};

const onSetPageSize = (pageSize: number) => {
  clientsBalancesStore.paramsTransaction.page_size = pageSize;
};

const isLinkable = (navigationType: number) => {
  switch (navigationType) {
    case 1:
      return hasAccess2OrderDetail;
    case 2:
      return hasAccess2ClientPaymentHistory;
    default:
      return false;
  }
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

defineExpose({
  refresh,
});
<\/script>
`;export{n as default};
