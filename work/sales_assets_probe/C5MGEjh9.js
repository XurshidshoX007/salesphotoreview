const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="visitReportSummaryHeader"
          :templates="reportResultsOfVisitsStore.templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="reportResultsOfVisitsStore.templates"
          :save-key="visitReportSummaryHeader"
        />
        <page-size-btn
          :current-size="reportResultsOfVisitsStore.params.page_size"
          :total-count="reportResultsOfVisitsStore.data?.total_count"
          :page-number="reportResultsOfVisitsStore.data?.page_number"
          @setPageSize="reportResultsOfVisitsStore.setPageSize"
        />
        <search-input @change="reportResultsOfVisitsStore.search" />
        <excel-btn
          @click="reportResultsOfVisitsStore.onDownloadExcelFile"
          :loading="reportResultsOfVisitsStore.isExcelFileDownloading"
        />
        <RefreshBtn
          @click="refresh"
          :loading="reportResultsOfVisitsStore.isDataFilterLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="reportResultsOfVisitsStore.templates"
          :sorted="reportResultsOfVisitsStore.params.order_by"
          :isEmpty="!reportResultsOfVisitsStore.data?.items?.length"
          :loading="reportResultsOfVisitsStore.isDataTableLoading"
          @sort="reportResultsOfVisitsStore.sortData"
        >
          <template #body>
            <c-tr
              v-for="data in reportResultsOfVisitsStore.data?.items"
              :key="data.id"
            >
              <c-td-no-edit
                v-for="key in reportResultsOfVisitsStore.templates"
                :key="key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.type === 'date'">
                  {{ getFormattedDate(data[key.key], "DD.MM.YYYY") }}
                </div>
                <div v-else-if="key.type === 'number'">
                  {{ getFormattedAmount(data[key.key]) }}
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
          :current-size="reportResultsOfVisitsStore.params.page_size"
          :total-count="reportResultsOfVisitsStore.data?.total_count"
          :page-number="reportResultsOfVisitsStore.data?.page_number"
        />
        <page-index
          :available-pages="reportResultsOfVisitsStore.data?.total_pages"
          :current-page="reportResultsOfVisitsStore.data?.page_number"
          @setPage="reportResultsOfVisitsStore.setPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { visitReportSummaryHeader } from "~/variable/column-constants";
import { useReportResultsOfVisitsStore } from "~/stores/reports/visits/results-of-visits";

// Store

const reportResultsOfVisitsStore = useReportResultsOfVisitsStore("main");

// methods

const onChangeTableHeaders = (value: Template[]) => {
  reportResultsOfVisitsStore.templates = value;
};

const refresh = async () => {
  await reportResultsOfVisitsStore.refresh();
};
<\/script>
`;export{e as default};
