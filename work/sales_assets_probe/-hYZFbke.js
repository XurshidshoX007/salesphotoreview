const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="clientFormatHeader"
        :templates="clientFormatStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="clientFormatStore.templates"
        :save-key="clientFormatHeader"
      />
      <page-size-btn
        :current-size="clientFormatStore.params.page_size"
        :total-count="clientFormatStore.data?.total_count"
        :page-number="clientFormatStore.data?.page_number"
        @setPageSize="clientFormatStore.setPageSize"
      />
      <search-input
        @change="clientFormatStore.search"
        :value="clientFormatStore.params.search"
      />
      <excel-btn
        @click="clientFormatStore.onDownloadExcelFile"
        :loading="clientFormatStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="clientFormatStore.loading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="clientFormatStore.templates"
        @sort="clientFormatStore.sortData"
        :is-empty="!clientFormatStore?.data?.items.length"
        :sorted="clientFormatStore.params.order_by"
        :loading="clientFormatStore.loading"
      >
        <template #body>
          <c-tr v-for="data in clientFormatStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in clientFormatStore.templates"
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
        :current-size="clientFormatStore.params.page_size"
        :total-count="clientFormatStore.data?.total_count"
        :page-number="clientFormatStore.data?.page_number"
      />
      <page-index
        :available-pages="clientFormatStore.data?.total_pages"
        :current-page="clientFormatStore.data?.page_number"
        @setPage="clientFormatStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsClientFormatDialog
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
import { clientFormatHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// store
const { isActive } = toRefs(props);
const clientFormatStore = useClientFormatStore(isActive.value.toString());

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.CLIENT_FORMAT_TABLE_UPDATE;

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
  clientFormatStore.templates = param;
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
  await clientFormatStore.refresh();
};

const getData = async () => {
  await clientFormatStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
