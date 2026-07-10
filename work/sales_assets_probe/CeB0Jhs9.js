const e=`<template>
  <div class="table-content-container !border-none">
    <div class="table-content-header !px-0">
      <table-sort-columns
        :save-key="replacementProductGroupHeader"
        :templates="replacementProductGroupStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="replacementProductGroupStore.templates"
        :save-key="replacementProductGroupHeader"
      />
      <page-size-btn
        :current-size="replacementProductGroupStore.params.page_size"
        :total-count="replacementProductGroupStore.data?.total_count"
        :page-number="replacementProductGroupStore.data?.page_number"
        @setPageSize="replacementProductGroupStore.setPageSize"
      />
      <search-input
        @change="replacementProductGroupStore.search"
        :value="replacementProductGroupStore.params.search"
      />
      <excel-btn
        @click="replacementProductGroupStore.onDownloadExcelFile"
        :loading="replacementProductGroupStore.isExcelFileDownloading"
      />
      <RefreshBtn
        @click="refresh"
        :loading="replacementProductGroupStore.loading"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="replacementProductGroupStore.templates"
        :is-empty="!replacementProductGroupStore?.data?.items.length"
        :sorted="replacementProductGroupStore.params.order_by"
        :loading="replacementProductGroupStore.loading"
        @sort="replacementProductGroupStore.sortData"
      >
        <template #body>
          <c-tr
            v-for="data in replacementProductGroupStore.data?.items"
            :key="data.id"
          >
            <c-td-no-edit
              v-for="key in replacementProductGroupStore.templates"
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
              <div v-else-if="key.type === 'number'">
                {{ getFormattedAmount(data[key.key]) }}
              </div>
              <div v-else-if="key.type === 'array'">
                <show-more :data="data[key.key]" :show-count="2" />
              </div>
              <link-component
                v-else-if="key.key === 'name'"
                :value="data[key.key]"
                @click="getDetailData(data.id)"
              />
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
        :current-size="replacementProductGroupStore.params.page_size"
        :total-count="replacementProductGroupStore.data?.total_count"
        :page-number="replacementProductGroupStore.data?.page_number"
      />
      <page-index
        :available-pages="replacementProductGroupStore.data?.total_pages"
        :current-page="replacementProductGroupStore.data?.page_number"
        @setPage="replacementProductGroupStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsProductsReplacementProductGroupDialog
        :id="editingId"
        @closeDialog="closeEditDialog"
        @clearFetchedTab="clearFetchedTab"
      />
    </div>
  </transition>
  <transition name="modal">
    <div v-if="detailData">
      <SettingsProductsReplacementProductGroupDetailDialog
        :detail-data="detailData"
        :loading="replacementProductGroupStore.detailDataLoading"
        @closeDialog="closeDetailDialog"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { replacementProductGroupHeader } from "~/variable/column-constants";
import { getFormattedAmount } from "~/utils/filter";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// store
const { isActive } = toRefs(props);
const replacementProductGroupStore = useReplacementProductGroupStore(
  isActive.value.toString(),
);

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey =
  SettingsEventKeys.REPLACEMENT_PRODUCT_GROUP_TABLE_UPDATE;
const detailData = ref(null);
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
  replacementProductGroupStore.templates = param;
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
  await replacementProductGroupStore.refresh();
};

const getData = async () => {
  await replacementProductGroupStore.getData(isActive.value.toString());
};

const getDetailData = async (id: string) => {
  detailData.value = await replacementProductGroupStore.getDetail(id);
};

const closeDetailDialog = () => {
  detailData.value = null;
};
<\/script>
`;export{e as default};
