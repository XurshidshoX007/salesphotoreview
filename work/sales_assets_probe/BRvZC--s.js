const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="photoReportHeader"
        :templates="photoReportCategoriesStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="photoReportCategoriesStore.templates"
        :save-key="photoReportHeader"
      />
      <page-size-btn
        :current-size="photoReportCategoriesStore.params.page_size"
        :total-count="photoReportCategoriesStore.data?.total_count"
        :page-number="photoReportCategoriesStore.data?.page_number"
        @setPageSize="photoReportCategoriesStore.setPageSize"
      />
      <search-input @change="photoReportCategoriesStore.search" />
      <excel-btn
        @click="photoReportCategoriesStore.onDownloadExcelFile"
        :loading="photoReportCategoriesStore.isExcelFileDownloading"
      />
      <RefreshBtn
        @click="refresh"
        :loading="photoReportCategoriesStore.loading"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="photoReportCategoriesStore.templates"
        @sort="photoReportCategoriesStore.sortData"
        :sorted="photoReportCategoriesStore.params.order_by"
        :loading="photoReportCategoriesStore.loading"
        :is-empty="!photoReportCategoriesStore.data?.items.length"
      >
        <template #body>
          <c-tr
            v-for="data in photoReportCategoriesStore.data?.items"
            :key="data"
          >
            <c-td-no-edit
              v-for="key in photoReportCategoriesStore.templates"
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
        :current-size="photoReportCategoriesStore.params.page_size"
        :total-count="photoReportCategoriesStore.data?.total_count"
        :page-number="photoReportCategoriesStore.data?.page_number"
      />

      <page-index
        :available-pages="photoReportCategoriesStore.data?.total_pages"
        :current-page="photoReportCategoriesStore.data?.page_number"
        @setPage="photoReportCategoriesStore.setPage"
      />
    </div>
    <transition name="modal">
      <div v-if="editingId">
        <SettingsPhotoReportCategoriesDataDialog
          :id="editingId"
          @clearFetchedTab="clearFetchedTab"
          @closeDialog="closeEditDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { photoReportHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// Store
const { isActive } = toRefs(props);
const photoReportCategoriesStore = usePhotoReportCategoriesStore(
  isActive.value.toString(),
);

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey =
  SettingsEventKeys.PHOTO_REPORT_CATEGORIES_TABLE_UPDATE;

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
  photoReportCategoriesStore.templates = param;
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
  await photoReportCategoriesStore.refresh();
};

const getData = async () => {
  await photoReportCategoriesStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
