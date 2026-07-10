const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="productCategoryHeader"
        :templates="productActiveStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="productActiveStore.templates"
        :save-key="productCategoryHeader"
      />
      <page-size-btn
        :current-size="productActiveStore.params.page_size"
        :total-count="productActiveStore.data?.total_count"
        :page-number="productActiveStore.data?.page_number"
        @setPageSize="productActiveStore.setPageSize"
      />
      <search-input @change="productActiveStore.search" />
      <excel-btn
        @click="productActiveStore.onDownloadExcelFile"
        :loading="productActiveStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="productActiveStore.loading" />
    </div>

    <div class="table-content-body">
      <data-table
        :headers="productActiveStore.templates"
        :sorted="productActiveStore.params.order_by"
        :isEmpty="!productActiveStore.data?.items?.length"
        :loading="productActiveStore.loading"
        @sort="productActiveStore.sortData"
      >
        <template #body>
          <c-tr v-for="data in productActiveStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in productActiveStore.templates"
              :key="key"
              :is-checked="key.checked"
              :type="key.type"
            >
              <div v-if="key.type === 'date'">
                {{ getFormattedDate(data[key.key], "DD.MM.YYYY") }}
              </div>
              <div v-else-if="key.key === 'action'">
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
        :current-size="productActiveStore.params.page_size"
        :total-count="productActiveStore.data?.total_count"
        :page-number="productActiveStore.data?.page_number"
      />
      <page-index
        :available-pages="productActiveStore.data?.total_pages"
        :current-page="productActiveStore.data?.page_number"
        @setPage="productActiveStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsProductCategoryNewCategoryBody
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
import { productCategoryHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// store
const { isActive } = toRefs(props);
const productActiveStore = useProductCategoryStore(isActive.value.toString());

// states
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.PRODUCT_CATEGORY_TABLE_UPDATE;

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
  productActiveStore.templates = param;
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
  await productActiveStore.refresh();
};

const getData = async () => {
  await productActiveStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
