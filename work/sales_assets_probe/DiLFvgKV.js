const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="kpiProductGroupHeader"
          :templates="kpiProductGroupStore.templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="kpiProductGroupStore.templates"
          :save-key="kpiProductGroupHeader"
        />
        <page-size-btn
          :current-size="kpiProductGroupStore.params.page_size"
          :total-count="kpiProductGroupStore.data?.total_count"
          :page-number="kpiProductGroupStore.data?.page_number"
          @setPageSize="kpiProductGroupStore.setPageSize"
        />
        <search-input
          @change="kpiProductGroupStore.search"
          :value="kpiProductGroupStore.params.search"
        />
        <excel-btn
          @click="kpiProductGroupStore.onDownloadExcelFile"
          :loading="kpiProductGroupStore.isExcelFileDownloading"
        />
        <RefreshBtn @click="refresh" :loading="kpiProductGroupStore.loading" />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="kpiProductGroupStore.templates"
          @sort="kpiProductGroupStore.sortData"
          :sorted="kpiProductGroupStore.params.order_by"
          :loading="kpiProductGroupStore.loading"
          :is-empty="!kpiProductGroupStore.data?.items.length"
        >
          <template #body>
            <c-tr v-for="data in kpiProductGroupStore.data?.items" :key="data">
              <c-td-no-edit
                v-for="key in kpiProductGroupStore.templates"
                :key="key.name"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.type === 'number'">
                  {{ getFormattedAmount(data[key.key]) }}
                </div>
                <div v-else-if="key.type === 'array'">
                  <show-more :data="data[key.key]" :showCount="1" />
                </div>
                <div v-else-if="key.key === 'action'">
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
          :current-size="kpiProductGroupStore.params.page_size"
          :total-count="kpiProductGroupStore.data?.total_count"
          :page-number="kpiProductGroupStore.data?.page_number"
        />
        <page-index
          :available-pages="kpiProductGroupStore.data?.total_pages"
          :current-page="kpiProductGroupStore.data?.page_number"
          @setPage="kpiProductGroupStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="editingId">
        <SettingsKpiProductGroupDialog
          :id="editingId"
          @closeDialog="closeEditDialog"
          @clearFetchedTab="clearFetchedTab"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { kpiProductGroupHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// Store
const { isActive } = toRefs(props);
const kpiProductGroupStore = useKpiProductGroupStore(isActive.value.toString());

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.KPI_PRODUCT_GROUP_TABLE_UPDATE;

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
  kpiProductGroupStore.templates = param;
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
  await kpiProductGroupStore.refresh();
};

const getData = async () => {
  await kpiProductGroupStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
