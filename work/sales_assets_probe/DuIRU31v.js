const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="knowledgeCategoriesHeader"
          :templates="knowledgeCategoriesStore.templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="knowledgeCategoriesStore.templates"
          :save-key="knowledgeCategoriesHeader"
        />
        <page-size-btn
          :current-size="knowledgeCategoriesStore.params.page_size"
          :total-count="knowledgeCategoriesStore.data?.total_count"
          :page-number="knowledgeCategoriesStore.data?.page_number"
          @setPageSize="knowledgeCategoriesStore.setPageSize"
        />
        <search-input @change="knowledgeCategoriesStore.search" />
        <excel-btn
          @click="knowledgeCategoriesStore.onDownloadExcelFile"
          :loading="knowledgeCategoriesStore.isExcelFileDownloading"
        />
        <RefreshBtn
          @click="refresh"
          :loading="knowledgeCategoriesStore.isLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="knowledgeCategoriesStore.templates"
          :sorted="knowledgeCategoriesStore.params.order_by"
          :loading="knowledgeCategoriesStore.isLoading"
          :isEmpty="!knowledgeCategoriesStore.data?.items?.length"
          @sort="knowledgeCategoriesStore.sortData"
        >
          <template #body>
            <c-tr
              v-for="data in knowledgeCategoriesStore.data?.items"
              :key="data"
            >
              <c-td-no-edit
                v-for="key in knowledgeCategoriesStore.templates"
                :key="key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.key === 'roles'">
                  <show-more
                    :show-count="2"
                    :data="getRoleNames(data?.roles)"
                  />
                </div>
                <div v-else-if="key.key === 'action'">
                  <rounded-icon-btn
                    type="edit"
                    :iconSize="20"
                    @click="openEditDialog(data?.id)"
                  />
                </div>
                <div v-else-if="key.type === 'date'">
                  {{ getFormattedDate(data[key.key], "DD.MM.YYYY") }}
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
          :current-size="knowledgeCategoriesStore.params.page_size"
          :total-count="knowledgeCategoriesStore.data?.total_count"
          :page-number="knowledgeCategoriesStore.data?.page_number"
        />
        <page-index
          :available-pages="knowledgeCategoriesStore.data?.total_pages"
          :current-page="knowledgeCategoriesStore.data?.page_number"
          @setPage="knowledgeCategoriesStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="editingId">
        <SettingsKnowledgeCategoriesDataDialog
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
import { knowledgeCategoriesHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// Stores
const { isActive } = toRefs(props);
const knowledgeCategoriesStore = useKnowledgeCategoriesStore(
  isActive.value.toString(),
);

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.KNOWLADGE_CATEGORIES_TABLE_UPDATE;

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
const getRoleNames = (roles: Array<Record<"id" | "name", string | number>>) => {
  return roles.map((role) => role?.name);
};

const onChangeTableHeaders = (param: Template[]) => {
  knowledgeCategoriesStore.templates = param;
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
  await knowledgeCategoriesStore.refresh();
};

const getData = async () => {
  await knowledgeCategoriesStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
