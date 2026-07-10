const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="knowledgeBaseHeader"
          :templates="knowledgeBaseStore.templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="knowledgeBaseStore.templates"
          :save-key="knowledgeBaseHeader"
        />
        <page-size-btn
          :current-size="knowledgeBaseStore.params.page_size"
          :total-count="knowledgeBaseStore.data?.total_count"
          :page-number="knowledgeBaseStore.data?.page_number"
          @setPageSize="knowledgeBaseStore.setPageSize"
        />
        <search-input @change="knowledgeBaseStore.search" />
        <excel-btn
          @click="knowledgeBaseStore.onDownloadExcelFile"
          :loading="knowledgeBaseStore.isExcelFileDownloading"
        />
        <RefreshBtn @click="refresh" :loading="knowledgeBaseStore.isLoading" />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="knowledgeBaseStore.templates"
          :sorted="knowledgeBaseStore.params.order_by"
          :loading="knowledgeBaseStore.isLoading"
          :isEmpty="!knowledgeBaseStore.data?.items?.length"
          @sort="knowledgeBaseStore.sortData"
        >
          <template #body>
            <c-tr v-for="data in knowledgeBaseStore.data?.items" :key="data">
              <c-td-no-edit
                v-for="key in knowledgeBaseStore.templates"
                :key="key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.type === 'date'">
                  {{ getFormattedDate(data[key.key], "DD.MM.YYYY") }}
                </div>
                <div v-else-if="key.key === 'roles'">
                  {{ rolesName(data?.user_roles) }}
                </div>
                <div v-else-if="key.key === 'action'">
                  <rounded-icon-btn
                    type="edit"
                    :iconSize="20"
                    @click="openEditDialog(data?.id)"
                  />
                </div>
                <div v-else-if="key.type === 'number'" class="text-end">
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
          :current-size="knowledgeBaseStore.params.page_size"
          :total-count="knowledgeBaseStore.data?.total_count"
          :page-number="knowledgeBaseStore.data?.page_number"
        />
        <page-index
          :available-pages="knowledgeBaseStore.data?.total_pages"
          :current-page="knowledgeBaseStore.data?.page_number"
          @setPage="knowledgeBaseStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="editingId">
        <SettingsKnowledgeBaseDataDialog
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
import { knowledgeBaseHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// Stores
const { isActive } = toRefs(props);
const knowledgeBaseStore = useKnowledgeBaseStore(isActive.value.toString());

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.KNOWLADGE_BASE_TABLE_UPDATE;

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
const rolesName = (roles: Array<{ id: number; name: string }> | undefined) => {
  return roles
    ?.map((item) => {
      return item.name;
    })
    ?.join(", ");
};

const onChangeTableHeaders = (value: Template[]) => {
  knowledgeBaseStore.templates = value;
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

const getData = async () => {
  await knowledgeBaseStore.getData(isActive.value.toString());
};

const refresh = async () => {
  await knowledgeBaseStore.refresh();
};
<\/script>
`;export{e as default};
