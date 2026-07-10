const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="directionTradeHeader"
        :templates="tradeDirectionsStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="tradeDirectionsStore.templates"
        :save-key="directionTradeHeader"
      />
      <page-size-btn
        :current-size="tradeDirectionsStore.params.page_size"
        :total-count="tradeDirectionsStore.data?.total_count"
        :page-number="tradeDirectionsStore.data?.page_number"
        @setPageSize="tradeDirectionsStore.setPageSize"
      />
      <search-input @change="tradeDirectionsStore.search" />
      <excel-btn
        @click="tradeDirectionsStore.onDownloadExcelFile"
        :loading="tradeDirectionsStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="tradeDirectionsStore.loading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="tradeDirectionsStore.templates"
        @sort="tradeDirectionsStore.sortData"
        :sorted="tradeDirectionsStore.params.order_by"
        :loading="tradeDirectionsStore.loading"
        :is-empty="!tradeDirectionsStore.data?.items.length"
      >
        <template #body>
          <c-tr v-for="data in tradeDirectionsStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in tradeDirectionsStore.templates"
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
              <div v-else-if="key.type === 'boolean'">
                {{ data[key.key] ? t("filters.yes") : t("filters.no") }}
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
        :current-size="tradeDirectionsStore.params.page_size"
        :total-count="tradeDirectionsStore.data?.total_count"
        :page-number="tradeDirectionsStore.data?.page_number"
      />
      <page-index
        :available-pages="tradeDirectionsStore.data?.total_pages"
        :current-page="tradeDirectionsStore.data?.page_number"
        @setPage="tradeDirectionsStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsDirectionTradeDialogBody
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
import { directionTradeHeader } from "~/variable/column-constants";
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// Stores
const { isActive } = toRefs(props);
const tradeDirectionsStore = useTradeDirectionsStore(isActive.value.toString());

// State
const { t } = useI18n();
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.TRADE_DIRECTION_TABLE_UPDATE;

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
  tradeDirectionsStore.templates = param;
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
  await tradeDirectionsStore.refresh();
};

const getData = async () => {
  await tradeDirectionsStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
