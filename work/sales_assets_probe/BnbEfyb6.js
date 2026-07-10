const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="priceHeader"
        :templates="priceStore.templates"
        @onChangeTableHeaders="change"
      />
      <ShowHideColumn :headers="priceStore.templates" :save-key="priceHeader" />
      <page-size-btn
        :current-size="priceStore.params.page_size"
        :total-count="priceStore.sale?.total_count"
        :page-number="priceStore.sale?.page_number"
        @setPageSize="priceStore.setPricePageSize"
      />
      <search-input @change="priceStore.search" />
      <excel-btn
        @click="priceStore.onDownloadExcelFile"
        :loading="priceStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="priceStore.loadingSale" />
    </div>
    <div class="table-content-body">
      <data-table
        :loading="priceStore.loadingSale"
        :headers="priceStore.templates"
        @sort="priceStore.sortData"
        :sorted="priceStore.params.order_by"
        :is-empty="!priceStore.sale?.items?.length"
      >
        <template #body>
          <c-tr v-for="(data, index) in priceStore.sale?.items" :key="data">
            <c-td-no-edit
              v-for="key in priceStore.templates"
              :key="key"
              :is-checked="key.checked"
              :type="key.type"
            >
              <div v-if="key.type === 'date'">
                {{ getFormattedDate(data.date, "DD.MM.YYYY") }}
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
        :current-size="priceStore.params.page_size"
        :total-count="priceStore.sale?.total_count"
        :page-number="priceStore.sale?.page_number"
      />
      <page-index
        :available-pages="priceStore.sale?.total_pages"
        :current-page="priceStore.sale?.page_number"
        @setPage="priceStore.setPricePage"
      />
    </div>
  </div>
</template>

<script setup>
import { getFormattedDate } from "~/utils/formatters";
import { priceHeader } from "~/variable/column-constants";

// Store
const priceStore = usePriceStore("");

// State
const router = useRouter();

// hooks
onMounted(async () => await priceStore.getPriceSale());

// Methods
function change(param) {
  priceStore.templates = param;
}

const refresh = () => {
  priceStore.refresh();
};
<\/script>
`;export{e as default};
