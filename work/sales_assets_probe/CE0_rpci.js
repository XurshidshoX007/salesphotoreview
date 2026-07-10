const n=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="rlpBonusHeader"
        :templates="rlpBonusStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="rlpBonusStore.templates"
        :save-key="rlpBonusHeader"
      />
      <page-size-btn
        :current-size="rlpBonusStore.params.page_size"
        :total-count="rlpBonusStore.data?.total_count"
        :page-number="rlpBonusStore.data?.page_number"
        @setPageSize="rlpBonusStore.setPageSize"
      />
      <search-input
        @change="rlpBonusStore.search"
        :value="rlpBonusStore.params.search"
      />
      <excel-btn
        @click="rlpBonusStore.onDownloadExcelFile"
        :loading="rlpBonusStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="rlpBonusStore.loading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="rlpBonusStore.templates"
        @sort="rlpBonusStore.sortData"
        :sorted="rlpBonusStore.params.order_by"
        :loading="rlpBonusStore.loading"
        :is-empty="!rlpBonusStore.data?.items.length"
      >
        <template #body>
          <c-tr v-for="data in rlpBonusStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in rlpBonusStore.templates"
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
        :current-size="rlpBonusStore.params.page_size"
        :total-count="rlpBonusStore.data?.total_count"
        :page-number="rlpBonusStore.data?.page_number"
      />
      <page-index
        :available-pages="rlpBonusStore.data?.total_pages"
        :current-page="rlpBonusStore.data?.page_number"
        @setPage="rlpBonusStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsRlpDiscountsRLPDiscountDialogBody
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
import { rlpBonusHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// Store
const { isActive } = toRefs(props);
const rlpBonusStore = useRlpBonustore(isActive.value.toString());

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.RLP_BONUSES_TABLE_UPDATE;

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
  rlpBonusStore.templates = param;
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
  await rlpBonusStore.refresh();
};

const getData = async () => {
  await rlpBonusStore.getData(isActive.value.toString());
};
<\/script>
`;export{n as default};
