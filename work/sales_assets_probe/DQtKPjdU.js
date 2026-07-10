const n=`<template>
  <div class="table-content-container !border-none">
    <div class="table-content-header !px-0">
      <table-sort-columns
        :save-key="brandsHeader"
        :templates="brandsStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="brandsStore.templates"
        :save-key="brandsHeader"
      />
      <page-size-btn
        :current-size="brandsStore.params.page_size"
        :total-count="brandsStore.data?.total_count"
        :page-number="brandsStore.data?.page_number"
        @setPageSize="brandsStore.setPageSize"
      />
      <search-input
        @change="brandsStore.search"
        :value="brandsStore.params.search"
      />
      <excel-btn
        :loading="brandsStore.isExcelFileDownloading"
        @click="brandsStore.onDownloadExcelFile"
      />
      <RefreshBtn @click="refresh" :loading="brandsStore.loading" />
    </div>

    <div class="table-content-body">
      <data-table
        :headers="brandsStore.templates"
        :is-empty="!brandsStore?.data?.items.length"
        :sorted="brandsStore.params.order_by"
        :loading="brandsStore.loading"
        @sort="brandsStore.sortData"
      >
        <template #body>
          <c-tr v-for="data in brandsStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in brandsStore.templates"
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
        :current-size="brandsStore.params.page_size"
        :total-count="brandsStore.data?.total_count"
        :page-number="brandsStore.data?.page_number"
      />
      <page-index
        :available-pages="brandsStore.data?.total_pages"
        :current-page="brandsStore.data?.page_number"
        @setPage="brandsStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsProductsBrandsNewBrand
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
import { brandsHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// store
const { isActive } = toRefs(props);
const brandsStore = useBrandsStore(isActive.value.toString());

// states
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.BRAND_TABLE_UPDATE;

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
  brandsStore.templates = param;
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
  await brandsStore.refresh();
};

const getData = async () => {
  await brandsStore.getData(isActive.value.toString());
};
<\/script>
`;export{n as default};
