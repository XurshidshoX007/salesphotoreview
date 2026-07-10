const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="orderCommentsHeader"
        :templates="headers"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <show-hide-column :headers="headers" :save-key="orderCommentsHeader" />
      <page-size-btn
        :current-size="notesStore.params.page_size"
        @setPageSize="notesStore.setPageSize"
      />
      <search-input @change="notesStore.search" />
      <excel-btn
        @click="notesStore.onDownloadExcelFile"
        :loading="notesStore.isExcelFileDownloading"
      />
      <refresh-btn @click="refresh" :loading="notesStore.isLoading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="headers"
        @sort="notesStore.sortData"
        :sorted="notesStore.params.order_by"
        :is-empty="!notesStore.data?.items.length"
        :loading="notesStore.isLoading"
      >
        <template #body>
          <c-tr v-for="data in notesStore.data?.items" :key="data.id">
            <c-td-no-edit
              v-for="key in headers"
              :key="key.key"
              :is-checked="key.checked"
              :type="key.type"
            >
              <div v-if="key.key === 'action'">
                <rounded-icon-btn
                  type="edit"
                  :iconSize="20"
                  @click="openEditDialog(data?.id?.toString())"
                />
              </div>
              <div v-else>
                {{ getValue(data, key.key, key.type) }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="notesStore.params.page_size"
        :page-number="notesStore.data?.page_number"
        :total-count="notesStore.data?.total_count"
      />
      <page-index
        :available-pages="notesStore.data?.total_pages"
        :current-page="notesStore.data?.page_number"
        @setPage="notesStore.setPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { orderCommentsHeader } from "~/variable/column-constants";
import { ReasonTypes } from "~/variable/static-constants";
import { getDataValue } from "~/utils/helpers";
import type { Template } from "~/interfaces/ui/template";
import type { NoteModel } from "~/interfaces/api/settings/note";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits<{
  (e: "editData", data: string): void;
}>();

// Stores
const { isActive } = toRefs(props);
const notesStore = useAuditNotesStore(isActive.value.toString());

// State
const eventBus = useEventBus();
const updateListEventKey = SettingsEventKeys.ORDER_COMMENTS_TABLE_UPDATE;
const fetchableTypes = [ReasonTypes.AUDIT_NOTE_TYPES];

// Hooks
eventBus.on(updateListEventKey, async (updatedIsActive) => {
  if (updatedIsActive === isActive.value) {
    await getData();
  }
});

const headers = computed(() =>
  notesStore.templates.filter((template) => template.key !== "types"),
);

// Methods
const getValue = (data: NoteModel, key: string, type?: string) => {
  return getDataValue<NoteModel>(data, key, type);
};

const onChangeTableHeaders = (param: Template[]) => {
  notesStore.templates = param;
};

const openEditDialog = (id?: string) => {
  if (!id) return;
  emit("editData", id);
};

const refresh = async () => {
  await notesStore.refresh();
};

const getData = async () => {
  await notesStore.getData(isActive.value.toString());
};

onMounted(async () => {
  notesStore.params.types = fetchableTypes;
  await getData();
});
<\/script>
`;export{e as default};
