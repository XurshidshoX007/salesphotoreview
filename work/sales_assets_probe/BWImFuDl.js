const e=`<template>
  <div class="flex flex-col gap-4">
    <ClientsAboutClientsFilterCard @clear-fetched-tabs="clearFetchedTabs" />
    <div class="flex gap-4 flex-wrap">
      <div
        class="px-4 py-3 bg-rg border-grey flex justify-center item-center rounded-large"
      >
        <div class="flex items-center gap-1">
          <div class="text-[#A8AEA6]">{{ t("orders.delivered") }}:</div>
          <div class="text-[20px] font-[600]">
            {{ getFormattedAmount(props.clientOrderCount) }}
          </div>
        </div>
      </div>
      <div
        class="px-4 py-3 rounded-large bg-rg1 border-grey flex justify-center item-center"
      >
        <div class="flex items-center gap-1">
          <div class="text-[#A8AEA6]">{{ t("clients.sales_amount") }}:</div>
          <div class="text-[20px] font-[600]">
            {{ getFormattedAmount(props.clientSalesAmount?.amount) }}
            {{ props.clientSalesAmount?.base_currency?.name }}
          </div>
        </div>
      </div>
    </div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :templates="clientsOrdersStore.templates"
          :save-key="orderInClientDetailHeader"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="clientsOrdersStore.templates"
          :save-key="orderInClientDetailHeader"
        />
        <page-size-btn
          :current-size="clientsOrdersStore.params.page_size"
          @setPageSize="clientsOrdersStore.setPageSize"
        />
        <search-input @change="clientsOrdersStore.search" />
        <excel-btn
          @click="clientsOrdersStore.onDownloadExcelFile(clientName)"
          :loading="clientsOrdersStore.isExcelFileDownloading"
        />
        <RefreshBtn @click="refresh" :loading="clientsOrdersStore.loading" />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="clientsOrdersStore.templates"
          :loading="clientsOrdersStore.loading"
          @sort="clientsOrdersStore.sortData"
          :isEmpty="!clientsOrdersStore.data?.items?.length"
          :sorted="clientsOrdersStore.params.order_by"
        >
          <template #body>
            <c-tr
              v-for="(data, index) in clientsOrdersStore.data?.items"
              :key="data.order_id"
            >
              <c-td-no-edit
                v-for="key in clientsOrdersStore.templates"
                :key="key"
                :is-checked="key.checked"
              >
                <div class="py-2">
                  <link-component
                    v-if="key.key === 'visual_id'"
                    :to="{
                      path: '/orders/orders/details/',
                      query: { id: data.order_id },
                    }"
                    :value="data[key.key]"
                    :is-linkable="hasAccess2Detail"
                  />

                  <div v-else-if="key.key === 'order_date'">
                    {{ getFormattedDate(data[key.key], "DD.MM.YYYY") }}
                  </div>
                  <div
                    v-else-if="typeof data[key.key] === 'number'"
                    class="text-end"
                  >
                    {{ getFormattedAmount(data[key.key]) }}
                  </div>
                  <div
                    v-else-if="typeof data[key.key] === 'boolean'"
                    class="text-end"
                  >
                    {{ data[key.key] ? "Есть" : "Нет" }}
                  </div>
                  <div
                    v-else-if="key.key === 'status'"
                    v-show="key.checked"
                    class="relative"
                  >
                    <StatusBtnForTable
                      :status-data="getStatusDataByName(data[key.key])"
                      :data-id="data?.order_id"
                      :readonly="true"
                    />
                  </div>
                  <div v-else>
                    {{ data[key.key] }}
                  </div>
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="clientsOrdersStore.params.page_size"
          :total-count="clientsOrdersStore?.data?.total_count"
          :page-number="clientsOrdersStore?.data?.page_number"
        />
        <page-index
          :available-pages="clientsOrdersStore.data?.total_pages"
          :current-page="clientsOrdersStore.data?.page_number"
          @setPage="clientsOrdersStore.setPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { getLibConstantsByKey } from "~/utils/local-storage";
import { getFormattedDate } from "~/utils/formatters";
import { useI18n } from "vue-i18n";
import { useOrdersAccess } from "~/composables/access/orders/orders";
import { useClientsOrdersStore } from "~/stores/clients/clients/clients-orders.store";
import { orderInClientDetailHeader } from "~/variable/column-constants";

// props
const props = defineProps({
  clientOrderCount: Number,
  clientSalesAmount: Number,
  clientName: String,
});

// store
const clientsOrdersStore = useClientsOrdersStore("main");

// emits
const emit = defineEmits(["clearFetchedTabs"]);

// State
const { t } = useI18n();
const { hasAccess2Detail } = useOrdersAccess();
const route = useRoute();
const tabNumber = ref(5);

// hooks
onMounted(async () => {
  clientsOrdersStore.statusConstants =
    await getLibConstantsByKey("OrderStatus");
  clientsOrdersStore.params.client_id = route.params.id;
  await clientsOrdersStore._loadData();
  await clientsOrdersStore.getClientAmount();
});

// Methods
const onChangeTableHeaders = (param) => {
  clientsOrdersStore.templates = param;
};

const getStatusDataByName = (name) => {
  return clientsOrdersStore.statusConstants?.find(
    (status) => status.name === name,
  );
};

const clearFetchedTabs = async () => {
  emit("clearFetchedTabs", tabNumber.value);
  await clientsOrdersStore._loadData();
  await clientsOrdersStore.getClientAmount();
};

const refresh = async () => {
  await clientsOrdersStore.refresh();
};
<\/script>

<style scoped>
.bg-rg {
  background: rgba(22, 117, 6, 0.04);
}

.bg-rg1 {
  background: rgba(59, 7, 99, 0.04);
}
</style>
`;export{e as default};
