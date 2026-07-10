const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="boxTypeHeader"
        :templates="boxTypesStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="boxTypesStore.templates"
        :save-key="boxTypeHeader"
      />
      <page-size-btn
        :current-size="boxTypesStore.params.page_size"
        :total-count="boxTypesStore.data?.total_count"
        :page-number="boxTypesStore.data?.page_number"
        @setPageSize="boxTypesStore.setPageSize"
      />
      <search-input
        @change="boxTypesStore.search"
        :value="boxTypesStore.params.search"
      />
      <excel-btn
        @click="boxTypesStore.onDownloadExcelFile"
        :loading="boxTypesStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="boxTypesStore.loading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="boxTypesStore.templates"
        :sorted="boxTypesStore.params.order_by"
        :loading="boxTypesStore.loading"
        :is-empty="!boxTypesStore.data?.items.length"
        @sort="boxTypesStore.sortData"
      >
        <template #body>
          <c-tr v-for="data in boxTypesStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in boxTypesStore.templates"
              :key="key.key"
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
              <div v-else-if="key.type === 'number'">
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
        :current-size="boxTypesStore.params.page_size"
        :total-count="boxTypesStore.data?.total_count"
        :page-number="boxTypesStore.data?.page_number"
      />
      <page-index
        :available-pages="boxTypesStore.data?.total_pages"
        :current-page="boxTypesStore.data?.page_number"
        @setPage="boxTypesStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsBoxTypesDataDialog
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
import { boxTypeHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// Store
const { isActive } = toRefs(props);
const boxTypesStore = useBoxTypesStore(isActive.value.toString());

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.BOX_TYPES_TABLE_UPDATE;

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
  boxTypesStore.templates = param;
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
  await boxTypesStore.refresh();
};

const getData = async () => {
  await boxTypesStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
