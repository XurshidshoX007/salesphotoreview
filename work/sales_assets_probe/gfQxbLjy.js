const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header justify-between">
      <div class="table-content-btn-group">
        <table-sort-columns
          :save-key="customerBalancesHeader"
          :templates="clientsBalancesStore.headersForClient"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="clientsBalancesStore.headersForClient"
          :save-key="customerBalancesHeader"
        />
        <page-size-btn
          :current-size="clientsBalancesStore.tableForClientParams.page_size"
          :total-count="clientsBalancesStore?.data?.total_count"
          :page-number="clientsBalancesStore?.data?.page_number"
          @setPageSize="clientsBalancesStore.setPageSize"
        />
        <search-input @change="clientsBalancesStore.search" />
        <excel-btn
          @click="clientsBalancesStore.onDownloadExcelFile"
          :loading="clientsBalancesStore.isExcelFileDownloading"
        />
        <RefreshBtn @click="refresh" :loading="clientsBalancesStore.loading" />
      </div>
      <m-btn
        v-if="hasAccess2CreatePayment"
        v-show="clientsBalancesStore.clientsIds.length > 0"
        group="success"
        @click="onOpenArrivalModal"
        >{{ t("orders.pay") }}</m-btn
      >
    </div>
    <div class="table-content-body">
      <data-table
        :headers="clientsBalancesStore.headersForClient"
        :loading="clientsBalancesStore.loading"
        :check="isTableAllChecked"
        :indeterminate="isTableIndeterminate"
        :sorted="clientsBalancesStore.tableForClientParams.order_by"
        :isEmpty="!clientsBalancesStore.data?.items?.length"
        @sort="clientsBalancesStore.sortDataClientBalance"
        @getAllId="getAllClientsId"
      >
        <template #body>
          <template
            v-for="data in clientsBalancesStore.data?.items"
            :key="data?.client_id"
          >
            <c-tr :isChecked="isTableChecked(data.client_id)">
              <c-td-no-edit
                v-for="key in clientsBalancesStore.headersForClient"
                :key="key.key"
                :header-key="key.key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.key === 'checkbox'">
                  <Checkbox
                    :id="data.id"
                    :checked="isTableChecked(data.client_id)"
                    @change="onSelectClient(data.client_id)"
                  />
                </div>
                <link-component
                  v-else-if="key.key === 'visual_id'"
                  :to="
                    AppRoutes.cashbox.child.customerBalancesDetail.replace(
                      ':id',
                      data?.client_id,
                    )
                  "
                  :is-linkable="hasAccess2ClientBalanceDetail"
                  :value="data[key.key]"
                  target
                />
                <div v-else-if="key.key === 'agent_names'">
                  <tags-component :data="data['agent_arr']" />
                </div>
                <div
                  v-else-if="key.isDynamic && key.dynamicConfig"
                  :class="key.right && 'text-end'"
                >
                  {{ getDynamicValue(data, key.dynamicConfig) }}
                </div>
                <div v-else-if="key.type === 'number'">
                  {{ getFormattedAmount(data[key.key]) }}
                </div>
                <div
                  v-else-if="key.key === 'term_date'"
                  class="pt-2 check text-red underline cursor-pointer"
                  @click="
                    onOpenChangeDeadline(
                      data?.client_id,
                      data?.client_name,
                      data?.term_date,
                    )
                  "
                >
                  {{ getFormattedDate(data[key.key]) }}
                </div>
                <div v-else-if="key.type === 'date'">
                  {{ getFormattedDate(data[key.key]) }}
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
        :current-size="clientsBalancesStore.tableForClientParams.page_size"
        :total-count="clientsBalancesStore?.data?.total_count"
        :page-number="clientsBalancesStore?.data?.page_number"
        @setPageSize="clientsBalancesStore.setPageSize"
      />
      <page-index
        :available-pages="clientsBalancesStore.data?.total_pages"
        :current-page="clientsBalancesStore.data?.page_number"
        @setPage="clientsBalancesStore.setPage"
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
  <transition name="modal">
    <div v-if="arrivalCheckoutModal">
      <lazy-dashboard-cashbox-customer-balances-arrival-checkout-dialog
        @closeDialog="arrivalCheckoutDialog"
      />
    </div>
  </transition>
</template>

<script setup>
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { customerBalancesHeader } from "~/variable/column-constants";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";
import { AppRoutes } from "~/variable/routes";
import {
  getDynamicValue,
  getFormattedAmount,
  getFormattedDate,
} from "#imports";

// store
const clientsBalancesStore = useClientsBalancesStore("main");

// states
const { hasAccess2CreatePayment, hasAccess2ClientBalanceDetail } =
  useCashboxAccess();
const { t } = useI18n();
const arrivalCheckoutModal = ref(false);

const changeDeadlineInfo = ref({
  clientId: "",
  clientName: "",
  currentTerm: "",
});

// hooks
const isTableAllChecked = computed(() => {
  if (!clientsBalancesStore.data?.items.length) return false;
  return clientsBalancesStore.data?.items.every((item) =>
    clientsBalancesStore.clientsIds.includes(item.client_id),
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !clientsBalancesStore.data?.items.length)
    return false;
  return clientsBalancesStore.data?.items.some((item) =>
    clientsBalancesStore.clientsIds.includes(item.client_id),
  );
});

onMounted(async () => await clientsBalancesStore.getClientsData());

// methods
const isTableChecked = (client_id) => {
  return !!clientsBalancesStore.clientsIds.find((id) => client_id === id);
};

const getAllClientsId = (checked) => {
  if (!checked) {
    clientsBalancesStore.setNullMultipleDialog();
  } else {
    clientsBalancesStore.clientsIds = clientsBalancesStore.data?.items.map(
      (client) => client.client_id,
    );
  }
};

const onSelectClient = (client_id) => {
  if (!isTableChecked(client_id)) {
    clientsBalancesStore.clientsIds.push(client_id);
  } else {
    clientsBalancesStore.clientsIds = clientsBalancesStore.clientsIds.filter(
      (id) => id !== client_id,
    );
  }
};

const onChangeTableHeaders = (newValue) => {
  clientsBalancesStore.headersForClient = newValue;
};

const onOpenChangeDeadline = (clientId, clientName, currentTerm) => {
  if (currentTerm) {
    changeDeadlineInfo.value.clientId = clientId;
    changeDeadlineInfo.value.clientName = clientName;
    changeDeadlineInfo.value.currentTerm = currentTerm;
  }
};

function onCloseChangeDeadline() {
  changeDeadlineInfo.value.clientId = "";
  changeDeadlineInfo.value.clientName = "";
  changeDeadlineInfo.value.currentTerm = "";
}

const refresh = async () => {
  await clientsBalancesStore.refreshClientsData();
};

const onOpenArrivalModal = () => {
  if (clientsBalancesStore.clientsIds.length) {
    arrivalCheckoutModal.value = true;
  } else {
    notify({ title: "Сначала выберите клиента!", type: "error" });
    return;
  }
};

function arrivalCheckoutDialog() {
  arrivalCheckoutModal.value = false;
}
<\/script>
`;export{e as default};
