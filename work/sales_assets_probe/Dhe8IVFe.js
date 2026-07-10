const e=`<template>
  <div>
    <flex-col class="gap-4">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <page-title20 :title="t('clients.debt')" />
        <Checkbox
          id="hide-total-block=secret"
          :title="t('dashboard.show_system_transaction')"
          :checked="showSystemTransactions"
          @change="onSystemCheckbox"
        />
      </div>
      <div class="table-content-container">
        <div class="table-content-header justify-between">
          <div class="table-content-btn-group">
            <table-sort-columns
              :save-key="debtsInClientDetailHeader"
              :templates="clientDebtsStore.headers"
              @onChangeTableHeaders="onChangeHeaders"
            />
            <ShowHideColumn
              :headers="clientDebtsStore.headers"
              :save-key="debtsInClientDetailHeader"
            />
            <page-size-btn
              :current-size="clientDebtsStore.params.page_size"
              @setPageSize="clientDebtsStore.setPageSize"
            />
            <search-input @change="clientDebtsStore.search" />
            <excel-btn
              @click="clientDebtsStore.onDownloadExcelFile(clientName)"
              :loading="clientDebtsStore.isExcelFileDownloading"
            />
            <RefreshBtn
              @click="clientDebtsStore.refresh"
              :loading="clientDebtsStore.isLoading"
            />
          </div>
          <div class="w-52">
            <dropdowns-by-filter-states
              :filter-states="paymentFilterStates"
              @onOpenDropdown="onOpenDropdown"
            />
          </div>
        </div>
        <div class="table-content-body">
          <data-table
            :headers="clientDebtsStore.headers"
            :loading="clientDebtsStore.isLoading"
            :is-empty="!clientDebtsStore?.data?.items?.length"
            @sort="clientDebtsStore.sort"
            :sorted="clientDebtsStore.params.order_by"
          >
            <template #body>
              <c-tr
                v-for="data in clientDebtsStore.data?.items"
                :key="data?.id"
              >
                <c-td-no-edit
                  v-for="key in clientDebtsStore.headers"
                  :key="key.key"
                  :is-checked="key.checked"
                  :header-key="key.key"
                  :type="key?.type"
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
                  <div
                    v-else-if="typeof data[key.key] === 'boolean'"
                    class="text-end"
                  >
                    {{ data[key.key] ? "Есть" : "Нет" }}
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
            :current-size="clientDebtsStore.params.page_size"
            :page-number="clientDebtsStore?.data?.page_number"
            :total-count="clientDebtsStore?.data?.total_count"
          />
          <page-index
            :available-pages="clientDebtsStore.data?.total_pages"
            :current-page="clientDebtsStore.data?.page_number"
            @setPage="clientDebtsStore.setPage"
          />
        </div>
      </div>
    </flex-col>
    <transition name="modal">
      <div v-if="selectedPayment">
        <DashboardCashboxPaymentCustomersAddPaymentDialog
          :clientId="route.params.id"
          :currency-id="selectedPayment"
          :modal-name="t('clients.payment')"
          @closeDialog="selectedPayment = null"
          @refresh="refresh"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { Template } from "~/interfaces/ui/template";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";
import { useOrdersAccess } from "~/composables/access/orders/orders";
import { getPaymentCurrencyDropdownData } from "~/utils/payment-currency";
import { debtsInClientDetailHeader } from "~/variable/column-constants";

// store
const clientsBalancesStore = useClientsBalancesStore("main");
const clientDebtsStore = useClientsDebtsStore("main");

// props
const props = defineProps({
  clientName: String,
});

// emit

const emit = defineEmits<{
  (e: "updatePaymentCards"): void;
}>();

// State
const { hasAccess2ClientPaymentHistory } = useCashboxAccess();
const { hasAccess2Detail: hasAccess2OrderDetail } = useOrdersAccess();
const { t } = useI18n();
const route = useRoute();
const clientId = ref(route.params.id);
const selectedPayment = ref<string | null>(null);
const showSystemTransactions = ref(false);
const currencies = ref<DropdownItemsModelByType<CurrencyDropdownModel>>();

const paymentFilterStates = ref([
  {
    name: t("orders.add_payment"),
    key: "currencies",
    isSingleSelect: true,
    get data() {
      return getPaymentCurrencyDropdownData(currencies.value, [
        selectedPayment.value,
      ]);
    },
    get getSelectedData() {
      return selectedPayment.value;
    },
    set setSelectedData(value: string) {
      selectedPayment.value = value;
    },
  },
]);

// hooks
onMounted(async () => {
  clientDebtsStore.params.client_id = clientId.value;
});

// Methods
const onChangeHeaders = (newHeaders: Template[]) => {
  clientDebtsStore.headers = newHeaders;
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

const onOpenDropdown = async (state: string, value: unknown) => {
  if (state === "currencies" && !currencies.value) {
    await getCurrencies();
  }
};

const getCurrencies = async () => {
  currencies.value = await clientsBalancesStore.getCurrencies();
};

const onSystemCheckbox = (isChecked: boolean) => {
  showSystemTransactions.value = isChecked;
  clientDebtsStore.params.include_system_transactions = isChecked;
};

const refresh = async () => {
  await clientDebtsStore.refresh;
  emit("updatePaymentCards");
};
<\/script>
`;export{e as default};
