const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="tarasHeader"
        :templates="tarasStore.templates"
        @onChangeTableHeaders="change"
      />
      <ShowHideColumn :headers="tarasStore.templates" :save-key="tarasHeader" />
      <page-size-btn
        :current-size="tarasStore.params.page_size"
        :total-count="tarasStore.data?.total_count"
        :page-number="tarasStore.data?.page_number"
        @setPageSize="tarasStore.setPageSize"
      />
      <search-input
        @change="tarasStore.search"
        :value="tarasStore.params.search"
      />
      <excel-btn
        @click="tarasStore.onDownloadExcelFile"
        :loading="tarasStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="tarasStore.loading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="tarasStore.templates"
        @sort="tarasStore.sortData"
        :sorted="tarasStore.params.order_by"
        :loading="tarasStore.loading"
        :is-empty="!tarasStore.data?.items.length"
        v-click-outside="() => (showOtherAgents = false)"
      >
        <template #body>
          <c-tr v-for="(data, index) in tarasStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in tarasStore.templates"
              :key="key"
              :is-checked="key.checked"
              :type="key.type"
            >
              <div v-if="key.key === 'products'">
                <show-more :data="data[key.key]" :show-count="2" />
              </div>
              <div v-else-if="key.key === 'action'">
                <rounded-icon-btn
                  type="edit"
                  :iconSize="20"
                  @click="dialogStore.edit({ ...data })"
                />
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
        :current-size="tarasStore.params.page_size"
        :total-count="tarasStore.data?.total_count"
        :page-number="tarasStore.data?.page_number"
      />
      <page-index
        :available-pages="tarasStore.data?.total_pages"
        :current-page="tarasStore.data?.page_number"
        @setPage="tarasStore.setPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Props

import { tarasHeader } from "~/variable/column-constants";

const tarasStore = useTarasStore("main");
function change(param: any) {
  tarasStore.templates = param;
}

// State
const showOtherAgents = ref(null);

// Stores
const dialogStore = useDialogStore("taras");

const refresh = () => {
  tarasStore.refresh();
};
const getOnly2 = (data) => {
  return data.slice(0, 2);
};
<\/script>

<style scoped></style>
`;export{e as default};
