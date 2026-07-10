const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :templates="headers"
        :save-key="bonusesRetailOutletsHeader"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="headers"
        :save-key="bonusesRetailOutletsHeader"
      />
      <page-size-btn
        :current-size="clientsRemainsStore.byProductParams.page_size"
        :total-count="clientsRemainsStore?.byProductParams?.total_count"
        :page-number="clientsRemainsStore?.byProductParams?.page_number"
        @setPageSize="clientsRemainsStore.setPageSizeByProduct"
      />
      <search-input @change="clientsRemainsStore.searchFromByProduct" />
      <excel-btn />
      <RefreshBtn
        @click="refresh"
        :loading="clientsRemainsStore.isLoadingByProduct"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="headers"
        :sorted="clientsRemainsStore.byProductParams.order_by"
        :isEmpty="!clientsRemainsStore.byProductData?.items.length"
        :loading="clientsRemainsStore.isLoadingByProduct"
        @sort="clientsRemainsStore.sortDataByProduct"
      >
        <template #body>
          <template
            v-for="data in clientsRemainsStore.byProductData?.items"
            :key="data?.client_id"
          >
            <c-tr>
              <c-td-no-edit
                v-for="key in headers"
                :key="key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.type === 'number'">
                  {{ getFormattedAmount(data[key.key]) }}
                </div>
                <div v-else>
                  {{ data[key.key] }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="clientsRemainsStore.byProductParams.page_size"
        :total-count="clientsRemainsStore?.byProductParams?.total_count"
        :page-number="clientsRemainsStore?.byProductParams?.page_number"
      />
      <page-index
        :available-pages="clientsRemainsStore.byProductData?.total_pages"
        :current-page="clientsRemainsStore.byProductData?.page_number"
        @setPage="clientsRemainsStore.setPageByProduct"
      />
    </div>
  </div>
</template>

<script setup>
// Stores
import { bonusesRetailOutletsHeader } from "~/variable/column-constants";

const clientsRemainsStore = useClientsRemainsStore("main");

const props = defineProps({
  isActive: Boolean,
});

// State
const headers = ref([...clientsRemainsStore.headers]);

// Methods
const getData = async () => {
  if (!clientsRemainsStore.byProductData && props.isActive) {
    await clientsRemainsStore.getDataByProducts();
  }
};

watchEffect(async () => {
  if (props.isActive) {
    await getData();
  }
});

const onChangeTableHeaders = (param) => {
  headers.value = param;
};
const refresh = () => {
  clientsRemainsStore.refreshByProduct();
};
<\/script>

<style scoped>
.b-bottom:last-child {
  border-bottom: 1px solid #e1e4e4;
}
</style>
`;export{e as default};
