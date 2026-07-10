const e=`<template>
  <flex-col class="gap-4">
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="visitReportByClientHeader"
          :templates="reportVisitByClientStore.templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="reportVisitByClientStore.templates"
          :save-key="visitReportByClientHeader"
        />
        <page-size-btn
          :current-size="reportVisitByClientStore.params.page_size"
          :total-count="reportVisitByClientStore.data?.total_count"
          :page-number="reportVisitByClientStore.data?.page_number"
          @setPageSize="reportVisitByClientStore.setPageSize"
        />
        <search-input @change="reportVisitByClientStore.search" />
        <excel-btn
          @click="reportVisitByClientStore.onDownloadExcelFile"
          :loading="reportVisitByClientStore.isExcelFileDownloading"
        />
        <RefreshBtn
          @click="refresh"
          :loading="reportVisitByClientStore.isLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="reportVisitByClientStore.templates"
          :sorted="reportVisitByClientStore.params.order_by"
          :isEmpty="!reportVisitByClientStore.data?.items?.length"
          :loading="reportVisitByClientStore.isLoading"
          @sort="reportVisitByClientStore.sortData"
        >
          <template #body>
            <c-tr
              v-for="data in reportVisitByClientStore.data?.items"
              :key="data.id"
            >
              <c-td-no-edit
                v-for="key in reportVisitByClientStore.templates"
                :key="key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.type === 'date'">
                  {{ getFormattedDate(data[key.key], "DD.MM.YYYY") }}
                </div>
                <div v-else-if="key.key === 'week_days'">
                  <show-more
                    :show-count="2"
                    :data="data[key.key]?.split(',')"
                  />
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
          :current-size="reportVisitByClientStore.params.page_size"
          :total-count="reportVisitByClientStore.data?.total_count"
          :page-number="reportVisitByClientStore.data?.page_number"
        />
        <page-index
          :available-pages="reportVisitByClientStore.data?.total_pages"
          :current-page="reportVisitByClientStore.data?.page_number"
          @setPage="reportVisitByClientStore.setPage"
        />
      </div>
    </div>
  </flex-col>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { visitReportByClientHeader } from "~/variable/column-constants";
import { useReportVisitsByClientStore } from "~/stores/reports/visits/visits-by-client.store";
import { useI18n } from "vue-i18n";

// Store

const reportVisitByClientStore = useReportVisitsByClientStore("main");

// State
const { t } = useI18n();
// methods

const onChangeTableHeaders = (value: Template[]) => {
  reportVisitByClientStore.templates = value;
};

const refresh = async () => {
  await reportVisitByClientStore.refresh();
};
<\/script>
`;export{e as default};
