const e=`<template>
  <div class="table-content-container !border-none">
    <div class="table-content-header !px-0">
      <table-sort-columns
        :save-key="segmentsHeader"
        :templates="segmentsStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="segmentsStore.templates"
        :save-key="segmentsHeader"
      />
      <page-size-btn
        :current-size="segmentsStore.params.page_size"
        :total-count="segmentsStore.data?.total_count"
        :page-number="segmentsStore.data?.page_number"
        @setPageSize="segmentsStore.setPageSize"
      />
      <search-input
        @change="segmentsStore.search"
        :value="segmentsStore.params.search"
      />

      <excel-btn
        @click="segmentsStore.onDownloadExcelFile"
        :loading="segmentsStore.isExcelFileDownloading"
      />

      <RefreshBtn @click="refresh" :loading="segmentsStore.loading" />
    </div>

    <div class="table-content-body">
      <data-table
        :headers="segmentsStore.templates"
        :sorted="segmentsStore.params.order_by"
        :loading="segmentsStore.loading"
        :is-empty="!segmentsStore.data?.items.length"
        @sort="segmentsStore.sortData"
      >
        <template #body>
          <c-tr v-for="data in segmentsStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in segmentsStore.templates"
              :key="key.key"
              :is-checked="key.checked"
              :type="key.type"
            >
              <div v-if="key.key === 'action'">
                <rounded-icon-btn
                  type="edit"
                  :iconSize="20"
                  @click="openEditDialog(data.id)"
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
        :current-size="segmentsStore.params.page_size"
        :total-count="segmentsStore.data?.total_count"
        :page-number="segmentsStore.data?.page_number"
      />
      <page-index
        :available-pages="segmentsStore.data?.total_pages"
        :current-page="segmentsStore.data?.page_number"
        @setPage="segmentsStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsProductsSegmentsNewSegment
        :id="editingId"
        @close-dialog="closeEditDialog"
        @clear-fetched-tab="clearFetchedTab"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { segmentsHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// store
const { isActive } = toRefs(props);
const segmentsStore = useSegmentsStore(isActive.value.toString());

// states
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.SEGMENT_TABLE_UPDATE;

// hooks
eventBus.on(updateListEventKey, async (updatedIsActive) => {
  if (updatedIsActive === isActive.value) {
    await getData();
  }
});

onMounted(async () => {
  await getData();
});

// methods

const onChangeTableHeaders = (param: Template[]) => {
  segmentsStore.templates = param;
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
  await segmentsStore.refresh();
};

const getData = async () => {
  await segmentsStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
