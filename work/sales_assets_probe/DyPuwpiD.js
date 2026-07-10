const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header justify-between">
      <div class="table-content-btn-group">
        <table-sort-columns
          :save-key="agentBalancesHeader"
          :templates="clientsBalancesStore.headersForAgentBalance"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="clientsBalancesStore.headersForAgentBalance"
          :save-key="agentBalancesHeader"
        />
        <page-size-btn
          :current-size="clientsBalancesStore.tableForAgentParams.page_size"
          :total-count="clientsBalancesStore?.dataForAgent?.total_count"
          :page-number="clientsBalancesStore?.dataForAgent?.page_number"
          @setPageSize="clientsBalancesStore.setPageSizeAgentBalance"
        />
        <search-input @change="clientsBalancesStore.searchAgentBalance" />
        <excel-btn
          @click="clientsBalancesStore.onDownloadExcelFileAgentBalance"
          :loading="clientsBalancesStore.isAgentBalanceExcelFileDownloading"
        />
        <RefreshBtn
          @click="refresh"
          :loading="clientsBalancesStore.loadingForAgent"
        />
      </div>
      <m-btn
        v-if="hasAccess2CreatePayment"
        group="success"
        v-show="clientsBalancesStore.agentsIds.length > 0"
        @click="onOpenArrivalModal"
        >{{ t("orders.pay") }}</m-btn
      >
    </div>
    <div class="table-content-body">
      <data-table
        :headers="clientsBalancesStore.headersForAgentBalance"
        :loading="clientsBalancesStore.loadingForAgent"
        :sorted="clientsBalancesStore.tableForAgentParams.order_by"
        :isEmpty="!clientsBalancesStore.dataForAgent?.items?.length"
        :check="isTableAllChecked"
        :indeterminate="isTableIndeterminate"
        @sort="clientsBalancesStore.sortDataAgentBalance"
        @getAllId="getAllClientsId"
      >
        <template #body>
          <c-tr
            v-for="(data, index) in clientsBalancesStore.dataForAgent?.items"
            :key="index"
          >
            <c-td-no-edit
              v-for="key in clientsBalancesStore.headersForAgentBalance"
              :key="key"
              :header-key="key.key"
              :is-checked="key.checked"
              :type="key.type"
            >
              <div v-if="key.key === 'checkbox'">
                <Checkbox
                  :id="getByAgentUniqueId(data)"
                  :checked="isTableChecked(getByAgentUniqueId(data))"
                  @change="onSelectClient(getByAgentUniqueId(data))"
                />
              </div>
              <link-component
                v-else-if="key.key === 'visual_id'"
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
              <div
                v-else-if="key.isDynamic && key.dynamicConfig"
                :class="key.right && 'text-end'"
              >
                {{ getDynamicValue(data, key.dynamicConfig) }}
              </div>
              <div v-else-if="key.type === 'number'">
                {{ getFormattedAmount(data[key.key]) }}
              </div>
              <div v-else-if="key.key === 'trade_direction_list'">
                <show-more :data="data[key.key]" />
              </div>
              <div
                v-else-if="key.key === 'term_date'"
                :class="checkTermDate(data[key.key]) && 'text-red'"
              >
                {{ getFormattedDate(data[key.key], "DD.MM.YYYY HH:mm") }}
              </div>
              <div v-else-if="key.type === 'date'">
                {{ getFormattedDate(data[key.key]) }}
              </div>
              <div
                v-else-if="
                  key.key === 'agent_name' && !data?.is_client_employee
                "
                class="flex items-center gap-x-2"
              >
                {{ data[key.key] }}
                <icon-exclamation
                  :size="30"
                  :tooltip="t('clients.invalid_bill')"
                />
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
        :current-size="clientsBalancesStore.tableForAgentParams.page_size"
        :total-count="clientsBalancesStore?.dataForAgent?.total_count"
        :page-number="clientsBalancesStore?.dataForAgent?.page_number"
      />
      <page-index
        :available-pages="clientsBalancesStore.dataForAgent?.total_pages"
        :current-page="clientsBalancesStore.dataForAgent?.page_number"
        @setPage="clientsBalancesStore.setPageAgentBalance"
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
        by-agent
        @closeDialog="closeArrivalCheckoutDialog"
      />
    </div>
  </transition>
</template>

<script setup>
import {
  getDynamicValue,
  getFormattedAmount,
  getFormattedDate,
} from "#imports";
import { agentBalancesHeader } from "~/variable/column-constants";
import { useI18n } from "vue-i18n";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";
import { AppRoutes } from "~/variable/routes";

// store
const clientsBalancesStore = useClientsBalancesStore("main");

// composables
const { hasAccess2CreatePayment, hasAccess2ClientBalanceDetail } =
  useCashboxAccess();
const { t } = useI18n();

// states
const arrivalCheckoutModal = ref(false);

const changeDeadlineInfo = ref({
  clientId: "",
  clientName: "",
  currentTerm: "",
});

// hooks
const isTableAllChecked = computed(() => {
  if (!clientsBalancesStore.dataForAgent?.items.length) return false;
  return clientsBalancesStore.dataForAgent?.items.every((item) =>
    clientsBalancesStore.agentsIds.includes(getByAgentUniqueId(item)),
  );
});

const isTableIndeterminate = computed(() => {
  if (
    isTableAllChecked.value ||
    !clientsBalancesStore.dataForAgent?.items.length
  )
    return false;
  return clientsBalancesStore.dataForAgent?.items.some((item) =>
    clientsBalancesStore.agentsIds.includes(getByAgentUniqueId(item)),
  );
});

// methods
const getByAgentUniqueId = (data) => {
  return \`\${data?.agent_id}_\${data?.client_id}\`;
};

const checkTermDate = (date) => {
  return new Date(date) < new Date();
};

const onChangeTableHeaders = (newValue) => {
  clientsBalancesStore.headersForAgentBalance = newValue;
};

function onCloseChangeDeadline() {
  changeDeadlineInfo.value.clientId = "";
  changeDeadlineInfo.value.clientName = "";
  changeDeadlineInfo.value.currentTerm = "";
}

const refresh = async () => {
  await clientsBalancesStore.refreshAgentsData();
};

const isTableChecked = (visual_id) => {
  return !!clientsBalancesStore.agentsIds?.find((id) => visual_id === id);
};

const onSelectClient = (visual_id) => {
  if (!isTableChecked(visual_id)) {
    clientsBalancesStore.agentsIds.push(visual_id);
  } else {
    clientsBalancesStore.agentsIds = clientsBalancesStore.agentsIds.filter(
      (id) => id !== visual_id,
    );
  }
};

const getAllClientsId = (checked) => {
  if (!checked) {
    clientsBalancesStore.setNullAgentMultipleDialog();
  } else {
    clientsBalancesStore.agentsIds =
      clientsBalancesStore.dataForAgent?.items.map((agent) =>
        getByAgentUniqueId(agent),
      );
  }
};

const onOpenArrivalModal = () => {
  if (clientsBalancesStore.agentsIds.length) {
    arrivalCheckoutModal.value = true;
  }
};

const closeArrivalCheckoutDialog = () => {
  arrivalCheckoutModal.value = false;
};

const getCustomerBalanceDetailsPageUrl = (id, agent_id) => {
  return (
    AppRoutes.cashbox.child.customerBalancesDetail.replace(":id", id) +
    "?" +
    params2query({ agent_id })
  );
};
<\/script>
`;export{e as default};
