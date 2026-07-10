const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="salesChannelHeader"
        :templates="salesChannelsStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="salesChannelsStore.templates"
        :save-key="salesChannelHeader"
      />
      <page-size-btn
        :current-size="salesChannelsStore.params.page_size"
        :total-count="salesChannelsStore.data?.total_count"
        :page-number="salesChannelsStore.data?.page_number"
        @setPageSize="salesChannelsStore.setPageSize"
      />
      <search-input @change="salesChannelsStore.search" />
      <excel-btn
        @click="salesChannelsStore.onDownloadExcelFile"
        :loading="salesChannelsStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="salesChannelsStore.loading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="salesChannelsStore.templates"
        @sort="salesChannelsStore.sortData"
        :sorted="salesChannelsStore.params.order_by"
        :loading="salesChannelsStore.loading"
        :is-empty="!salesChannelsStore.data?.items.length"
      >
        <template #body>
          <c-tr v-for="data in salesChannelsStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in salesChannelsStore.templates"
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
        :current-size="salesChannelsStore.params.page_size"
        :total-count="salesChannelsStore.data?.total_count"
        :page-number="salesChannelsStore.data?.page_number"
      />
      <page-index
        :available-pages="salesChannelsStore.data?.total_pages"
        :current-page="salesChannelsStore.data?.page_number"
        @setPage="salesChannelsStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsSalesChannelDialogBody
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
import { salesChannelHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// Store
const { isActive } = toRefs(props);
const salesChannelsStore = useSalesChannelsStore(isActive.value.toString());

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.SALES_CHANNEL_TABLE_UPDATE;

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
  salesChannelsStore.templates = param;
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
  await salesChannelsStore.refresh();
};

const getData = async () => {
  await salesChannelsStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
