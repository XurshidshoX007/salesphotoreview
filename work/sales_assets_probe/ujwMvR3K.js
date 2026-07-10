const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <div class="table-content-btn-group">
        <table-sort-columns
          :templates="suppliersInitialBalanceStore.headers"
          :save-key="supplierInitialBalances"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="suppliersInitialBalanceStore.headers"
          :save-key="supplierInitialBalances"
        />
        <page-size-btn
          :current-size="suppliersInitialBalanceStore.params.page_size"
          :total-count="suppliersInitialBalanceStore.data?.total_count"
          :page-number="suppliersInitialBalanceStore.data?.page_number"
          @setPageSize="suppliersInitialBalanceStore.setPageSize"
        />
        <search-input
          :value="suppliersInitialBalanceStore.params.search"
          @change="suppliersInitialBalanceStore.onSearch"
        />
        <excel-btn
          :loading="suppliersInitialBalanceStore.isExcelFileDownloading"
          @click="suppliersInitialBalanceStore.downloadExcelFile"
        />
        <RefreshBtn
          @click="suppliersInitialBalanceStore.refresh"
          :loading="suppliersInitialBalanceStore.isLoading"
        />
      </div>
    </div>
    <div class="table-content-body">
      <data-table
        :headers="suppliersInitialBalanceStore.headers"
        :sorted="suppliersInitialBalanceStore.params.order_by"
        :loading="suppliersInitialBalanceStore.isLoading"
        :isEmpty="!suppliersInitialBalanceStore.data?.items?.length"
        @sort="suppliersInitialBalanceStore.sortData"
      >
        <template #body>
          <template
            v-for="data in suppliersInitialBalanceStore.data?.items"
            :key="data.visual_id"
          >
            <c-tr>
              <c-td-no-edit
                v-for="key in suppliersInitialBalanceStore.headers"
                :key="key.key"
                :type="key.type"
              >
                <div v-if="key.type === 'date'">
                  {{ getFormattedDate(getNestedValue(data, key.key)) }}
                </div>
                <div v-else-if="key.type === 'object'">
                  {{
                    key.accessorKey
                      ? getNestedValue(data, key.accessorKey)
                      : getDataValue(data, key.key)?.name
                  }}
                </div>
                <div v-else-if="key.type === 'number'">
                  {{ getFormattedAmount(getNestedValue(data, key.key)) }}
                </div>
                <div v-else-if="key.key === 'is_debt'">
                  {{
                    getDataValue(data, key.key)
                      ? t("column.debt")
                      : t("clients.payment")
                  }}
                </div>
                <div v-else>
                  {{ getDataValue(data, key.key) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="suppliersInitialBalanceStore.params.page_size"
        :total-count="suppliersInitialBalanceStore.data?.total_count"
        :page-number="suppliersInitialBalanceStore.data?.page_number"
      />
      <page-index
        :available-pages="suppliersInitialBalanceStore.data?.total_pages"
        :current-page="suppliersInitialBalanceStore.data?.page_number"
        @setPage="suppliersInitialBalanceStore.setPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { supplierInitialBalances } from "~/variable/column-constants";
import { getFormattedDate } from "~/utils/formatters";
import { getNestedValue } from "~/utils/helpers";
import { useI18n } from "vue-i18n";
import { getFormattedAmount } from "~/utils/filter";
import type { Template } from "~/interfaces/ui/template";
import type { InitialBalanceListItemModel } from "~/interfaces/api/supplier/initial-balance-models";

// stores
const suppliersInitialBalanceStore = useSuppliersInitialBalanceStore("main");

// states
const { t } = useI18n();

// hooks
onMounted(async () => await suppliersInitialBalanceStore.getData());

// methods
const getDataValue = (data: InitialBalanceListItemModel, key: string) => {
  return (data as any)[key];
};

const onChangeTableHeaders = (newValue: Template[]) => {
  suppliersInitialBalanceStore.headers = newValue;
};
<\/script>
`;export{e as default};
