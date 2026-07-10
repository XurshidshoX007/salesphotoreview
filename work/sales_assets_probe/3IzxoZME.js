const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="categoryGroupHeader"
        :templates="categoryGroupsActiveStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="categoryGroupsActiveStore.templates"
        :save-key="categoryGroupHeader"
      />
      <page-size-btn
        :current-size="categoryGroupsActiveStore.params.page_size"
        :total-count="categoryGroupsActiveStore.data?.total_count"
        :page-number="categoryGroupsActiveStore.data?.page_number"
        @setPageSize="categoryGroupsActiveStore.setPageSize"
      />
      <search-input
        :value="categoryGroupsActiveStore.params.search"
        @change="categoryGroupsActiveStore.search"
      />
      <excel-btn
        @click="categoryGroupsActiveStore.onDownloadExcelFile"
        :loading="categoryGroupsActiveStore.isExcelFileDownloading"
      />
      <RefreshBtn
        @click="refresh"
        :loading="categoryGroupsActiveStore.loading"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="categoryGroupsActiveStore.templates"
        @sort="categoryGroupsActiveStore.sortData"
        :sorted="categoryGroupsActiveStore.params.order_by"
        :loading="categoryGroupsActiveStore.loading"
        :is-empty="!categoryGroupsActiveStore?.data?.items.length"
      >
        <template #body>
          <c-tr
            v-for="data in categoryGroupsActiveStore.data?.items"
            :key="data"
          >
            <c-td-no-edit
              v-for="key in categoryGroupsActiveStore.templates"
              :key="key"
              :is-checked="key.checked"
              :type="key.type"
            >
              <show-more
                v-if="key.key === 'categories'"
                :data="totalCategoryList(data[key.key])"
                :show-count="2"
              />
              <div v-else-if="key.type === 'number'">
                {{ getFormattedAmount(data[key.key]) }}
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
        :current-size="categoryGroupsActiveStore.params.page_size"
        :total-count="categoryGroupsActiveStore.data?.total_count"
        :page-number="categoryGroupsActiveStore.data?.page_number"
      />
      <page-index
        :available-pages="categoryGroupsActiveStore.data?.total_pages"
        :current-page="categoryGroupsActiveStore.data?.page_number"
        @setPage="categoryGroupsActiveStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsProductCategoryGroupNewGroupBody
        :id="editingId"
        @clearFetchedTab="clearFetchedTab"
        @closeDialog="closeEditDialog"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { categoryGroupHeader } from "~/variable/column-constants";
import type { Template } from "~/interfaces/ui/template";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// Store
const { isActive } = toRefs(props);
const categoryGroupsActiveStore = useCategoryGroupsStore(
  isActive.value.toString(),
);

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey =
  SettingsEventKeys.PRODUCT_CATEGORY_GROUP_CATEGORY_TABLE_UPDATE;

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
  categoryGroupsActiveStore.templates = param;
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
  await categoryGroupsActiveStore.refresh();
};

const getData = async () => {
  await categoryGroupsActiveStore.getData(isActive.value.toString());
};

const totalCategoryList = (category: object[]) => {
  let categories = category?.map((item) => {
    return item.name;
  });
  return categories;
};
<\/script>
`;export{e as default};
