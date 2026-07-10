const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="rejectsHeader"
        :templates="rejectsStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="rejectsStore.templates"
        :save-key="rejectsHeader"
      />
      <page-size-btn
        :current-size="rejectsStore.params.page_size"
        :total-count="rejectsStore.data?.total_count"
        :page-number="rejectsStore.data?.page_number"
        @setPageSize="rejectsStore.setPageSize"
      />
      <search-input
        @change="rejectsStore.search"
        :value="rejectsStore.params.search"
      />
      <excel-btn
        @click="rejectsStore.onDownloadExcelFile"
        :loading="rejectsStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="rejectsStore.loading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="rejectsStore.templates"
        @sort="rejectsStore.sortData"
        :sorted="rejectsStore.params.order_by"
        :loading="rejectsStore.loading"
        :is-empty="!rejectsStore.data?.items.length"
      >
        <template #body>
          <c-tr v-for="data in rejectsStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in rejectsStore.templates"
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
        :current-size="rejectsStore.params.page_size"
        :total-count="rejectsStore.data?.total_count"
        :page-number="rejectsStore.data?.page_number"
      />
      <page-index
        :available-pages="rejectsStore.data?.total_pages"
        :current-page="rejectsStore.data?.page_number"
        @setPage="rejectsStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsRejectsDataDialog
        :id="editingId"
        @closeDialog="closeEditDialog"
        @clearFetchedTab="clearFetchedTab"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { rejectsHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// store
const { isActive } = toRefs(props);
const rejectsStore = useRejectsStore(isActive.value.toString());

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.REJECTS_TABLE_UPDATE;

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
  rejectsStore.templates = param;
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
  await rejectsStore.refresh();
};

const getData = async () => {
  await rejectsStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
