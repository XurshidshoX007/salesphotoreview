const e=`<template>
  <card :classes="{ header: 'text-xl font-semibold' }">
    <template #header>{{ t("reports.by_agent") }}</template>

    <div class="table-content-container">
      <div class="table-content-header !p-3 justify-between">
        <div class="table-content-btn-group">
          <table-sort-columns
            :templates="headers"
            :save-key="saveKey"
            @on-change-table-headers="onChangeTableHeaders"
          />
          <show-hide-column :headers="headers" :save-key="saveKey" />
          <excel-btn
            :loading="isExcelFileDownloading"
            @click="downloadExcelFile"
          />
          <page-size-btn
            :current-size="pageSize"
            :total-count="dashboardStore.agentTableStore.data?.total_count"
            :page-number="dashboardStore.agentTableStore.data?.page_number"
            @set-page-size="setPageSize"
          />
          <search-input no-debounce @change="onSearch" />
          <refresh-btn
            @click="refresh"
            :loading="dashboardStore.agentTableStore.isLoading"
          />
        </div>
      </div>
      <div class="table-content-body !p-0">
        <data-table
          :headers="headers"
          :loading="dashboardStore.agentTableStore.isLoading"
          :is-empty="!dashboardStore.agentTableStore.data?.items?.length"
          :sorted="dashboardStore.agentTableStore.params.order_by"
          @sort="onSort"
        >
          <template #body>
            <c-tr
              v-for="(item, index) in dashboardStore.agentTableStore.data
                ?.items || []"
              :key="item.agent_code || index"
            >
              <c-td-no-edit
                v-for="column in headers"
                :is-checked="column.checked"
                :key="column.key"
                :type="column.type"
              >
                {{
                  getDataValue(
                    item,
                    column.accessorKey || column.key,
                    column.type,
                  )
                }}
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div
        v-if="dashboardStore.agentTableStore.data?.items?.length"
        class="table-content-footer !p-3"
      >
        <curren-page-btn
          :current-size="pageSize"
          :total-count="dashboardStore.agentTableStore.data?.total_count"
          :page-number="dashboardStore.agentTableStore.data?.page_number"
          @set-page-size="setPageSize"
        />
        <page-index
          :available-pages="dashboardStore.agentTableStore.data?.total_pages"
          :current-page="dashboardStore.agentTableStore.data?.page_number"
          @set-page="setPage"
        />
      </div>
    </div>
  </card>
</template>

<script setup lang="ts">
import { getDataValue, getFormattedAmount, type Template } from "#imports";
import { useI18n } from "vue-i18n";
import type { OrderByParams } from "~/interfaces/api/params/list-parameters";
import { dashboardSalesAgentTable } from "~/variable/column-constants";

// Composables
const { t } = useI18n();

// Stores
const dashboardStore = useSalesDashboardStore();

// States
const saveKey = dashboardSalesAgentTable;
const headers = computed(() => dashboardStore.agentTableStore.templates);
const isExcelFileDownloading = computed(
  () => dashboardStore.agentTableStore.isExcelFileDownloading,
);
const pageSize = computed(
  () => dashboardStore.agentTableStore.params.page_size,
);

// Methods
const setPageSize = (size: number) => {
  dashboardStore.agentTableStore.setPageSize(size);
};

const setPage = (page: number) => {
  dashboardStore.agentTableStore.setPage(page);
};

const onSearch = (value: string) => {
  dashboardStore.agentTableStore.search(value);
};

const refresh = async () => {
  await dashboardStore.agentTableStore.refresh();
};

const downloadExcelFile = async () => {
  await dashboardStore.agentTableStore.onDownloadExcelFile();
};

const onChangeTableHeaders = (newHeaders: Template[]) => {
  dashboardStore.agentTableStore.templates = newHeaders;
};

const onSort = (val: OrderByParams) => {
  dashboardStore.agentTableStore.sortData(val);
};
<\/script>
`;export{e as default};
