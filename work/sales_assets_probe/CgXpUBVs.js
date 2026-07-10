const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="rejectsDefectsHeader"
        :templates="headers"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <show-hide-column :headers="headers" :save-key="rejectsDefectsHeader" />
      <page-size-btn
        :current-size="reasonsStore.params.page_size"
        :total-count="reasonsStore.data?.total_count"
        :page-number="reasonsStore.data?.page_number"
        @setPageSize="reasonsStore.setPageSize"
      />
      <search-input @change="reasonsStore.search" />
      <excel-btn
        @click="reasonsStore.onDownloadExcelFile"
        :loading="reasonsStore.isExcelFileDownloading"
      />
      <refresh-btn @click="refresh" :loading="reasonsStore.isLoading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="headers"
        @sort="reasonsStore.sortData"
        :sorted="reasonsStore.params.order_by"
        :loading="reasonsStore.isLoading"
        :is-empty="!reasonsStore.data?.items?.length"
      >
        <template #body>
          <c-tr v-for="data in reasonsStore.data?.items" :key="data.id">
            <c-td-no-edit
              v-for="key in headers"
              :key="key.key"
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
              <div v-if="key.key === 'types'">
                <show-more :show-count="2" :data="data[key.key]" />
              </div>
              <div v-else>
                {{ getDataValue(data, key.key, key.type) }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="reasonsStore.params.page_size"
        :total-count="reasonsStore.data?.total_count"
        :page-number="reasonsStore.data?.page_number"
      />
      <page-index
        :available-pages="reasonsStore.data?.total_pages"
        :current-page="reasonsStore.data?.page_number"
        @setPage="reasonsStore.setPage"
      />
    </div>
    <transition name="modal">
      <div v-if="editingItemId">
        <SharedSettingsReasonsDialog
          :id="editingItemId"
          :page-type="pageType"
          @close-dialog="closeEditDialog"
          @clear-fetched-tab="clearFetchedTab"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useEventBus } from "~/composables/EventBus/eventBus";
import { getDataValue } from "~/utils/helpers";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { rejectsDefectsHeader } from "~/variable/column-constants";
import { ReasonTypes } from "~/variable/static-constants";
import { types as PageTypes } from "@/components/shared/settings/reasons/propsTypes";
import type { Template } from "~/interfaces/ui/template";

// props
const props = defineProps<{
  isActive: boolean;
  pageType: PageTypes;
}>();

// emits
const emit = defineEmits<{
  (e: "clearFetchedTab", isActive: boolean): void;
}>();

// store
const { isActive } = toRefs(props);
const reasonsStore = useSharedReasonsStore(isActive.value.toString());

// State
const eventBus = useEventBus();
const updateListEventKey = SettingsEventKeys.ORDER_REASONS_TABLE_UPDATE;
const editingItemId = ref<string | null>(null);

// hooks
eventBus.on(updateListEventKey, async (updatedIsActive) => {
  if (updatedIsActive === isActive.value) {
    await getData();
  }
});

const config = computed(() => {
  // Use enum for page type logic
  switch (props.pageType) {
    case PageTypes.SETTINGS:
      return {
        fetchableTypes: [
          ReasonTypes.RETURN,
          ReasonTypes.EXCHANGE,
          ReasonTypes.CANCEL,
        ],
        headerFilter: (templates: Template[]) => templates,
      };
    case PageTypes.AUDIT_REASONS:
      return {
        fetchableTypes: [ReasonTypes.AUDIT_REASONS],
        headerFilter: (templates: Template[]) =>
          templates.filter((template) => template.key !== "types"),
      };
    case PageTypes.AUDIT_PROBLEMS:
      return {
        fetchableTypes: [ReasonTypes.AUDIT_PROBLEMS],
        headerFilter: (templates: Template[]) =>
          templates.filter((template) => template.key !== "types"),
      };
    default:
      return {
        fetchableTypes: [],
        headerFilter: (templates: Template[]) => templates,
      };
  }
});

const headers = computed(() =>
  config.value.headerFilter(reasonsStore.templates),
);

// methods
const onChangeTableHeaders = (param: Template[]) => {
  reasonsStore.templates = param;
};

const openEditDialog = (id?: string) => {
  if (!id) return;
  editingItemId.value = id;
};

const closeEditDialog = () => {
  editingItemId.value = null;
};

const clearFetchedTab = (isActive: boolean) => {
  emit("clearFetchedTab", isActive);
};

const refresh = async () => {
  await reasonsStore.refresh();
};

const getData = async () => {
  await reasonsStore.getData(isActive.value.toString());
};

// hooks
onMounted(async () => {
  reasonsStore.params.types = config.value.fetchableTypes;
  await getData();
});
<\/script>
`;export{e as default};
