const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="taskTypeHeader"
        :templates="taskTypesStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="taskTypesStore.templates"
        :save-key="taskTypeHeader"
      />
      <page-size-btn
        :current-size="taskTypesStore.params.page_size"
        :total-count="taskTypesStore.data?.total_count"
        :page-number="taskTypesStore.data?.page_number"
        @setPageSize="taskTypesStore.setPageSize"
      />
      <search-input
        @change="taskTypesStore.search"
        :value="taskTypesStore.params.search"
      />
      <excel-btn
        @click="taskTypesStore.onDownloadExcelFile"
        :loading="taskTypesStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="taskTypesStore.loading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="taskTypesStore.templates"
        @sort="taskTypesStore.sortData"
        :sorted="taskTypesStore.params.order_by"
        :loading="taskTypesStore.loading"
        :is-empty="!taskTypesStore.data?.items.length"
      >
        <template #body>
          <c-tr v-for="data in taskTypesStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in taskTypesStore.templates"
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
        :current-size="taskTypesStore.params.page_size"
        :total-count="taskTypesStore.data?.total_count"
        :page-number="taskTypesStore.data?.page_number"
      />
      <page-index
        :available-pages="taskTypesStore.data?.total_pages"
        :current-page="taskTypesStore.data?.page_number"
        @setPage="taskTypesStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsTaskTypesDataDialog
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
import { taskTypeHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// store
const { isActive } = toRefs(props);
const taskTypesStore = useTaskTypesStore(isActive.value.toString());

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.TASK_TYPES_TABLE_UPDATE;

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
  taskTypesStore.templates = param;
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
  await taskTypesStore.refresh();
};

const getData = async () => {
  await taskTypesStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
