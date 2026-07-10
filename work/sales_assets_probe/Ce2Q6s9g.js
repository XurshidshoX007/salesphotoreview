const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="subCategoryHeader"
        :templates="productCategoryStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="productCategoryStore.templates"
        :save-key="subCategoryHeader"
      />
      <page-size-btn
        :current-size="productCategoryStore.params.page_size"
        :total-count="productCategoryStore.data?.total_count"
        :page-number="productCategoryStore.data?.page_number"
        @setPageSize="productCategoryStore.setPageSize"
      />
      <search-input @change="productCategoryStore.search" />
      <excel-btn
        @click="productCategoryStore.onDownloadExcelFile"
        :loading="productCategoryStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="productCategoryStore.loading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="productCategoryStore.templates"
        @sort="productCategoryStore.sortData"
        :sorted="productCategoryStore.params.order_by"
        :loading="productCategoryStore.loading"
        :is-empty="!productCategoryStore.data?.items.length"
      >
        <template #body>
          <c-tr v-for="data in productCategoryStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in productCategoryStore.templates"
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
        :current-size="productCategoryStore.params.page_size"
        :total-count="productCategoryStore.data?.total_count"
        :page-number="productCategoryStore.data?.page_number"
      />
      <page-index
        :available-pages="productCategoryStore.data?.total_pages"
        :current-page="productCategoryStore.data?.page_number"
        @setPage="productCategoryStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsProductCategorySubcategoryNewDataBody
        :id="editingId"
        @closeDialog="closeEditDialog"
        @clearFetchedTab="clearFetchedTab"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { subCategoryHeader } from "~/variable/column-constants";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { useEventBus } from "~/composables/EventBus/eventBus";
import type { Template } from "~/interfaces/ui/template";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// stores
const { isActive } = toRefs(props);
const productCategoryStore = useProductSubCategoryStore(
  isActive.value.toString(),
);

// states
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey =
  SettingsEventKeys.PRODUCT_CATEGORY_SUBCATEGORY_TABLE_UPDATE;

// hooks
eventBus.on(updateListEventKey, async (updatedIsActive) => {
  if (updatedIsActive === isActive.value) {
    await getData();
  }
});

onMounted(async () => {
  await getData();
});

const onChangeTableHeaders = (param: Template[]) => {
  productCategoryStore.templates = param;
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
  await productCategoryStore.refresh();
};

const getData = async () => {
  await productCategoryStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
