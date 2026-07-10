const n=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="paymentCancellationReasonHeader"
        :templates="paymentCancellationReasonStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="paymentCancellationReasonStore.templates"
        :save-key="paymentCancellationReasonHeader"
      />
      <page-size-btn
        :current-size="paymentCancellationReasonStore.params.page_size"
        :total-count="paymentCancellationReasonStore.data?.total_count"
        :page-number="paymentCancellationReasonStore.data?.page_number"
        @setPageSize="paymentCancellationReasonStore.setPageSize"
      />
      <search-input
        @change="paymentCancellationReasonStore.search"
        :value="paymentCancellationReasonStore.params.search"
      />
      <excel-btn
        @click="paymentCancellationReasonStore.onDownloadExcelFile"
        :loading="paymentCancellationReasonStore.isExcelFileDownloading"
      />
      <RefreshBtn
        @click="refresh"
        :loading="paymentCancellationReasonStore.loading"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="paymentCancellationReasonStore.templates"
        @sort="paymentCancellationReasonStore.sortData"
        :is-empty="!paymentCancellationReasonStore?.data?.items.length"
        :sorted="paymentCancellationReasonStore.params.order_by"
        :loading="paymentCancellationReasonStore.loading"
      >
        <template #body>
          <c-tr
            v-for="data in paymentCancellationReasonStore.data?.items"
            :key="data"
          >
            <c-td-no-edit
              v-for="key in paymentCancellationReasonStore.templates"
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
        :current-size="paymentCancellationReasonStore.params.page_size"
        :total-count="paymentCancellationReasonStore.data?.total_count"
        :page-number="paymentCancellationReasonStore.data?.page_number"
      />
      <page-index
        :available-pages="paymentCancellationReasonStore.data?.total_pages"
        :current-page="paymentCancellationReasonStore.data?.page_number"
        @setPage="paymentCancellationReasonStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsPaymentCancellationReasonDialog
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
import { paymentCancellationReasonHeader } from "~/variable/column-constants";
// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// store
const { isActive } = toRefs(props);
const paymentCancellationReasonStore = usePaymentCancellationReasonStore(
  isActive.value.toString(),
);

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey =
  SettingsEventKeys.PAYMENT_CANCELLATION_REASON_TABLE_UPDATE;

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
  paymentCancellationReasonStore.templates = param;
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
  await paymentCancellationReasonStore.refresh();
};

const getData = async () => {
  await paymentCancellationReasonStore.getData(isActive.value.toString());
};
<\/script>
`;export{n as default};
