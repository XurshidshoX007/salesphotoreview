const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="clientTypeHeader"
        :templates="clientTypesStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="clientTypesStore.templates"
        :save-key="clientTypeHeader"
      />
      <page-size-btn
        :current-size="clientTypesStore.params.page_size"
        :total-count="clientTypesStore.data?.total_count"
        :page-number="clientTypesStore.data?.page_number"
        @setPageSize="clientTypesStore.setPageSize"
      />
      <search-input
        @change="clientTypesStore.search"
        :value="clientTypesStore.params.search"
      />

      <excel-btn
        @click="clientTypesStore.onDownloadExcelFile"
        :loading="clientTypesStore.isExcelFileDownloading"
      />

      <RefreshBtn @click="refresh" :loading="clientTypesStore.loading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="clientTypesStore.templates"
        @sort="clientTypesStore.sortData"
        :sorted="clientTypesStore.params.order_by"
        :loading="clientTypesStore.loading"
        :is-empty="!clientTypesStore.data?.items.length"
      >
        <template #body>
          <c-tr v-for="data in clientTypesStore.data?.items" :key="data.id">
            <c-td-no-edit
              v-for="key in clientTypesStore.templates"
              :key="key"
              :is-checked="key.checked"
              :type="key.type"
            >
              <div v-if="key.type === 'color'">
                <sm-btn
                  :style="{ background: data[key.key] }"
                  class="p-3 cursor-auto"
                ></sm-btn>
              </div>
              <div v-else-if="key.type === 'action'">
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
        :current-size="clientTypesStore.params.page_size"
        :total-count="clientTypesStore.data?.total_count"
        :page-number="clientTypesStore.data?.page_number"
      />
      <page-index
        :available-pages="clientTypesStore.data?.total_pages"
        :current-page="clientTypesStore.data?.page_number"
        @setPage="clientTypesStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsClientTypesDataDialog
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
import { clientTypeHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// store
const { isActive } = toRefs(props);
const clientTypesStore = useClientTypesStore(isActive.value.toString());

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.CLIENT_TYPES_TABLE_UPDATE;

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
  clientTypesStore.templates = param;
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
  await clientTypesStore.refresh();
};

const getData = async () => {
  await clientTypesStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
