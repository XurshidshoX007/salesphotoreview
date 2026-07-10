const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :templates="employeeRejectsStore.templates"
        :save-key="refusalsColumn"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="employeeRejectsStore.templates"
        :save-key="refusalsColumn"
      />
      <page-size-btn
        :current-size="employeeRejectsStore.params.page_size"
        :total-count="employeeRejectsStore.data?.total_count"
        :page-number="employeeRejectsStore.data?.page_number"
        @setPageSize="employeeRejectsStore.setPageSize"
      />
      <search-input @change="employeeRejectsStore.search" />
      <excel-btn
        @click="employeeRejectsStore.onDownloadExcelFile"
        :loading="employeeRejectsStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="employeeRejectsStore.isLoading" />
    </div>
    <div class="table-content-body">
      <data-table
        :loading="employeeRejectsStore.isLoading"
        :headers="employeeRejectsStore.templates"
        @sort="employeeRejectsStore.sortData"
        :sorted="employeeRejectsStore.params.order_by"
        :isEmpty="!employeeRejectsStore.data?.items.length"
      >
        <template #body>
          <template
            v-for="(data, index) in employeeRejectsStore.data?.items"
            :key="index"
          >
            <c-tr>
              <c-td-no-edit
                v-for="key in employeeRejectsStore.templates"
                :key="key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.key === 'client_name'">
                  <link-component
                    :to="\`/clients/about-clients/\${data?.client_id}\`"
                    :value="data[key.key]"
                  />
                </div>
                <div v-else-if="key.type === 'date'">
                  {{ getFormattedDate(data[key.key], "YYYY.MM.DD") }}
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
        :current-size="employeeRejectsStore.params.page_size"
        :total-count="employeeRejectsStore.data?.total_count"
        :page-number="employeeRejectsStore.data?.page_number"
      />
      <page-index
        :available-pages="employeeRejectsStore.data?.total_pages"
        :current-page="employeeRejectsStore.data?.page_number"
        @setPage="employeeRejectsStore.setPage"
      />
    </div>
  </div>
</template>

<script setup>
import { getFormattedDate } from "~/utils/formatters";
import { refusalsColumn } from "~/variable/column-constants";

// store
const employeeRejectsStore = useEmployeeRejectsStore("main");

// State

// Methods
const refresh = () => {
  employeeRejectsStore.refresh();
};

const onChangeTableHeaders = (newValue) => {
  employeeRejectsStore.templates = newValue;
};
<\/script>
`;export{e as default};
