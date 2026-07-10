const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="branchesHeader"
        :templates="branchesStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <show-hide-column
        :headers="branchesStore.templates"
        :save-key="branchesHeader"
      />
      <page-size-btn
        :current-size="branchesStore.params.page_size"
        :total-count="branchesStore.data?.total_count"
        :page-number="branchesStore.data?.page_number"
        @setPageSize="branchesStore.setPageSize"
      />
      <excel-btn
        @click="branchesStore.onDownloadExcelFile"
        :loading="branchesStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="branchesStore.isLoading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="branchesStore.templates"
        @sort="branchesStore.sortData"
        :sorted="branchesStore.params.order_by"
        :loading="branchesStore.isLoading"
        :is-empty="!branchesStore.data?.items?.length"
      >
        <template #body>
          <c-tr v-for="data in branchesStore.data?.items" :key="data.id">
            <c-td-no-edit
              v-for="column in branchesStore.templates"
              :key="column.key"
              :is-checked="column.checked"
              :type="column.type"
            >
              <div
                v-if="column.key === 'action'"
                class="flex items-center gap-2"
              >
                <rounded-icon-btn
                  type="edit"
                  :iconSize="20"
                  @click="openEditDialog(data.id)"
                />
              </div>
              <div v-else-if="column.key === 'sort'">
                {{ getFormattedAmount(data.sort ?? "") }}
              </div>
              <div v-else>
                {{ getDataValue(data, column.key) }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="branchesStore.params.page_size"
        :total-count="branchesStore.data?.total_count"
        :page-number="branchesStore.data?.page_number"
      />
      <page-index
        :available-pages="branchesStore.data?.total_pages"
        :current-page="branchesStore.data?.page_number"
        @setPage="branchesStore.setPage"
      />
    </div>
  </div>

  <transition name="modal">
    <div v-if="editingId">
      <settings-branches-data-dialog
        :id="editingId"
        @closeDialog="closeEditDialog"
        @clearFetchedTab="clearFetchedTab"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { branchesHeader } from "~/variable/column-constants";
import { getDataValue, getFormattedAmount } from "#imports";

// Types
type Props = {
  isActive: boolean;
};

type Emits = {
  (e: "clearFetchedTab", isActive: boolean): void;
};

// Props
const props = defineProps<Props>();

// Emits
const emit = defineEmits<Emits>();

// Store
const { isActive } = toRefs(props);
const branchesStore = useBranchesStore(isActive.value.toString());

// State
const eventBus = useEventBus();
const editingId = ref<string | null>();
const updateListEventKey = SettingsEventKeys.BRANCHES_TABLE_UPDATE;

// Hooks
onMounted(async () => {
  await getData();
});

eventBus.on(updateListEventKey, async (updatedIsActive) => {
  if (updatedIsActive === isActive.value) {
    await getData();
  }
});

// Methods
const onChangeTableHeaders = (param: Template[]) => {
  branchesStore.templates = param;
};

const openEditDialog = (id: string) => {
  editingId.value = id;
};

const closeEditDialog = () => {
  editingId.value = null;
};

const clearFetchedTab = (isActive: boolean) => {
  emit("clearFetchedTab", isActive);
};

const refresh = async () => {
  await branchesStore.refresh();
};

const getData = async () => {
  await branchesStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
