const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="priceHeader"
        :templates="priceStore.templates"
        @onChangeTableHeaders="change"
      />
      <ShowHideColumn :headers="priceStore.templates" />
      <page-size-btn
        :current-size="priceStore.paramsPurchase.page_size"
        :total-count="priceStore.purchase?.total_count"
        :page-number="priceStore.purchase?.page_number"
        @setPageSize="priceStore.setPurchasePageSize"
      />
      <search-input @change="priceStore.searchPurchase" />
      <excel-btn />
      <RefreshBtn
        :loading="priceStore.loadingPurchase"
        @click="priceStore.refreshPurchase"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="priceStore.templates"
        @sort="priceStore.sortPurchaseData"
        :sorted="priceStore.paramsPurchase.order_by"
        :is-empty="!priceStore.purchase?.items?.length"
        :loading="priceStore.loadingPurchase"
      >
        <template #body>
          <c-tr v-for="data in priceStore.purchase?.items" :key="data">
            <c-td-no-edit
              v-for="key in priceStore.templates"
              :key="key"
              :is-checked="key.checked"
              :type="key.type"
            >
              <div v-if="key.key === 'date'">
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
        :current-size="priceStore.paramsPurchase.page_size"
        :total-count="priceStore.purchase?.total_count"
        :page-number="priceStore.purchase?.page_number"
      />
      <page-index
        :available-pages="priceStore.purchase?.total_pages"
        :current-page="priceStore.purchase?.page_number"
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

// hooks
onMounted(async () => await priceStore.getPricePurchase());

// Methods
function change(param) {
  priceStore.templates = param;
}
<\/script>
`;export{e as default};
