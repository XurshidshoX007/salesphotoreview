const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns :templates="headers" @change="onChangeTableHeaders" />
      <ShowHideColumn :headers="headers" />
      <page-size-btn
        :current-size="incomeReportsStore.byCurrencyStore.params.page_size"
        @setPageSize="incomeReportsStore.byCurrencyStore.setPageSize"
      />
      <search-input @change="incomeReportsStore.byCurrencyStore.search" />
      <RefreshBtn
        @click="incomeReportsStore.byCurrencyStore.refresh"
        :loading="incomeReportsStore.byCurrencyStore.isLoading"
      />
      <excel-btn
        :loading="incomeReportsStore.byCurrencyStore.isExcelFileDownloading"
        @click="onDownloadExcelFile"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="headers"
        :sorted="incomeReportsStore.byCurrencyStore.params.order_by"
        :loading="incomeReportsStore.byCurrencyStore.isLoading"
        :isEmpty="!incomeReportsStore.byCurrencyStore.data?.items?.length"
        @sort="incomeReportsStore.byCurrencyStore.sortData"
      >
        <template #body>
          <template
            v-for="data in incomeReportsStore.byCurrencyStore.data?.items"
            :key="data?.currency_id"
          >
            <c-tr>
              <c-td-no-edit
                v-for="(key, index) in headers"
                :key="index"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.key === 'total_amount'">
                  {{ getFormattedAmount(data[key.key]) }}
                  <span>{{ data?.total_amount_currency_code }}</span>
                </div>
                <div v-else>
                  {{
                    getDataValue(
                        data,
                        key.accessorKey || key.key,
                        key.type
                    )
                  }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="incomeReportsStore.byCurrencyStore.params.page_size"
        :page-number="incomeReportsStore.byCurrencyStore.data?.page_number"
        :total-count="incomeReportsStore.byCurrencyStore.data?.total_count"
      />
      <page-index
        :available-pages="incomeReportsStore.byCurrencyStore.data?.total_pages"
        :current-page="incomeReportsStore.byCurrencyStore.data?.page_number"
        @setPage="incomeReportsStore.byCurrencyStore.setPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { getFormattedAmount } from "~/utils/filter";
import { getDataValue } from "~/utils/helpers";

// Stores
const incomeReportsStore = useCashboxIncomeReportsStore("main");

// States
const headers = ref<Template[]>([
  ...incomeReportsStore.byCurrencyHeadersBefore,
  ...incomeReportsStore.byCurrencyHeadersAfter,
]);

// Hooks
onMounted(() => {
  incomeReportsStore.byCurrencyStore.templates = headers.value;
});

// Methods
const onDownloadExcelFile = async () => {
  await incomeReportsStore.byCurrencyStore.onDownloadExcelFile();
};

const onChangeTableHeaders = (newValue: Template[]) => {
  headers.value = newValue;
};
<\/script>
`;export{e as default};
