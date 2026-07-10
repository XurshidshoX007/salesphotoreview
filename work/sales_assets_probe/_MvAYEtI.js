const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="orderCommentsHeader"
        :templates="orderCommentsStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="orderCommentsStore.templates"
        :save-key="orderCommentsHeader"
      />
      <page-size-btn
        :current-size="orderCommentsStore.params.page_size"
        @setPageSize="orderCommentsStore.setPageSize"
      />
      <search-input @change="orderCommentsStore.search" />
      <excel-btn
        @click="orderCommentsStore.onDownloadExcelFile"
        :loading="orderCommentsStore.isExcelFileDownloading"
      />
      <RefreshBtn
        @click="orderCommentsStore.refresh"
        :loading="orderCommentsStore.loading"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="orderCommentsStore.templates"
        @sort="orderCommentsStore.sortData"
        :sorted="orderCommentsStore.params.order_by"
        :is-empty="!orderCommentsStore.data?.items.length"
        :loading="orderCommentsStore.loading"
      >
        <template #body>
          <c-tr v-for="data in orderCommentsStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in orderCommentsStore.templates"
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
              <div class="text-end" v-else-if="key.type === 'number'">
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
        :current-size="orderCommentsStore.params.page_size"
        :page-number="orderCommentsStore.data?.page_number"
        :total-count="orderCommentsStore.data?.total_count"
      />
      <page-index
        :available-pages="orderCommentsStore.data?.total_pages"
        :current-page="orderCommentsStore.data?.page_number"
        @setPage="orderCommentsStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsOrderCommentsDataDialog
        :id="editingId"
        @clearFetchedTab="clearFetchedTab"
        @closeDialog="closeEditDialog"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { Template } from "~/interfaces/ui/template";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { orderCommentsHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// State
const { t } = useI18n();
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.ORDER_COMMENTS_TABLE_UPDATE;

// Stores
const { isActive } = toRefs(props);
const orderCommentsStore = useOrderCommentsStore(isActive.value.toString());

// Hooks
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
  orderCommentsStore.templates = param;
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
  await orderCommentsStore.refresh();
};

const getData = async () => {
  await orderCommentsStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
