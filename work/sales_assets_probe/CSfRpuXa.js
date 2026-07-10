const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="priceListHeader"
        :templates="columnTable"
        @onChangeTableHeaders="change"
      />
      <ShowHideColumn
        :headers="priceStore.templatesPriceList"
        :save-key="priceListHeader"
      />
      <page-size-btn
        :current-size="priceStore.priceListParams.page_size"
        @setPageSize="priceStore.setPageSize"
      />
      <search-input @change="priceStore.searchPriceList" />
      <excel-btn
        v-if="hasAccess2PriceList"
        :loading="priceStore.isExcelFileDownloadingForPurchase"
        @click="priceStore.onDownloadExcelFileForPurchase"
      />
      <RefreshBtn
        @click="priceStore.refreshPriceList"
        :loading="priceStore.loading"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="columnTable"
        :is-empty="!priceStore.priceList?.items?.length"
        :loading="priceStore.loadingPriceList"
        @sort="priceStore.sortPriceData"
        :sorted="priceStore.priceListParams.order_by"
      >
        <template #body>
          <c-tr
            v-for="(data, index) in priceStore.priceList?.items"
            :key="data.visual_id"
          >
            <c-td-no-edit
              v-for="key in columnTable"
              :key="key"
              :is-checked="key.checked"
              :type="key.type"
            >
              <div v-if="key?.id">
                {{ checkPriceCount(data?.prices, key.id) }}
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
        :current-size="priceStore.priceListParams.page_size"
        :total-count="priceStore.priceList?.total_count"
        :page-number="priceStore.priceList?.page_number"
      />
      <page-index
        :available-pages="priceStore.priceList?.total_pages"
        :current-page="priceStore.priceList?.page_number"
        @setPage="priceStore.setPage"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
// Store
import { priceListHeader } from "~/variable/column-constants";
import { useSettingsPriceAccess } from "~/composables/access/settings/price/price";

const filtersStore = useFiltersStore("/settings/prices/list/table");

const priceStore = usePriceStore("main");
const { hasAccess2PriceList } = useSettingsPriceAccess();
// Methods
const columnTable = ref([...priceStore.templatesPriceList]);

function change(param: any) {
  priceStore.templatesPriceList = param;
}

onMounted(async () => {
  await filtersStore.getPriceTypes();
  createColumnFunction();
});

const createColumnFunction = () => {
  filtersStore.priceTypes?.items?.map((item) => {
    columnTable.value.push({
      name: item.name,
      key: item.id,
      id: item.id,
      checked: true,
      type: "number",
      is_sortable: false,
    });
  });
  priceStore.priceListFullTemplateForExcel = columnTable.value;
};

const checkPriceCount = (list: any, id: string) => {
  return getFormattedAmount(
    list?.find((item) => item.price_type_id === id)?.price,
  );
};
<\/script>
`;export{e as default};
