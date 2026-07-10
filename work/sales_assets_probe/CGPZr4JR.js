const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="salaryBonusHeader"
        :templates="salaryAllowanceDeductionStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <show-hide-columns
        :headers="salaryAllowanceDeductionStore.templates"
        :save-key="salaryBonusHeader"
      />
      <page-size-btn
        :current-size="salaryAllowanceDeductionStore.params.page_size"
        :total-count="salaryAllowanceDeductionStore.data?.total_count"
        :page-number="salaryAllowanceDeductionStore.data?.page_number"
        @setPageSize="salaryAllowanceDeductionStore.setPageSize"
      />
      <search-input
        @change="salaryAllowanceDeductionStore.search"
        :value="salaryAllowanceDeductionStore.params.search"
      />
      <excel-btn
        @click="salaryAllowanceDeductionStore.onDownloadExcelFile"
        :loading="salaryAllowanceDeductionStore.isExcelFileDownloading"
      />
      <refresh-btn
        @click="refresh"
        :loading="salaryAllowanceDeductionStore.isLoading"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="salaryAllowanceDeductionStore.templates"
        :sorted="salaryAllowanceDeductionStore.params.order_by"
        :loading="salaryAllowanceDeductionStore.isLoading"
        :is-empty="!salaryAllowanceDeductionStore.data?.items.length"
        @sort="salaryAllowanceDeductionStore.sortData"
      >
        <template #body>
          <c-tr
            v-for="data in salaryAllowanceDeductionStore.data?.items"
            :key="data"
          >
            <c-td-no-edit
              v-for="key in salaryAllowanceDeductionStore.templates"
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
        :current-size="salaryAllowanceDeductionStore.params.page_size"
        :total-count="salaryAllowanceDeductionStore.data?.total_count"
        :page-number="salaryAllowanceDeductionStore.data?.page_number"
      />
      <page-index
        :available-pages="salaryAllowanceDeductionStore.data?.total_pages"
        :current-page="salaryAllowanceDeductionStore.data?.page_number"
        @setPage="salaryAllowanceDeductionStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <settings-salary-allowance-deductions-data-dialog
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
import { salaryBonusHeader } from "~/variable/column-constants";
import { getDataValue } from "~/utils/helpers";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// Store
const { isActive } = toRefs(props);
const salaryAllowanceDeductionStore = useSalaryAllowanceDeductionStore(
  isActive.value.toString()
);

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey =
  SettingsEventKeys.SALARY_ALLOWANCE_DEDUCTION_TABLE_UPDATE;

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
  salaryAllowanceDeductionStore.templates = param;
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
  await salaryAllowanceDeductionStore.refresh();
};

const getData = async () => {
  await salaryAllowanceDeductionStore.getData(isActive.value.toString());
};
<\/script>
`;export{e as default};
