const n=`<template>
  <div class="flex mb-4 flex-row gap-4 items-center">
    <table-sort-columns
      :save-key="assignmentAgentHeader"
      :templates="assignmentProductsStore.headers"
      @onChangeTableHeaders="onChangeTableHeaders"
    />
    <ShowHideColumn
      :headers="assignmentProductsStore.headers"
      :save-key="assignmentAgentHeader"
    />
    <page-size-btn
      :current-size="assignmentProductsStore.params.page_size"
      :total-count="assignmentProductsStore.data?.total_count"
      :page-number="assignmentProductsStore.data?.page_number"
      @setPageSize="assignmentProductsStore.setPageSize"
    />

    <search-input />
    <excel-btn />
    <RefreshBtn @click="refresh" :loading="assignmentProductsStore.isLoading" />
  </div>
  <div
    v-click-outside="clickOutside"
    class="rounded-lg bg-white border-grey overflow-hidden"
  >
    <div class="w-full overflow-auto pb-4">
      <data-table
        :headers="assignmentProductsStore.headers"
        :loading="assignmentProductsStore.isLoading"
        :withInformationAboveHeader="true"
        @sort="sortData"
        :sorted="sortedData"
      >
        <template #body>
          <template
            v-for="data in assignmentProductsStore.data?.items"
            :key="data.agent_id"
          >
            <c-tr>
              <c-td-no-edit
                v-for="key in assignmentProductsStore.headers"
                :key="key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.key === 'limit'">
                  <div
                    v-if="
                      !sortWarehouses(data[key.key], data.agent_id).length > 0
                    "
                  >
                    Нет ограничений
                  </div>
                  <div v-else>
                    <div
                      v-for="(warehouse, index) in sortWarehouses(
                        data[key.key],
                        data.agent_id,
                      )"
                      :key="index"
                    >
                      <div
                        class="flex gap-2.5 items-center"
                        @click="
                          onOpenLimitDropdown(
                            warehouse.warehouse_id,
                            data.agent_id,
                          )
                        "
                      >
                        <IconPlus
                          v-if="
                            openLimitDropdown.warehouse_id !==
                            warehouse.warehouse_id
                          "
                        /><IconMinus v-else />
                        <div class="flex gap-3 items-center">
                          {{ warehouse.name }} ({{
                            warehouse.warehouse_amount
                          }}) шт.
                          <div
                            @click="
                              assignmentProductsStore.deleteDialog =
                                warehouse.id
                            "
                          >
                            <IconTrash :size="22" class="text-red-600" />
                          </div>
                        </div>
                      </div>
                      <div
                        v-if="
                          openLimitDropdown.row_id === data.agent_id &&
                          openLimitDropdown.warehouse_id ===
                            warehouse.warehouse_id
                        "
                      >
                        <div
                          v-for="product in warehouse.products"
                          :key="product.amount"
                        >
                          <div class="text-[#8FA0A0]">
                            {{ product.product_name }} ({{
                              product.product_amount
                            }}) шт.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else-if="key.key === 'quantity'">
                  {{ quantities[data.agent_id] }}
                </div>
                <div
                  v-else-if="key.key === 'action'"
                  class="group flex justify-end"
                >
                  <Tooltip class="left" tooltip="Создать ограничения" />
                  <nuxt-link
                    :to="\`/users/assignment-agent-product/\${data.agent_id}\`"
                  >
                    <IconUserBlock class="cursor-pointer w-8" />
                  </nuxt-link>
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
    <div class="flex justify-between w-full">
      <div class="flex p-3 gap-2 items-center">
        <curren-page-btn
          :current-size="assignmentProductsStore.params.page_size"
          :total-count="assignmentProductsStore.data?.total_count"
          :page-number="assignmentProductsStore.data?.page_number"
        />
      </div>
      <div class="p-3">
        <page-index
          :available-pages="assignmentProductsStore.data?.total_pages"
          :current-page="assignmentProductsStore.data?.page_number"
          @setPage="assignmentProductsStore.setPage"
        />
      </div>
    </div>
  </div>
  <transition name="modal">
    <div v-if="assignmentProductsStore.deleteDialog">
      <d-modal
        :dataContainerWidth="'360px'"
        @closeDialog="assignmentProductsStore.closeDeleteDialog"
      >
        <UsersDeleteDialog
          :noDescription="true"
          @onAcceptDeleting="assignmentProductsStore.acceptDeleting = $event"
          @closeDialog="assignmentProductsStore.closeDeleteDialog"
          @onDelete="assignmentProductsStore.deleteAgentLimit"
        />
      </d-modal>
    </div>
  </transition>
</template>

<script setup>
// store
import PinIcon from "~/components/icon/pinIcon.vue";
import { assignmentAgentHeader } from "~/variable/column-constants";

const assignmentProductsStore = useAssignmentProductsStore("main");
// State
const quantities = ref({});
const openLimitDropdown = ref({
  row_id: "",
  warehouse_id: "",
});
// Methods

const clickOutside = () => {
  td.isActive = false;
};
function openDropdown(index) {
  td.isActive = !td.isActive;
  td.index = index;
}
const td = reactive({
  isActive: false,
  index: -1,
});
let sortedData = ref({ key: "", mode: "" });

function sortData(data) {
  sortedData.value = data;
}

// Methods
onMounted(async () => {
  await assignmentProductsStore.getData();
});

const onChangeTableHeaders = (value) => {
  assignmentProductsStore.headers = value;
};

const onOpenLimitDropdown = (warehouseId, agentId) => {
  if (
    openLimitDropdown.value.row_id === agentId &&
    openLimitDropdown.value.warehouse_id === warehouseId
  ) {
    openLimitDropdown.value.row_id = "";
    openLimitDropdown.value.warehouse_id = "";
  } else {
    openLimitDropdown.value.row_id = agentId;
    openLimitDropdown.value.warehouse_id = warehouseId;
  }
};

const sortWarehouses = (array, agentId) => {
  const warehouses = [];

  array.forEach((item) => {
    const warehouseIndex = warehouses.findIndex(
      (warehouse) => warehouse && warehouse.warehouse_id === item.warehouse_id,
    );

    if (warehouseIndex !== -1) {
      warehouses[warehouseIndex].warehouse_amount += parseInt(item.amount);
      warehouses[warehouseIndex].products.push({
        product_amount: item.amount,
        product_name: item.product_name,
      });
    } else {
      warehouses.push({
        id: item.id,
        warehouse_id: item.warehouse_id,
        warehouse_amount: item.amount,
        name: item.warehouse_name,
        products: [
          {
            product_amount: item.amount,
            product_name: item.product_name,
          },
        ],
      });
    }
  });
  if (agentId) {
    let warehouseTotalAmount = 0;
    for (let warehouse of warehouses) {
      warehouseTotalAmount += warehouse.warehouse_amount;
    }
    quantities.value[agentId] = warehouseTotalAmount;
  }
  return warehouses;
};
const refresh = () => {
  assignmentProductsStore.refresh();
};
<\/script>

<style scoped>
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
  bottom: 20px;
  top: 20px;
  border-left: 15px solid white;
  border-top: 20px solid transparent;
  border-bottom: 20px solid transparent;
}
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
.b-top-none {
  border-top: none;
}
</style>
`;export{n as default};
