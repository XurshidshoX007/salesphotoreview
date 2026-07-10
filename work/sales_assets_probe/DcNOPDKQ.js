const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns />
      <ShowHideColumn :headers="headers" />
      <search-input :value="searchText" @updated="searchUpdated" />
      <excel-btn />
    </div>
    <div class="table-content-body">
      <data-table :headers="headers" @sort="sortData" :sorted="sortedData">
        <template #body>
          <template v-for="data in loadedData">
            <c-tr class="border-b-0 b-bottom">
              <c-td-no-edit
                v-for="key in headers"
                :key="key"
                :orderBy="orderBy"
              >
                <div class="p-2" v-if="key.checked">
                  {{ data[key.key] }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </template>
      </data-table>
    </div>
    <div class="flex justify-between w-full">
      <div class="flex p-3 gap-2 items-center">
        <span class="secondary-gray-text fs-14"> Показать по </span>
        <page-size-btn :current-size="pageSize" @setPageSize="setPageSize" />
      </div>
      <div class="p-3">
        <page-index
          :available-pages="availablePages"
          :current-page="currentPage"
          @setPage="setPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  headers: Array,
  loadedData: Array,
});
function change(param) {
  props.headers = param;
  draggable.value = false;
}
// State
const searchText = ref("");
const availablePages = ref(28);
let currentPage = ref(1);
let pageSize = ref(10);
const draggable = ref(false);
const orderBy = ref(true);
// Methods

function draggableDialog() {
  draggable.value = false;
}

function openDropdown(index) {
  td.isActive = !td.isActive;
  td.index = index;
}
const td = reactive({
  isActive: false,
  index: -1,
});

let sortedData = ref({ key: "", mode: "" });

// Methods
function searchUpdated(text) {
  console.log(text);
}

function sortData(data) {
  sortedData.value = data;
}

function setPage(index) {
  currentPage.value = index;
}

function setPageSize(size) {
  pageSize.value = size;
}
<\/script>

<style scoped>
.b-bottom:last-child {
  border-bottom: 1px solid #e1e4e4;
}
</style>
`;export{e as default};
