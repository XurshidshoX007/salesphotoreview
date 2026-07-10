const n=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="unitsHeader"
        :templates="unitsStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn :headers="unitsStore.templates" :save-key="unitsHeader" />
      <page-size-btn
        :current-size="unitsStore.params.page_size"
        :total-count="unitsStore.data?.total_count"
        :page-number="unitsStore.data?.page_number"
        @setPageSize="unitsStore.setPageSize"
      />
      <excel-btn
        @click="unitsStore.onDownloadExcelFile"
        :loading="unitsStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="unitsStore.isLoading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="unitsStore.templates"
        @sort="unitsStore.sortData"
        :sorted="unitsStore.params.order_by"
        :loading="unitsStore.isLoading"
        :is-empty="!unitsStore.data?.items?.length"
      >
        <template #body>
          <c-tr v-for="data in unitsStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in unitsStore.templates"
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
        :current-size="unitsStore.params.page_size"
        :total-count="unitsStore.data?.total_count"
        :page-number="unitsStore.data?.page_number"
      />
      <page-index
        :available-pages="unitsStore.data?.total_pages"
        :current-page="unitsStore.data?.page_number"
        @setPage="unitsStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsUnitsDataDialog
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
import { unitsHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// Store
const { isActive } = toRefs(props);
const unitsStore = useUnitsStore(isActive.value.toString());

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.UNITS_TABLE_UPDATE;

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
  unitsStore.templates = param;
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
  await unitsStore.refresh();
};

const getData = async () => {
  await unitsStore.getData(isActive.value.toString());
};
<\/script>
`;export{n as default};
