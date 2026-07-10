const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="expenseCategoryHeader"
          :templates="expenseStore.templatesExpenseCategory"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="expenseStore.templatesExpenseCategory"
          :save-key="expenseCategoryHeader"
        />
        <page-size-btn
          :current-size="expenseStore.paramsExpenseCategory.page_size"
          @setPageSize="expenseStore.setExpenseCategoryPageSize"
        />
        <search-input
          @change="expenseStore.searchExpenseCategory"
          :value="expenseStore.paramsExpenseCategory.search"
        />
        <excel-btn
          @click="expenseStore.onDownloadExpenseCategoryExcelFile"
          :loading="expenseStore.isExpenseCategoryExcelFileDownloading"
        />
        <RefreshBtn
          @click="refresh"
          :loading="expenseStore.isExpenseCategoryLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="expenseStore.templatesExpenseCategory"
          :sorted="expenseStore.paramsExpenseCategory.order_by"
          :loading="expenseStore.isExpenseCategoryLoading"
          :is-empty="!expenseStore.dataExpenseCategory?.items.length"
          @sort="expenseStore.sortExpenseCategoryData"
        >
          <template #body>
            <c-tr
              v-for="data in expenseStore.dataExpenseCategory?.items"
              :key="data?.id"
            >
              <c-td-no-edit
                v-for="key in expenseStore.templatesExpenseCategory"
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
          :current-size="expenseStore.paramsExpenseCategory.page_size"
          :total-count="expenseStore.dataExpenseCategory?.total_count"
          :page-number="expenseStore.dataExpenseCategory?.page_number"
        />
        <page-index
          :available-pages="expenseStore.dataExpenseCategory?.total_pages"
          :current-page="expenseStore.dataExpenseCategory?.page_number"
          @setPage="expenseStore.setPageExpenseCategory"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="editingId">
        <SettingsExpenseCategoryDialog
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
import { expenseCategoryHeader } from "~/variable/column-constants";

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
const updateListEventKey = SettingsEventKeys.EXPENSE_CATEGORY_TABLE_UPDATE;

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
  expenseStore.templatesExpenseCategory = param;
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
  await expenseStore.getDataExpenseCategory(isActive.value.toString());
};

const refresh = async () => {
  await expenseStore.refreshExpenseCategory();
};
<\/script>
`;export{e as default};
