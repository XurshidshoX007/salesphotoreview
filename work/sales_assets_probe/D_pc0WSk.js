const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="inventoryTypeHeader"
        :templates="inventoryTypesStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="inventoryTypesStore.templates"
        :save-key="inventoryTypeHeader"
      />
      <page-size-btn
        :current-size="inventoryTypesStore.params.page_size"
        :total-count="inventoryTypesStore.data?.total_count"
        :page-number="inventoryTypesStore.data?.page_number"
        @setPageSize="inventoryTypesStore.setPageSize"
      />
      <search-input @change="inventoryTypesStore.search" />
      <excel-btn
        @click="inventoryTypesStore.onDownloadExcelFile"
        :loading="inventoryTypesStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="inventoryTypesStore.loading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="inventoryTypesStore.templates"
        @sort="inventoryTypesStore.sortData"
        :sorted="inventoryTypesStore.params.order_by"
        :loading="inventoryTypesStore.loading"
        :is-empty="!inventoryTypesStore.data?.items.length"
      >
        <template #body>
          <c-tr v-for="data in inventoryTypesStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in inventoryTypesStore.templates"
              :key="key"
              :is-checked="key.checked"
              :type="key.type"
            >
              <div v-if="key.key === 'action'">
                <rounded-icon-btn
                  type="edit"
                  :iconSize="20"
                  @click="openEditDialog(data?.id)"
                />
              </div>
              <div class="text-end" v-else-if="key.type === 'number'">
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
        :current-size="inventoryTypesStore.params.page_size"
        :total-count="inventoryTypesStore.data?.total_count"
        :page-number="inventoryTypesStore.data?.page_number"
      />
      <page-index
        :available-pages="inventoryTypesStore.data?.total_pages"
        :current-page="inventoryTypesStore.data?.page_number"
        @setPage="inventoryTypesStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsInventoryTypesDataDialog
        :id="editingId"
        @clearFetchedTab="clearFetchedTab"
        @closeDialog="closeEditDialog"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { inventoryTypeHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// Store
const { isActive } = toRefs(props);
const inventoryTypesStore = useInventoryTypesStore(isActive.value.toString());

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.INIVENTORY_TYPES_TABLE_UPDATE;

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
const onChangeTableHeaders = (param: Template[]) => {
  inventoryTypesStore.templates = param;
};

const openEditDialog = (id: string | undefined) => {
  if (!id) return;
  editingId.value = id;
};

const closeEditDialog = () => {
  editingId.value = "";
};

const clearFetchedTab = (isActive: boolean) => {
  emit("clearFetchedTab", isActive);
};

const refresh = async () => {
  await inventoryTypesStore.refresh();
};

const getData = async () => {
  await inventoryTypesStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
