const e=`<template>
  <flex-col class="page-gap">
    <div class="table-content-container">
      <div class="page-content-header p-4">
        <page-title :title="t('dashboard.supervisor.table_title')" />
        <FlexibleItemsMenu
          tab-mode
          :items-arr="resultValueTypes"
          :active-item-id="activeTabId"
          :is-btn-loading="ordersByAgentsStore.isByOrdersLoading"
          @onChangeActiveItem="onChangeActiveTab"
        />
      </div>
      <div class="table-content-header border-t-1">
        <table-sort-columns
          :save-key="salesAgentsReportsHeader"
          :templates="ordersByAgentsStore.byOrdersHeaders"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="ordersByAgentsStore.byOrdersHeaders"
          :save-key="salesAgentsReportsHeader"
        />
        <page-size-btn
          :current-size="ordersByAgentsStore.tableParams.page_size"
          :total-count="ordersByAgentsStore.byOrdersData?.total_count"
          :page-number="ordersByAgentsStore.byOrdersData?.page_number"
          @setPageSize="ordersByAgentsStore.setPageSize"
        />
        <search-input @change="ordersByAgentsStore.search" />
        <excel-btn
          @click="
            ordersByAgentsStore.onDownloadByOrdersExcelOfTable(activeTabId)
          "
          :loading="ordersByAgentsStore.isByOrdersExcelFileDownloading"
        />
        <RefreshBtn
          @click="refresh"
          :loading="ordersByAgentsStore.isByOrdersLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="ordersByAgentsStore.byOrdersHeaders"
          :sorted="ordersByAgentsStore.tableParams.order_by"
          :loading="ordersByAgentsStore.isByOrdersLoading"
          :isEmpty="isTableEmpty"
          @sort="ordersByAgentsStore.sortData"
        >
          <template #body>
            <template
              v-for="(data, index) in ordersByAgentsStore.byOrdersData?.items"
              :key="index"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in ordersByAgentsStore.byOrdersHeaders"
                  :key="key"
                  :is-checked="key.checked"
                  :class="getUnderlineClass(key.key, data)"
                  :type="key.type"
                  class="border-r last-border-r-0"
                >
                  <div
                    v-if="key.type === 'number'"
                    @click="
                      data[key.key] &&
                      onOpenOrderListDialog(data?.agent_id, key.key)
                    "
                  >
                    {{ getFormattedAmount(data[key.key]) }}
                  </div>
                  <div
                    v-else-if="key.key === 'agent_name'"
                    @click="totalsByAgentId = data?.agent_id"
                  >
                    {{ data[key.key] }}
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
          :current-size="ordersByAgentsStore.tableParams.page_size"
          :total-count="ordersByAgentsStore.byOrdersData?.total_count"
          :page-number="ordersByAgentsStore.byOrdersData?.page_number"
        />
        <page-index
          :available-pages="ordersByAgentsStore.byOrdersData?.total_pages"
          :current-page="ordersByAgentsStore.byOrdersData?.page_number"
          @setPage="ordersByAgentsStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="totalsByAgentId">
        <ReportsOrderByAgentsTotalsByAgentDialog
          :agentId="totalsByAgentId"
          :modal-name="selectedAgentName"
          @closeDialog="totalsByAgentId = ''"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="ordersListDialogInfo.id">
        <ReportsOrderByAgentsOrdersTableByAgentDialog
          :modal-name="selectedAgentName"
          :dialogInfo="ordersListDialogInfo"
          @closeDialog="onCloseOrderListDialog"
        />
      </div>
    </transition>
  </flex-col>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";
import { salesAgentsReportsHeader } from "~/variable/column-constants";
import type { ReportsByOrderStatusModel } from "~/interfaces/api/reports/orders-by-agents/by-order-status-model";

// Store
const ordersByAgentsStore = useOrdersByAgentsStore("main");

// State
const { t } = useI18n();
const totalsByAgentId = ref<string>();
const activeTabId = ref<number>(
  ordersByAgentsStore.tableParams.result_value_type || 3,
);

const ordersListDialogInfo = ref<Record<"id" | "statusKey", string>>({
  id: "",
  statusKey: "",
});

// hooks
const resultValueTypes = computed(() => {
  return ordersByAgentsStore.resultValueTypes || undefined;
});

const isTableEmpty = computed(
  () => !!!ordersByAgentsStore.byOrdersData?.items?.length,
);

const selectedAgentName = computed(() => {
  const agentId = totalsByAgentId.value || ordersListDialogInfo.value.id;
  return ordersByAgentsStore.byOrdersData?.items?.find(
    (agent) => agent.agent_id === agentId,
  )?.agent_name;
});

// Methods
const onOpenOrderListDialog = (agentId: string, statusKey: string) => {
  ordersListDialogInfo.value.id = agentId;
  ordersListDialogInfo.value.statusKey = statusKey;
};

const onCloseOrderListDialog = () => {
  ordersListDialogInfo.value.id = "";
  ordersListDialogInfo.value.statusKey = "";
};

const onChangeTableHeaders = (newValue: Template[]) => {
  ordersByAgentsStore.byOrdersHeaders = newValue;
};

const onChangeActiveTab = async (tabId: number) => {
  ordersByAgentsStore.tableParams!.result_value_type = tabId;
  activeTabId.value = tabId;
};

const refresh = () => {
  ordersByAgentsStore.refreshByOrdersData();
};

const getUnderlineClass = (key: string, data: ReportsByOrderStatusModel) => {
  if (key === "agent_code") return "";
  if (data[key]) return "underline hover:text-[#299B9B] cursor-pointer";
};
<\/script>
`;export{e as default};
