const n=`<template>
  <div class="rounded-lg bg-white border-grey px-[2px]">
    <div class="overflow-auto table-containers">
      <data-table
        :headers="headers"
        :sorted="sortedData"
        with-information-above-header
        @sort="sortData"
      >
        <template #body>
          <template v-for="(data, index) in loadedData" :key="index">
            <c-tr class="b-bottom cursor-pointer">
              <c-td-no-edit v-for="key in headers" :key="key.key">
                <div class="py-2">
                  {{ data[key.key] }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </template>
      </data-table>
    </div>
  </div>
</template>

<script setup>
// State
import { ref } from "vue";
const searchText = ref("");
const availablePages = ref(28);
let currentPage = ref(1);
let pageSize = ref(10);
const draggable = ref(false);
// Methods
const active = ref({
  isCreate: false,
  isEdite: false,
});
function openDropdown(index) {
  td.isActive = !td.isActive;
  td.index = index;
}

const td = reactive({
  isActive: false,
  index: -1,
});

function draggableDialog() {
  draggable.value = false;
}
const payment = ref(false);
function closePayment() {
  payment.value = false;
}
let headers = ref([
  {
    name: "№",
    checked: true,
    key: "no",
    is_sortable: false,
  },
  {
    name: "Номер загруза",
    checked: true,
    key: "loadNumber",
    is_sortable: false,
  },
  {
    name: "Дата",
    checked: true,
    key: "data",
    is_sortable: false,
  },
  {
    name: "Экспедитор",
    checked: true,
    key: "expeditor",
    is_sortable: false,
  },
  {
    name: "Количество клиентов",
    checked: true,
    key: "clients",
    is_sortable: false,
  },
  {
    name: "Сумма загруза",
    checked: true,
    key: "amount",
    is_sortable: false,
  },
  {
    name: "Статус загруза",
    checked: true,
    key: "status",
    is_sortable: false,
  },
]);
const loadedData = ref([
  {
    no: "1",
    loadNumber: "№19658",
    data: "25.08.2022",
    expeditor: "Expeditor",
    clients: "5649",
    amount: "4 000 000",
    status: "4 000 000",
  },
  {
    no: "1",
    loadNumber: "№19658",
    data: "25.08.2022",
    expeditor: "Expeditor",
    clients: "5649",
    amount: "4 000 000",
    status: "4 000 000",
  },
  {
    no: "1",
    loadNumber: "№19658",
    data: "25.08.2022",
    expeditor: "Expeditor",
    clients: "5649",
    amount: "4 000 000",
    status: "4 000 000",
  },
  {
    no: "1",
    loadNumber: "№19658",
    data: "25.08.2022",
    expeditor: "Expeditor",
    clients: "5649",
    amount: "4 000 000",
    status: "4 000 000",
  },
  {
    no: "1",
    loadNumber: "№19658",
    data: "25.08.2022",
    expeditor: "Expeditor",
    clients: "5649",
    amount: "4 000 000",
    status: "4 000 000",
  },
  {
    no: "1",
    loadNumber: "№19658",
    data: "25.08.2022",
    expeditor: "Expeditor",
    clients: "5649",
    amount: "4 000 000",
    status: "4 000 000",
  },
]);
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
.brr:nth-child(3) {
  border-right: 1px solid #e1e4e4;
}
.brr:nth-child(5) {
  border-right: 1px solid #e1e4e4;
}
.down {
  display: none;
  box-shadow:
    rgba(136, 165, 191, 0.48) 6px 2px 16px 0px,
    rgba(255, 255, 255, 0.8) -6px -2px 16px 0px;
}

.active-down {
  display: block;
  background-color: white;
}

.down:after {
  position: absolute;
  content: "";
  right: -11px;
  bottom: 40px;
  top: 40px;
  border-left: 15px solid white;
  border-top: 20px solid transparent;
  border-bottom: 20px solid transparent;
}
</style>
`;export{n as default};
