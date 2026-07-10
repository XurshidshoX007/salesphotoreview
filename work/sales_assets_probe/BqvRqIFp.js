const e=`<template>
  <div class="table-content-container">
    <div class="p-4">
      <page-title20 :title="t('reports.by_agent')" />
    </div>
    <div class="table-content-header border-t-1">
      <table-sort-columns
        :save-key="reportsCustomerMinAgentHeader"
        :templates="salesByClientsMinAkbStore.agentsHeaders"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="salesByClientsMinAkbStore.agentsHeaders"
        :save-key="reportsCustomerMinAgentHeader"
      />
      <page-size-btn
        :current-size="params?.page_size"
        @setPageSize="setPageSize"
      />
      <search-input @change="onSearch" />
      <excel-btn
        @click="onDownloadExcelFile"
        :loading="salesByClientsMinAkbStore.isAgentsExcelDownloading"
      />
      <RefreshBtn
        @click="refresh"
        :loading="salesByClientsMinAkbStore.isAgentsDataLoading"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="salesByClientsMinAkbStore.agentsHeaders"
        :sorted="params?.order_by"
        :loading="salesByClientsMinAkbStore.isAgentsDataLoading"
        :isEmpty="!salesByClientsMinAkbStore.agentsData?.items.length"
        @sort="onSortData"
      >
        <template #body>
          <template
            v-for="data in salesByClientsMinAkbStore.agentsData?.items"
            :key="data?.id"
          >
            <c-tr>
              <c-td-no-edit
                v-for="key in salesByClientsMinAkbStore.agentsHeaders"
                :key="key.key"
                :is-checked="key.checked"
                :header-key="key.key"
                :type="key.type"
              >
                <div v-if="key.type === 'number'">
                  {{ getFormattedAmount(data[key.key]) }}
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
        :current-size="params?.page_size"
        :total-count="salesByClientsMinAkbStore?.agentsData?.total_count"
        :page-number="salesByClientsMinAkbStore?.agentsData?.page_number"
      />
      <page-index
        :available-pages="salesByClientsMinAkbStore.agentsData?.total_pages"
        :current-page="salesByClientsMinAkbStore.agentsData?.page_number"
        @setPage="setPageNumber"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReportsSalesAgentsMinAkbParams } from "~/interfaces/api/params/list-parameters";
import type { Template } from "~/interfaces/ui/template";
import { useI18n } from "vue-i18n";
import { reportsCustomerMinAgentHeader } from "~/variable/column-constants";

// store
const salesByClientsMinAkbStore = useSalesByClientsMinAkbStore("main");

// state
const { t } = useI18n();
const params = reactive<Partial<ReportsSalesAgentsMinAkbParams>>({
  page: 1,
  page_size: 10,
  order_by: { field: "agent_name", is_asc: true },
});
let debounceTimeout: NodeJS.Timeout | null = null;
// hooks
watch(params, async () => {
  await getData();
});

// methods

const getData = async () => {
  await salesByClientsMinAkbStore.getAgentsData({
    ...salesByClientsMinAkbStore.params,
    ...params,
  });
};

const onDownloadExcelFile = async () => {
  salesByClientsMinAkbStore.onDownloadAgentsExcelFile({
    ...salesByClientsMinAkbStore.params,
    ...params,
  });
};

const setPageNumber = (pageNumber: number) => {
  params.page = pageNumber;
};

const setPageSize = (pageSize: number) => {
  params.page_size = pageSize;
};

const onSearch = (value: string) => {
  if (debounceTimeout !== null) {
    clearTimeout(debounceTimeout);
  }
  debounceTimeout = setTimeout(() => {
    salesByClientsMinAkbStore.agentsSearchParams.page = 1;
    salesByClientsMinAkbStore.agentsSearchParams.search = value;
  }, 400);
};

const onSortData = (
  newValue: Record<"field" | "is_asc", boolean | string | undefined>,
) => {
  params.order_by = newValue;
};

const onChangeTableHeaders = (newValue: Template[]) => {
  salesByClientsMinAkbStore.agentsHeaders = newValue;
};
const refresh = () => {
  salesByClientsMinAkbStore.refreshAgentsData();
};
<\/script>
`;export{e as default};
