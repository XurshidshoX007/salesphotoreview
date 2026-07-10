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
        :current-size="clientsRemainsStore.byCategoryParams.page_size"
        :total-count="clientsRemainsStore.byCategoryData?.total_count"
        :page-number="clientsRemainsStore.byCategoryData?.page_number"
        @setPageSize="clientsRemainsStore.setPageSizeByCategory"
      />
      <search-input @change="clientsRemainsStore.searchFromByCategory" />
      <excel-btn />
      <RefreshBtn
        @click="refresh"
        :loading="clientsRemainsStore.isLoadingByCategory"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="headers"
        @sort="clientsRemainsStore.sortDataByCategory"
        :sorted="clientsRemainsStore.byCategoryParams.order_by"
        :isEmpty="!clientsRemainsStore.byCategoryData?.items.length"
        :loading="clientsRemainsStore.isLoadingByCategory"
      >
        <template #body>
          <template
            v-for="data in clientsRemainsStore.byCategoryData?.items"
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
        :current-size="clientsRemainsStore.byCategoryParams.page_size"
        :total-count="clientsRemainsStore.byCategoryData?.total_count"
        :page-number="clientsRemainsStore.byCategoryData?.page_number"
      />
      <page-index
        :available-pages="clientsRemainsStore.byCategoryData?.total_pages"
        :current-page="clientsRemainsStore.byCategoryData?.page_number"
        @setPage="clientsRemainsStore.setPageByCategory"
      />
    </div>
  </div>
</template>

<script setup>
// Stores
import CurrenPageBtn from "~/components/global/currenPageBtn.vue";
import { bonusesRetailOutletsHeader } from "~/variable/column-constants";

const clientsRemainsStore = useClientsRemainsStore("main");

const props = defineProps({
  isActive: Boolean,
});

// State
const headers = ref([...clientsRemainsStore.headers]);

// Methods
const getData = async () => {
  if (!clientsRemainsStore.byCategoryData) {
    await clientsRemainsStore.getDataByCategory();
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
  clientsRemainsStore.refreshByCategory();
};
<\/script>
`;export{e as default};
