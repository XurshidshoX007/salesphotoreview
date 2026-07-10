const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="suppliersColumn"
        :templates="suppliersStore.headers"
        @onChangeTableHeaders="onChangeHeaders"
      />
      <ShowHideColumn
        :headers="suppliersStore.headers"
        :save-key="suppliersColumn"
      />
      <page-size-btn
        :current-size="suppliersStore.params.page_size"
        :total-count="suppliersStore.data?.total_count"
        :page-number="suppliersStore.data?.page_number"
        @setPageSize="suppliersStore.setPageSize"
      />
      <search-input
        @change="suppliersStore.onSearch"
        :value="suppliersStore.params.search"
      />
      <excel-btn />
      <RefreshBtn @click="refresh" :loading="suppliersStore.isLoading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="suppliersStore.headers"
        :loading="suppliersStore.isLoading"
        @sort="suppliersStore.sortData"
        :sorted="suppliersStore.params.order_by"
        :is-empty="!suppliersStore.data?.items.length"
      >
        <template #body>
          <template
            v-for="(data, index) in suppliersStore.data?.items"
            :key="data?.id"
          >
            <c-tr>
              <c-td-no-edit
                v-for="key in suppliersStore.headers"
                :key="key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div
                  v-if="key.key === 'action'"
                  class="flex items-center justify-end gap-x-3"
                >
                  <rounded-icon-btn
                    v-if="allowToDetail"
                    type="edit"
                    :iconSize="20"
                    @click="editingId = data.id"
                  />

                  <div v-if="allowToDelete" v-show="!isActive || index !== 0">
                    <rounded-icon-btn
                      type="danger"
                      @click="deletingId = data.id"
                    />
                  </div>
                </div>
                <div
                  v-else-if="typeof data[key.key] === 'number'"
                  class="text-end"
                >
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
    <div v-if="suppliersStore.data?.items.length" class="table-content-footer">
      <curren-page-btn
        :current-size="suppliersStore.params.page_size"
        :total-count="suppliersStore.data?.total_count"
        :page-number="suppliersStore.data?.page_number"
      />
      <page-index
        :available-pages="suppliersStore.data?.total_pages"
        :current-page="suppliersStore.data?.page_number"
        @setPage="suppliersStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SuppliersSuppliersDataDialog
        modal-name="Ред. поставщика"
        :allow-to-save="allowToUpdate"
        :id="editingId"
        @closeDialog="editingId = ''"
        @clearFetchedTab="clearFetchedTab"
      />
    </div>
  </transition>
  <transition name="modal">
    <div v-if="deletingId">
      <CommonDeletedDialog
        is-agree
        @onSelectExit="closeDeleteDialog"
        @onSelectDelete="onDelete"
      />
    </div>
  </transition>
</template>

<script setup>
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SupplierEventKeys } from "~/variable/event-key-constants";
import { suppliersColumn } from "~/variable/column-constants";

// props
const props = defineProps({
  isActive: Boolean,
  allowToDetail: Boolean,
  allowToUpdate: Boolean,
  allowToDelete: Boolean,
});

// emits
const emit = defineEmits(["clearFetchedTab"]);

// store
const { isActive } = toRefs(props);
const suppliersStore = useSuppliersStore(isActive.value.toString());

// State
const eventBus = useEventBus();
const editingId = ref("");
const deletingId = ref("");
const updateListEventKey = SupplierEventKeys.SUPPLIER_TABLE_UPDATE;

// hooks
eventBus.on(updateListEventKey, async (updatedIsActive) => {
  if (updatedIsActive === isActive.value) {
    await getData();
  }
});

onMounted(async () => {
  await getData();
});

// Methods
const getData = async () => {
  await suppliersStore.getData(isActive.value.toString());
};

const onChangeHeaders = (param) => {
  suppliersStore.headers = param;
};

const closeDeleteDialog = () => {
  deletingId.value = "";
};

const clearFetchedTab = (isActive) => {
  emit("clearFetchedTab", isActive);
};

const onDelete = async () => {
  const res = await suppliersStore.onDeleteById(deletingId.value);
  if (res !== "error") {
    closeDeleteDialog();
    await refresh();
  }
};

const refresh = async () => {
  await suppliersStore.refresh();
};
<\/script>
`;export{e as default};
