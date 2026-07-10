const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :templates="headers"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn :headers="headers" />
      <page-size-btn :current-size="currentSize" @setPageSize="setPageSize" />
      <search-input @change="onSearch" />
      <RefreshBtn @click="emit('refresh')" :loading="isLoading" />
      <excel-btn
        :loading="isExcelFileDownloading"
        @click="onDownloadExcelFile"
      />
    </div>

    <div class="table-content-body">
      <data-table
        :headers="headers"
        :sorted="sorted"
        :loading="isLoading"
        :isEmpty="!data?.items.length"
        @sort="onSortData"
      >
        <template #body>
          <template v-for="(row, index) in data?.items" :key="index">
            <c-tr>
              <c-td-no-edit
                v-for="key in headers"
                :key="key.key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div
                  v-if="
                    key.key === 'currency' &&
                    (row as any)?.by_currency_income_arr?.length
                  "
                  class="text-end"
                >
                  <div
                    v-for="item in (row as any).by_currency_income_arr"
                    :key="item?.currency?.id"
                  >
                    <div v-if="item.currency.id === (key as any).id">
                      {{ getFormattedAmount(item.amount) }}
                    </div>
                  </div>
                </div>
                <div v-else-if="key.type === 'number'">
                  {{ getFormattedAmount((row as any)[key.key]) }}
                  {{
                    (row as any)[key.key] &&
                    (row as any)[key.key]?.total_amount_currency_code
                  }}
                </div>
                <div v-else>
                  {{ (row as any)[key.key] }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </template>
      </data-table>
    </div>
    <div v-if="data?.items?.length" class="table-content-footer">
      <curren-page-btn
        :total-count="data?.total_count"
        :page-number="data?.page_number"
        :current-size="currentSize"
      />
      <page-index
        :available-pages="data?.total_pages"
        :current-page="data?.page_number"
        @setPage="setPageNumber"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import type { AppResponse } from "~/interfaces/api/response/app-response";
import type { IncomeReportByTerritoryModel } from "~/interfaces/api/cashboxes/income-report-by-territory-model";
import type { IncomeReportsByClientModel } from "~/interfaces/api/orders/income-reports-by-client-model";
import type { IncomeReportsByAgentModel } from "~/interfaces/api/reports/income-reports-by-agent-model";
import { getFormattedAmount } from "~/utils/filter";
import type { OrderByParams } from "~/interfaces/api/params/list-parameters";

// Props
const props = defineProps<{
  data: AppResponse<
    | IncomeReportByTerritoryModel
    | IncomeReportsByClientModel
    | IncomeReportsByAgentModel
  >;
  currencies: SharedApiCurrenciesModel[];
  sorted: OrderByParams | null;
  currentSize: number;
  isLoading: boolean;
  isExcelFileDownloading: boolean;
  headersBefore: Template[];
  headersAfter: Template[];
}>();

// Emits
const emit = defineEmits([
  "setPageNumber",
  "setPageSize",
  "onSearch",
  "onSortData",
  "onDownloadExcelFile",
  "refresh",
]);

// States
const headers = ref<Template[]>([]);

// Hooks
const _headers = computed(() => {
  return [
    ...props.headersBefore,
    ...( props.currencies || []).map((item) => ({
      ...item,
      name:
        item.name +
        (item?.base_currency_code && \`(\${item.base_currency_code})\`),
      checked: true,
      key: "currency",
      is_sortable: false,
      right: true,
    })),
    ...props.headersAfter,
  ] as Template[];
});

watchEffect(() => {
  headers.value = _headers.value;
});

// Methods
const onChangeTableHeaders = (newValue: Template[]) => {
  headers.value = newValue;
};

const setPageNumber = (pageNumber: number) => {
  emit("setPageNumber", pageNumber);
};

const setPageSize = (pageSize: number) => {
  emit("setPageSize", pageSize);
};

const onSearch = (value: string) => {
  emit("onSearch", value);
};

const onSortData = (newValue: OrderByParams) => {
  emit("onSortData", newValue);
};

const onDownloadExcelFile = () => emit("onDownloadExcelFile", headers.value);
<\/script>
`;export{e as default};
