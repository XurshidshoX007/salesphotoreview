const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="printersHeader"
        :templates="printersStore.templates"
        @onChangeTableHeaders="change"
      />
      <ShowHideColumn
        :headers="printersStore.templates"
        :save-key="printersHeader"
      />
      <page-size-btn
        :current-size="printersStore.params.page_size"
        :total-count="printersStore.data?.total_count"
        :page-number="printersStore.data?.page_number"
        @setPageSize="printersStore.setPageSize"
      />
      <search-input
        @change="printersStore.search"
        :value="printersStore.params.search"
      />
      <excel-btn
        @click="printersStore.onDownloadExcelFile"
        :loading="printersStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="printersStore.loading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="printersStore.templates"
        @sort="printersStore.sortData"
        :sorted="printersStore.params.order_by"
        :loading="printersStore.loading"
        :is-empty="!printersStore.data?.items.length"
      >
        <template #body>
          <c-tr v-for="data in printersStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in printersStore.templates"
              :key="key"
              :is-checked="key.checked"
              :type="key.type"
            >
              <show-more
                v-if="key.key === 'agents'"
                :show-count="2"
                :data="data[key.key]"
              />
              <div v-else-if="key.key === 'action'">
                <rounded-icon-btn
                  type="edit"
                  :iconSize="20"
                  @click="() => dialogStore.edit({ ...data })"
                />
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
        :current-size="printersStore.params.page_size"
        :total-count="printersStore.data?.total_count"
        :page-number="printersStore.data?.page_number"
      />
      <page-index
        :available-pages="printersStore.data?.total_pages"
        :current-page="printersStore.data?.page_number"
        @setPage="printersStore.setPage"
      />
    </div>
  </div>
</template>

<script setup>
// State
import { printersHeader } from "~/variable/column-constants";

function change(param) {
  printersStore.templates = param;
}
// Stores
const printersStore = usePrintersStore("main");
const dialogStore = useDialogStore("printers");

// Hooks

const refresh = () => {
  printersStore.refresh();
};
<\/script>
`;export{e as default};
