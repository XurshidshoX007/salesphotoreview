const e=`<template>
  <div class="table-content-container">
    <slot name="headerContent"></slot>
    <div class="table-content-header" :class="hasHeaderContent && 'border-t-1'">
      <table-sort-columns
        :save-key="saveKey"
        :templates="headers"
        @onChangeTableHeaders="onChangeHeaders"
      />
      <ShowHideColumn :headers="headers" :save-key="saveKey" />
      <page-size-btn
        :current-size="pageSize"
        :total-count="loadedData?.total_count"
        :page-number="loadedData?.page_number"
        @setPageSize="onSetPageSize"
      />
      <search-input @change="onSearch" />
      <excel-btn
        :text="'Скачать Excel'"
        :loading="isExcelFileDownloading"
        @click="onDownloadExcelFile"
      />
      <RefreshBtn @click="refresh" :loading="isLoading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="headers"
        :sorted="sortedData"
        :loading="isLoading"
        :isEmpty="!loadedData?.items?.length"
        @sort="onSortData"
      >
        <template #body>
          <template v-for="data in loadedData?.items" :key="data.id">
            <c-tr>
              <c-td-no-edit
                v-for="key in headers"
                :key="key"
                :is-checked="key.checked"
                :header-key="key.key"
                :type="key.type"
              >
                <div v-if="key.key === 'status'">
                  <StatusBtnForTable
                    :status-data="getStatusDataByName(data?.status?.name)"
                    :readonly="true"
                  />
                </div>
                <div v-else-if="key.key === 'client'">
                  <link-component
                    :to="'/clients/about-clients/' + data[key.key]?.id"
                    >{{ data[key.key]?.name }}</link-component
                  >
                </div>
                <div v-else-if="key.type === 'date'">
                  {{ getFormattedDate(data[key.key]) }}
                </div>
                <div v-else-if="key.key === 'product_code'">
                  {{ data?.product?.code }}
                </div>
                <div v-else-if="typeof data[key.key] === 'object'">
                  {{ data[key.key]?.name }}
                </div>
                <div v-else-if="key.type === 'number'">
                  {{ getFormattedAmount(data[key.key]) }}
                </div>
                <div
                  v-else-if="key.key === 'visual_id'"
                  class="hover:underline w-fit text-[#299B9B] cursor-pointer"
                  @click="onOpenDetailDialog(data?.order_id)"
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
        <template #footer>
          <template v-if="keysOfTotals.length > 0">
            <c-tr class="bg-neutral-50 font-semibold">
              <c-td-no-edit
                v-for="(key, index) in headers"
                :key="key.key"
                :is-checked="isColumnChecked(key.key)"
                :type="key.type"
              >
                <div v-show="index === 0">Итого</div>
                <div
                  v-if="keysOfTotals.includes(key.key)"
                  class="whitespace-nowrap"
                >
                  {{ getFormattedAmount(totals[key.key]) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="pageSize"
        :total-count="loadedData?.total_count"
        :page-number="loadedData?.page_number"
      />
      <page-index
        :available-pages="loadedData?.total_pages"
        :current-page="loadedData?.page_number"
        @setPage="onSetPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getFormattedDate } from "~/utils/formatters";
import { getFormattedAmount } from "~/utils/filter";
import type { AppResponse } from "~/interfaces/api/response/app-response";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";
import type { ReportsReturnExpeditorTotalModel } from "~/interfaces/api/reports/return-expeditors/total-model";
import type { Template } from "~/interfaces/ui/template";
const slots = useSlots();
// props
const props = defineProps<{
  headers: Array<Template>;
  loadedData: AppResponse<Array<object>>;
  pageSize: number;
  sortedData: Record<"field" | "is_asc", string | boolean>;
  isLoading: boolean;
  isExcelFileDownloading: boolean;
  totals?: ReportsReturnExpeditorTotalModel;
  statusConstants?: ConstantModel[];
  saveKey?: string;
}>();

// emits
const emit = defineEmits([
  "onSortData",
  "onSearch",
  "onChangeHeaders",
  "onSetPage",
  "onSetPageSize",
  "onDownloadExcelFile",
  "onOpenDetailDialog",
  "refresh",
]);

// state
const hasHeaderContent = computed(() => !!slots.headerContent);
// hooks

const keysOfTotals = computed(() => {
  if (!props.totals) return [];
  return Object.keys(props.totals);
});

// methods
const getStatusDataByName = (name: string) => {
  return props.statusConstants?.find((status) => status.name === name);
};

const onSortData = (data: Record<"field" | "is_asc", string | boolean>) =>
  emit("onSortData", data);

const onSearch = (value: string) => emit("onSearch", value);

const onChangeHeaders = (newHeaders: Template[]) => {
  emit("onChangeHeaders", newHeaders);
};

const isColumnChecked = (key: string) =>
  props.headers.find((item) => item.key === key)?.checked;

const onSetPage = (newPage: number) => emit("onSetPage", newPage);

const onSetPageSize = (newSize: number) => emit("onSetPageSize", newSize);

const refresh = () => emit("refresh");

const onDownloadExcelFile = () => emit("onDownloadExcelFile");

const onOpenDetailDialog = (id: string) => emit("onOpenDetailDialog", id);
<\/script>
`;export{e as default};
