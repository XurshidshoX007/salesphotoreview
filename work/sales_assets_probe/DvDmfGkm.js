const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header justify-between">
      <div class="table-content-btn-group">
        <table-sort-columns
          :templates="dailyReportStore.templates"
          :save-key="auditDailyReport"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="dailyReportStore.templates"
          :save-key="auditDailyReport"
        />
        <page-size-btn
          :current-size="dailyReportStore.params.page_size"
          :total-count="dailyReportStore.data?.total_count"
          :page-number="dailyReportStore.data?.page_number"
          @setPageSize="dailyReportStore.setPageSize"
        />
        <search-input
          :value="dailyReportStore.params.search"
          @change="dailyReportStore.search"
        />
        <excel-btn
          :loading="dailyReportStore.isExcelFileDownloading"
          @click="dailyReportStore.onDownloadExcelFile"
        />
        <RefreshBtn
          @click="dailyReportStore.refresh"
          :loading="dailyReportStore.isLoading"
        />
      </div>
      <div>
        <DatePicker @on-apply="dailyReportStore.setDateRangeFilter" />
      </div>
    </div>
    <div class="table-content-body">
      <data-table
        :headers="dailyReportStore.templates"
        :loading="dailyReportStore.isLoading"
        :is-empty="!dailyReportStore.data?.items"
        :sorted="dailyReportStore.params.order_by"
        @sort="dailyReportStore.sortData"
      >
        <template #body>
          <c-tr v-for="data in dailyReportStore.data?.items" :key="data.id">
            <c-td-no-edit
              v-for="key in dailyReportStore.templates"
              :key="key.key"
              :type="key.type"
            >
              {{ getDataValue(data, key.key, key.type) }}
            </c-td-no-edit>
          </c-tr>
        </template>
        <template #footer>
          <c-tr
            v-if="dailyReportStore.data?.items.length"
            class="bg-neutral-50 border-t-0 border-b"
          >
            <c-td-no-edit
              v-for="column in dailyReportStore.templates"
              :key="column.key"
              :type="column.type"
              :is-checked="column.checked"
            >
              <div v-if="column.key === 'name'" class="text-sm font-semibold">
                {{ t("column.total") }}
              </div>
              <div v-else class="text-sm font-semibold">
                {{ getDataValue(dailyReportStore.data.total_row, column.key) }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="dailyReportStore.params.page_size"
        :total-count="dailyReportStore.data?.total_count"
        :page-number="dailyReportStore.data?.page_number"
      />
      <page-index
        :available-pages="dailyReportStore.data?.total_pages"
        :current-page="dailyReportStore.data?.page_number"
        @setPage="dailyReportStore.setPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { auditDailyReport } from "~/variable/column-constants";
import { getDataValue } from "~/utils/helpers";
import type { Template } from "~/interfaces/ui/template";
import { useI18n } from "vue-i18n";

// store
const dailyReportStore = useAuditDailyReportStore("main");

// states
const { t } = useI18n();

// hooks
onMounted(async () => await dailyReportStore.getData());

// methods
const onChangeTableHeaders = (newValue: Template[]) => {
  dailyReportStore.templates = newValue;
};
<\/script>
`;export{e as default};
