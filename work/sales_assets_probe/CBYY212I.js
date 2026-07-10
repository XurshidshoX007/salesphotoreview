const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="expenseTypeHeader"
          :templates="expenseStore.templatesExpenseType"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="expenseStore.templatesExpenseType"
          :save-key="expenseTypeHeader"
        />
        <page-size-btn
          :current-size="expenseStore.paramsExpenseType.page_size"
          @setPageSize="expenseStore.setExpenseTypePageSize"
        />
        <search-input
          @change="expenseStore.searchExpenseType"
          :value="expenseStore.paramsExpenseType.search"
        />
        <excel-btn
          @click="expenseStore.onDownloadExpenseTypeExcelFile"
          :loading="expenseStore.isExpenseTypeExcelFileDownloading"
        />
        <RefreshBtn
          @click="refresh"
          :loading="expenseStore.isExpenseTypeLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="expenseStore.templatesExpenseType"
          :sorted="expenseStore.paramsExpenseType.order_by"
          :loading="expenseStore.isExpenseTypeLoading"
          :is-empty="!expenseStore.dataExpenseType?.items.length"
          @sort="expenseStore.sortExpenseTypeData"
        >
          <template #body>
            <c-tr
              v-for="data in expenseStore.dataExpenseType?.items"
              :key="data?.id"
            >
              <c-td-no-edit
                v-for="key in expenseStore.templatesExpenseType"
                :key="key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.type === 'action' && !data.is_sys_data">
                  <rounded-icon-btn
                    type="edit"
                    :iconSize="20"
                    @click="openEditDialog(data.id)"
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
          :current-size="expenseStore.paramsExpenseType.page_size"
          :total-count="expenseStore.dataExpenseType?.total_count"
          :page-number="expenseStore.dataExpenseType?.page_number"
        />
        <page-index
          :available-pages="expenseStore.dataExpenseType?.total_pages"
          :current-page="expenseStore.dataExpenseType?.page_number"
          @setPage="expenseStore.setPageExpenseType"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="editingId">
        <SettingsExpenseTypeDialog
          :id="editingId"
          @closeDialog="closeEditDialog"
          @clearFetchedTab="clearFetchedTab"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useEventBus } from "~/composables/EventBus/eventBus";
import type { Template } from "~/interfaces/ui/template";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { expenseTypeHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// Store
const { isActive } = toRefs(props);
const expenseStore = useSettingsExpanse(isActive.value.toString());

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.EXPENSE_TYPE_TABLE_UPDATE;

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
  expenseStore.templatesExpenseType = param;
};

const openEditDialog = (id: string) => {
  editingId.value = id;
};

const closeEditDialog = () => {
  editingId.value = "";
};

const clearFetchedTab = (isActive: boolean) => {
  emit("clearFetchedTab", isActive);
};

const getData = async () => {
  await expenseStore.getDataExpenseType(isActive.value.toString());
};

const refresh = async () => {
  await expenseStore.refreshExpenseType();
};
<\/script>
`;export{e as default};
