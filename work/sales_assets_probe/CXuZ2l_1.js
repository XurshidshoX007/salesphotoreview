const e=`<template>
  <div class="table-content-container !border-none">
    <div class="table-content-header !px-0">
      <table-sort-columns
        :save-key="producersHeader"
        :templates="manufacturesStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="manufacturesStore.templates"
        :save-key="producersHeader"
      />
      <page-size-btn
        :current-size="manufacturesStore.params.page_size"
        :total-count="manufacturesStore.data?.total_count"
        :page-number="manufacturesStore.data?.page_number"
        @setPageSize="manufacturesStore.setPageSize"
      />

      <search-input
        @change="manufacturesStore.search"
        :value="manufacturesStore.params.search"
      />

      <excel-btn
        @click="manufacturesStore.onDownloadExcelFile"
        :loading="manufacturesStore.isExcelFileDownloading"
      />

      <RefreshBtn @click="refresh" :loading="manufacturesStore.loading" />
    </div>

    <div class="table-content-body">
      <data-table
        :headers="manufacturesStore.templates"
        @sort="manufacturesStore.sortData"
        :sorted="manufacturesStore.params.order_by"
        :loading="manufacturesStore.loading"
        :is-empty="!manufacturesStore.data?.items?.length"
      >
        <template #body>
          <c-tr v-for="data in manufacturesStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in manufacturesStore.templates"
              :key="key"
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
        :current-size="manufacturesStore.params.page_size"
        :total-count="manufacturesStore.data?.total_count"
        :page-number="manufacturesStore.data?.page_number"
      />
      <page-index
        :available-pages="manufacturesStore.data?.total_pages"
        :current-page="manufacturesStore.data?.page_number"
        @setPage="manufacturesStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsProductsProducersNewProducer
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
import { producersHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// stores
const { isActive } = toRefs(props);
const manufacturesStore = useManufacturersStore(isActive.value.toString());

// states
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.MANUFACTURER_TABLE_UPDATE;

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
  manufacturesStore.templates = param;
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
  await manufacturesStore.refresh();
};

const getData = async () => {
  await manufacturesStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
