const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :templates="clientsTaraTotal.templates"
        :save-key="clientContainerReportHeader"
        @change="onChangeTableHeaders"
      />
      <ShowHideColumn :headers="clientsTaraTotal.templates" />
      <page-size-btn
        :current-size="clientsTaraTotal.params.pageSize"
        @setPageSize="clientsTaraTotal.setPageSize"
      />
      <search-input
        @change="clientsTaraTotal.search"
        :value="clientsTaraTotal.params.search"
        class="w-full h-38px"
      />
      <excel-btn />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="clientsTaraTotal.templates"
        @sort="sortData"
        :isEmpty="!clientsTaraTotal.data?.items.length"
        :loading="clientsTaraTotal.isLoading"
      >
        <template #body>
          <template v-for="data in clientsTaraTotal.data?.items" :key="data.id">
            <c-tr>
              <c-td-no-edit
                v-for="key in clientsTaraTotal.templates"
                :key="key"
              >
                <div v-show="key.checked" v-if="key.key === 'checkbox'">
                  <checkbox :values="key.checked" />
                </div>
                <div v-show="key.checked">
                  {{ data[key.key] }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <page-index
        :available-pages="clientsTaraTotal.data?.total_pages"
        :current-page="clientsTaraTotal.data?.page_number"
        @setPage="clientsTaraTotal.setPage"
      />
    </div>
  </div>
</template>

<script setup>
// Store
import { clientContainerReportHeader } from "~/variable/column-constants";

const clientsTaraTotal = useClientsTaraTotalStore("");

// Methods

const onChangeTableHeaders = (newVal) => {
  clientsTaraTotal.templates = newVal;
};

onMounted(async () => {
  await clientsTaraTotal.getDataTara();
});
<\/script>

<style scoped>
.check label input {
  display: none; /* Hide the default checkbox */
}

/* Style the artificial checkbox */
.check label span {
  height: 20px;
  width: 20px;
  border-radius: 4px;
  border: 1px solid #d2d7d7;
  display: inline-block;
  position: relative;
}

/* Style its checked state...with a ticked icon */
.check [type="checkbox"]:checked + span:before {
  content: "\\f106";
  position: absolute;
  font-weight: 700;
  color: transparent;
  transition: all 0.4s;
  left: 7px;
  top: 2px;
  width: 5px;
  height: 11px;
  border: solid #299b9b;
  border-width: 0 1px 1px 0;
  -ms-transform: rotate(45deg);
  transform: rotate(45deg);
}

.b-bottom:last-child {
  border-bottom: 1px solid #e1e4e4;
}
</style>
`;export{e as default};
