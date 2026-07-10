const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="priceTypesHeader"
        :templates="priceTypeStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="priceTypeStore.templates"
        :save-key="priceTypesHeader"
      />
      <page-size-btn
        :current-size="priceTypeStore.params.page_size"
        :total-count="priceTypeStore.data?.total_count"
        :page-number="priceTypeStore.data?.page_number"
        @setPageSize="priceTypeStore.setPageSize"
      />
      <search-input
        @change="priceTypeStore.search"
        :value="priceTypeStore.params.search"
      />
      <excel-btn
        @click="priceTypeStore.onDownloadExcelFile"
        :loading="priceTypeStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="priceTypeStore.loading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="priceTypeStore.templates"
        :sorted="priceTypeStore.params.order_by"
        :loading="priceTypeStore.loading"
        :is-empty="!priceTypeStore.data?.items.length"
        @sort="priceTypeStore.sortData"
      >
        <template #body>
          <c-tr v-for="data in priceTypeStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in priceTypeStore.templates"
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
              <div v-else-if="key.key === 'type'">
                {{ data["type_name"] }}
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
        :current-size="priceTypeStore.params.page_size"
        :total-count="priceTypeStore.data?.total_count"
        :page-number="priceTypeStore.data?.page_number"
      />
      <page-index
        :available-pages="priceTypeStore.data?.total_pages"
        :current-page="priceTypeStore.data?.page_number"
        @setPage="priceTypeStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsPriceTypesNewPrice
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
import { priceTypesHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// Store
const { isActive } = toRefs(props);
const priceTypeStore = usePriceTypesStore(isActive.value.toString());

// state
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.PRICE_TYPES_TABLE_UPDATE;

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
  priceTypeStore.templates = param;
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
  await priceTypeStore.refresh();
};

const getData = async () => {
  await priceTypeStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
