const e=`<template>
  <div class="table-content-container">
    <div class="page-content-header p-3">
      <page-title :title="t('gps.report_by_routes_for_expeditors')" size="lg" />
    </div>
    <div class="table-content-header !p-3 border-t-1">
      <table-sort-columns
        :save-key="saveKey"
        :templates="headers"
        @on-change-table-headers="onChangeTableHeaders"
      />
      <ShowHideColumn :headers="headers" :save-key="saveKey" />
      <page-size-btn
        :current-size="reportByGpsStore.params.page_size"
        :total-count="reportByGpsStore.data?.total_count"
        :page-number="reportByGpsStore.data?.page_number"
        @set-page-size="setPageSize"
      />
      <search-input @change="onSearch" />
      <excel-btn @click="downloadExcelFile" :loading="isExcelFileDownloading" />
      <RefreshBtn @click="refresh" :loading="reportByGpsStore.isLoading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="headers"
        :sorted="reportByGpsStore.params.order_by"
        :loading="reportByGpsStore.isLoading"
        :is-empty="isTableEmpty"
        @sort="onSort"
      >
        <template #body>
          <c-tr
            v-for="(item, index) in reportByGpsStore.data?.items || []"
            :key="index"
          >
            <c-td-no-edit
              v-for="column in headers"
              :key="column.key"
              :is-checked="column.checked"
              :type="column.type"
            >
              <span :class="column.right ? 'block w-full text-end' : ''">{{
                getColumnValue(item, column)
              }}</span>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
    <div
      v-if="reportByGpsStore.data?.items?.length"
      class="table-content-footer"
    >
      <curren-page-btn
        :current-size="reportByGpsStore.params.page_size"
        :total-count="reportByGpsStore.data?.total_count"
        :page-number="reportByGpsStore.data?.page_number"
        @set-page-size="setPageSize"
      />
      <page-index
        :available-pages="reportByGpsStore.data?.total_pages"
        :current-page="reportByGpsStore.data?.page_number"
        @set-page="setPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getDataValue } from "#imports";
import { useI18n } from "vue-i18n";
import { formatDistance, formatTime } from "~/utils/formatters";
import { reportByGpsSaveKey } from "~/variable/column-constants";
import type { Template } from "~/interfaces/ui/template";
import type { OrderByParams } from "~/interfaces/api/params/list-parameters";

// Composables
const { t } = useI18n();

// Stores
const reportByGpsStore = useReportByGpsStore();

// States
const saveKey = reportByGpsSaveKey;
const headers = computed(() => reportByGpsStore.templates);
const isTableEmpty = computed(() => !reportByGpsStore.data?.items?.length);
const isExcelFileDownloading = computed(
  () => reportByGpsStore.isExcelFileDownloading,
);

const durationColumnKeys = new Set([
  "visit_duration_in_seconds",
  "visit_interval_in_seconds",
  "calculated_duration_in_seconds",
  "expected_duration_in_seconds",
]);

const distanceColumnKeys = new Set([
  "calculated_route_length_in_meters",
  "expected_route_length_in_meters",
]);

// Methods
const getRawValue = (item: Record<string, any>, path: string) => {
  return path.split(".").reduce((acc, key) => acc?.[key], item);
};

const secondsToTimeString = (value: unknown) => {
  if (value == null || Number.isNaN(Number(value))) return "";

  const totalSeconds = Math.floor(Number(value));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
};

const getColumnValue = (item: Record<string, any>, column: Template) => {
  const accessor = column.accessorKey || column.key;
  const rawValue = getRawValue(item, accessor);

  if (durationColumnKeys.has(column.key)) {
    return formatTime(secondsToTimeString(rawValue), t);
  }

  if (distanceColumnKeys.has(column.key)) {
    return rawValue == null ? "" : formatDistance(Number(rawValue));
  }

  return getDataValue(item, accessor, column.type);
};

const setPageSize = (size: number) => {
  reportByGpsStore.setPageSize(size);
};

const setPage = (page: number) => {
  reportByGpsStore.setPage(page);
};

const onSearch = (value: string) => {
  reportByGpsStore.search(value);
};

const refresh = async () => {
  await reportByGpsStore.refresh();
};

const downloadExcelFile = async () => {
  await reportByGpsStore.onDownloadExcelFile();
};

const onChangeTableHeaders = (newHeaders: Template[]) => {
  reportByGpsStore.templates = newHeaders;
};

const onSort = (val: OrderByParams) => {
  reportByGpsStore.sortData(val);
};
<\/script>
`;export{e as default};
