const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :templates="clientsTaraDebts.templates"
        :save-key="clientTaraDebtHeader"
        @change="onChangeTableHeaders"
      />
      <ShowHideColumn :headers="clientsTaraDebts.templates" />
      <page-size-btn
        :current-size="clientsTaraDebts.params.page_size"
        @setPageSize="clientsTaraDebts.setPageSize"
      />
      <search-input
        @change="clientsTaraDebts.search"
        :value="clientsTaraDebts.params.search"
      />
      <excel-btn />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="clientsTaraDebts.templates"
        @sort="sortData"
        :sorted="sortedData"
        :isEmpty="!clientsTaraDebts.data?.items.length"
        :loading="clientsTaraDebts.isLoading"
      >
        <template #body>
          <template
            v-for="(data, index) in clientsTaraDebts.data?.items"
            :key="index"
          >
            <c-tr>
              <c-td-no-edit
                v-for="key in clientsTaraDebts?.templates"
                :key="key"
              >
                <div class="pt-2 check" v-if="key.key === 'checkbox'">
                  <checkbox :values="key.checked" />
                </div>
                <div
                  @click="paymentModal = true"
                  class="pt-2 check"
                  v-if="key.key === 'id'"
                >
                  {{ data[key.key] }}
                </div>
                <div class="p-2" v-if="key.checked && key.key !== 'id'">
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
        :available-pages="clientsTaraDebts.data?.total_pages"
        :current-page="clientsTaraDebts.data?.page_number"
        @setPage="clientsTaraDebts.setPage"
      />
    </div>
  </div>
</template>

<script setup>
// store
import { clientTaraDebtHeader } from "~/variable/column-constants";

const clientsTaraDebts = useClientsTaraStore("main");

// Methods

function onChangeTableHeaders(param) {
  clientsTaraDebts.templates = param;
}
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
