const e=`<template>
  <div>
    <div class="table-content-container !border-none !rounded-none">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="saveKey"
          :templates="currentStore.templates"
          @onChangeTableHeaders="onChangeHeaders"
        />
        <ShowHideColumn :headers="currentStore.templates" :save-key="saveKey" />
        <page-size-btn
          :current-size="currentStore.params?.page_size"
          :total-count="currentStore.data?.total_count"
          :page-number="currentStore.data?.page_number"
          @setPageSize="(s) => currentStore.setPageSize(s)"
        />
        <search-input
          @change="(v) => currentStore.search(v)"
          :value="currentStore.params?.search ?? undefined"
        />
        <RefreshBtn
          @click="currentStore.refresh"
          :loading="currentStore.isLoading"
        />
        <excel-btn
          :loading="currentStore.isExcelFileDownloading"
          @click="currentStore.onDownloadExcelFile"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="currentStore.templates"
          @sort="(p) => currentStore.sortData(p)"
          :sorted="currentStore.params?.order_by"
          :loading="currentStore.isLoading"
          :isEmpty="!currentStore.data?.items?.length"
        >
          <template #body>
            <c-tr v-for="row in currentStore.data?.items" :key="row.id">
              <c-td-no-edit
                v-for="column in currentStore.templates"
                :key="column.key"
                :is-checked="column.checked"
                :type="column.type"
              >
                <div
                  v-if="column.key === 'name' && activeTab === 2"
                  class="text-primary-600 font-medium text-sm hover:underline cursor-pointer"
                  @click="openDetailDialog(row.id)"
                >
                  {{ row.name }}
                </div>

                <div v-else-if="row[column.key] && column.type === 'array'">
                  <ShowMore :data="row[column.key]" :show-count="2" />
                </div>

                <template v-else-if="column.key === 'for_consignation'">
                  <Tag variant="outlined" color="gray" class="text-sm">
                    {{ getConsignation(row) }}
                  </Tag>
                </template>

                <template
                  v-else-if="
                    ['base_currency_name', 'base_currency.name'].includes(
                      column.key,
                    )
                  "
                >
                  <Tag variant="outlined" color="gray" class="text-sm">
                    {{ getDataValue(row, column.key, column.type) }}
                  </Tag>
                </template>

                <div v-else-if="column.key === 'action'" class="flex gap-x-3">
                  <rounded-icon-btn
                    v-if="isAllowForSave"
                    type="edit"
                    :iconSize="20"
                    @click="openEditDialog(row.id)"
                  />
                </div>
                <div v-else>
                  {{ getDataValue(row, column.key, column.type) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="currentStore.params?.page_size"
          :total-count="currentStore.data?.total_count"
          :page-number="currentStore.data?.page_number"
        />
        <page-index
          :available-pages="currentStore.data?.total_pages"
          :current-page="currentStore.data?.page_number"
          @setPage="(p) => currentStore.setPage(p)"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="detailItemId">
        <OrdersRequestAutomationDetailsDialog
          :id="detailItemId"
          @closeDialog="closeDetailDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="editingItemId">
        <OrdersRequestAutomationLimitConditionDialogBody
          v-if="activeTab === 1"
          :id="editingItemId"
          :is-active="isActive"
          @closeDialog="closeEditDialog"
        />
        <OrdersRequestAutomationFormDialog
          v-else
          :id="editingItemId"
          :is-active="isActive"
          @closeDialog="closeEditDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import {
  getDataValue,
  type AmountConditionListModel,
  type OrderRequestAutomationListModel,
  type OrderRequestAutomationParams,
} from "#imports";
import { useI18n } from "vue-i18n";
import { OrderEventKeys } from "~/variable/event-key-constants";
import { useEventBus } from "~/composables/EventBus/eventBus";

// Props

const props = defineProps<{
  activeTab: number;
  isAllowForSave?: boolean;
  saveKey?: string;
  isActive: boolean;
}>();

// Composables
const { t } = useI18n();
const eventBus = useEventBus();

// Stores
const currentStore = computed(() => {
  return props.activeTab === 1
    ? useAmountLimitConditionStore(props.isActive.toString())
    : useRequestAutomationStore(props.isActive.toString());
});

// States

const editingItemId = ref("");
const detailItemId = ref("");

// Constants
const updateListEventKey = OrderEventKeys.REQUEST_AUTOMATION_TABLE_UPDATE;
const updateIsLoadingEventKey =
  OrderEventKeys.REQUEST_AUTOMATION_IS_LOADING_UPDATE;

// Hooks

watch(
  () => currentStore.value.isLoading,
  (isLoading) => {
    eventBus.emit(updateIsLoadingEventKey, isLoading);
  },
);

eventBus.on(updateListEventKey, handleUpdateList);

onBeforeUnmount(() => {
  eventBus.off(updateListEventKey, handleUpdateList);
});

// Methods
const getConsignation = (
  data: AmountConditionListModel | OrderRequestAutomationListModel,
) => {
  return typeof data.for_consignation === "boolean"
    ? t(data.for_consignation ? "filters.yes" : "filters.no")
    : t("filters.all");
};

async function handleUpdateList({
  activeTab,
  isActive,
  filters,
}: {
  activeTab: number;
  isActive: boolean;
  filters?: OrderRequestAutomationParams;
}) {
  if (
    activeTab !== props.activeTab ||
    (typeof isActive === "boolean" && isActive !== props.isActive)
  )
    return;

  if (filters) {
    if (activeTab === 1) {
      applyFiltersLimitCondition(filters);
    } else if (activeTab === 2) {
      applyFiltersRequestAutomation(filters);
    }
  } else {
    refresh();
  }
}

const applyFiltersLimitCondition = (filters: OrderRequestAutomationParams) => {
  currentStore.value.params.trade_direction_id_arr =
    filters.trade_direction_ids;
  currentStore.value.params.warehouse_id_arr = filters.warehouse_ids;
  currentStore.value.params.territory_id_arr = filters.territory_id_arr;
  currentStore.value.params.currency_id_arr = filters.currency_ids;
  currentStore.value.params.agent_id_arr = filters.agent_ids;

  currentStore.value.setDynamicFilter("is_active", [String(props.isActive)]);
};

const applyFiltersRequestAutomation = (
  filters: OrderRequestAutomationParams,
) => {
  currentStore.value.setDynamicFilter("is_active", [String(props.isActive)]);

  Object.entries(filters).forEach(([field, values]) => {
    if (field !== "territory_id_arr") {
      currentStore.value.setDynamicFilter(field, values);
    }
  });
};

const refresh = async () => {
  await currentStore.value.refresh();
};

const onChangeHeaders = (value: Template[]) => {
  currentStore.value.templates = value;
};

const openEditDialog = (id: string | undefined) => {
  if (!id) return;
  editingItemId.value = id;
};

const closeEditDialog = () => {
  editingItemId.value = "";
};

const openDetailDialog = (id: string | undefined) => {
  if (!id) return;
  detailItemId.value = id;
};

const closeDetailDialog = () => {
  detailItemId.value = "";
};
<\/script>
`;export{e as default};
