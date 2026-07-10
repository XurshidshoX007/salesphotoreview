const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header justify-between">
      <div class="table-content-btn-group">
        <table-sort-columns
          :save-key="assemblyInvoices"
          :templates="invoicesStore.headersItem"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="invoicesStore.headersItem"
          :save-key="assemblyInvoices"
        />
        <page-size-btn
          :current-size="invoicesStore.params.page_size"
          :total-count="invoicesStore.data?.total_count"
          :page-number="invoicesStore.data?.page_number"
          @setPageSize="invoicesStore.setPageSize"
        />
        <search-input @change="invoicesStore.search" />
        <RefreshBtn @click="refresh" :loading="invoicesStore.isLoading" />
      </div>
      <m-btn
        v-show="hasAccess2Cancel"
        group="delete"
        :disabled="!checkIdsForMultipleCancel.length"
        :loading="isSetMultipleCancelStatusLoading"
        @click="multipleCancel"
      >
        {{ t("invoices.cancel_multiple") }}
      </m-btn>
    </div>
    <div class="table-content-body">
      <data-table
        :headers="invoicesStore.headersItem"
        :loading="invoicesStore.isLoading"
        :is-empty="!invoicesStore?.data?.items?.length"
        :sorted="invoicesStore.params.order_by"
        :check="isAllChecked"
        :check-disabled="isAllCheckboxDisabled"
        @sort="invoicesStore.sortData"
        @getAllId="setCheckAllAssemblyIds"
      >
        <template #body>
          <template
            v-for="(data, index) in invoicesStore.data?.items"
            :key="index"
          >
            <c-tr>
              <c-td-no-edit
                v-for="key in invoicesStore.headersItem"
                :key="key.key"
                :type="key.type"
                :is-checked="key.checked"
              >
                <div v-if="key.key === 'load_date'">
                  {{ getFormattedDate(data[key.key], "DD.MM.YYYY HH:mm") }}
                </div>
                <Checkbox
                  :id="index"
                  v-else-if="key.key === 'checkbox'"
                  :disabled="isStatusesCancelable(data)"
                  :checked="getCheckedAssembly(data)"
                  @change="setCheckedByItem($event, [data])"
                />
                <div v-else-if="key.key === 'status'">
                  <status-btn-for-table
                    :status-data="data[key.key]"
                    :data-id="data?.id"
                    :available-statuses-by-id="
                      getAvailableStatuses(data.status.id)
                    "
                    :is-setting-status-loading="isSettingStatusLoading"
                    @onChangeStatusById="setStatus($event, data, index)"
                  />
                </div>
                <div
                  v-else-if="key.key === 'collection_date_from'"
                  class="w-35"
                >
                  {{ getFormattedCollectionDate(data["collection_date"]) }}
                </div>
                <div v-else-if="typeof data[key.key] === 'object'">
                  {{ data[key.key]?.name }}
                </div>
                <div v-else-if="key.key === 'shipping_date'">
                  {{ getFormattedDate(data[key.key], "DD.MM.YYYY") }}
                </div>

                <div v-else-if="key.key === 'action'" class="flex justify-end">
                  <excel-btn
                    v-if="hasAccess2Excel && data?.id"
                    :loading="downloadingInvoiceId === index"
                    :tooltip="t('invoices.download_assembly_invoices_all')"
                    @click="getExcelByInvoices(data, index)"
                  />
                </div>
                <div v-else>
                  {{ data[key.key] }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="invoicesStore.params.page_size"
        :total-count="invoicesStore.data?.total_count"
        :page-number="invoicesStore.data?.page_number"
      />
      <page-index
        :available-pages="invoicesStore.data?.total_pages"
        :current-page="invoicesStore.data?.page_number"
        @setPage="invoicesStore.setPage"
      />
    </div>
  </div>

  <transition name="modal">
    <div v-if="startCollectingItemData">
      <InvoicesAssemblyStartCollectingDialog
        :item-data="startCollectingItemData"
        @close-dialog="closeStartCollectingDialog"
        @returnItemId="refreshByItemId"
      />
    </div>
  </transition>
  <transition name="modal">
    <div v-if="isCancelStatusInvoiceId">
      <InvoicesAssemblySetCancelStatusDialog
        :is-save-loading="isSetCancelStatusLoading"
        @close-dialog="isCancelStatusInvoiceId = null"
        @onSave="setCancelStatus"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { onAddFieldToFilter } from "~/utils/store-params";
import type { Template } from "~/interfaces/ui/template";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { InvoicesEventKeys } from "~/variable/event-key-constants";
import type { InvoiceModel } from "~/interfaces/api/invoices/assembly/summarized-by-expeditor-list-model";
import { useAssemblyAccess } from "~/composables/access/invoices/assembly-access";
import { notify } from "@kyvg/vue3-notification";
import { assemblyInvoices } from "~/variable/column-constants";

// props
const props = defineProps<{
  tabNum: number;
}>();

// emtis
const emit = defineEmits(["updateNextTabs"]);

// types
type EmitDataType = {
  warehouse_id_arr: string[];
  status_id_arr: string[];
  expeditor_id_arr: string[];
  date_range: { from_value: string; to_value: string };
};

// stores
const invoicesStore = useInvoicesStore("main");

// states
const { t } = useI18n();
const { hasAccess2Excel, hasAccess2Cancel, hasAccess2Collect } =
  useAssemblyAccess();

const eventBus = useEventBus();
const downloadingInvoiceId = ref<number | string | null>(null);
const startCollectingItemData = ref<InvoiceModel | null>(null);
const isCancelStatusInvoiceId = ref<null | string>(null);
const isSetCancelStatusLoading = ref<boolean>(false);
const isSetMultipleCancelStatusLoading = ref<boolean>(false);
const checkIdsForMultipleCancel = ref<string[]>([]);
const isSettingStatusLoading = ref<string | null>(null);
const invoiceItemIndex = ref<number | null>(null);

const updateListEventKey = InvoicesEventKeys.ASSEMBLY_TABLE_UPDATE;
const statuses = {
  startCollecting: {
    id: 1,
    name: t("invoices.start_collecting"),
    hasAccess: computed(() => hasAccess2Collect.value),
  },
  endCollecting: {
    id: 2,
    name: t("invoices.end_collecting"),
    hasAccess: computed(() => hasAccess2Collect.value),
  },
  cancel: {
    id: 3,
    name: t("clients.cancel"),
    hasAccess: computed(() => hasAccess2Cancel.value),
  },
};

// hooks
eventBus.on(updateListEventKey, async (emitData: EmitDataType) => {
  if (!emitData) {
    await refresh();
    return;
  }
  setFiltersByEmitData(emitData);
});

const isAllChecked = computed(() => {
  if (checkIdsForMultipleCancel.value.length === 0) return false;
  const invoiceAllData =
    invoicesStore.data?.items
      ?.filter(
        (nItem) =>
          nItem?.status?.id !== invoicesStore.StatusIds.cancel &&
          nItem?.status?.id !== invoicesStore.StatusIds.checked &&
          nItem.id !== null,
      ) // Correct logical condition
      .map((nItem) => nItem?.id) || [];
  return invoiceAllData?.length === checkIdsForMultipleCancel.value.length;
});

const isAllCheckboxDisabled = computed(() => {
  return invoicesStore.data?.items?.every(
    (nItem) =>
      nItem?.status?.id === invoicesStore.StatusIds.cancel ||
      nItem?.status?.id === invoicesStore.StatusIds.checked ||
      nItem.id === null,
  );
});

// methods
const setFiltersByEmitData = (emitData: EmitDataType) => {
  onAddFieldToFilter(
    invoicesStore.params,
    "warehouse_id",
    emitData.warehouse_id_arr,
  );
  onAddFieldToFilter(
    invoicesStore.params,
    "expeditor_id",
    emitData.expeditor_id_arr,
  );
  onAddFieldToFilter(invoicesStore.params, "status", emitData.status_id_arr);
  invoicesStore.params.date_range = emitData.date_range;
};

const closeStartCollectingDialog = () => {
  startCollectingItemData.value = null;
};

const onChangeTableHeaders = (value: Template[]) => {
  invoicesStore.headersItem = value;
};

const refresh = async () => {
  await invoicesStore.refresh();
};

const setCancelStatus = async (comment: string | null) => {
  const cancelData = {
    comment: comment,
    invoiceId: isCancelStatusInvoiceId.value,
  };
  isSetCancelStatusLoading.value = true;
  const response = await invoicesStore.setWarehouseInvoiceCancel(cancelData);
  if (response !== "error") {
    await refresh();
    notify({ title: t("successful"), type: "success" });
    isSetCancelStatusLoading.value = false;
    return;
  }
  isSetCancelStatusLoading.value = false;
};

const getExcelByInvoices = async (data: InvoiceModel, index: number) => {
  downloadingInvoiceId.value = index;
  const invoicesIdArr = [data.id];
  await invoicesStore.getAssemblyExcel(
    invoicesIdArr,
    t("invoices.assembly_invoices_for_all_forwarders"),
  );
  downloadingInvoiceId.value = null;
};

const setCheckAllAssemblyIds = () => {
  if (isAllChecked.value) {
    checkIdsForMultipleCancel.value = [];
    return;
  }

  checkIdsForMultipleCancel.value =
    invoicesStore.data?.items
      ?.filter(
        (nItem) =>
          nItem?.status?.id !== invoicesStore.StatusIds.cancel &&
          nItem?.status?.id !== invoicesStore.StatusIds.checked &&
          nItem?.id !== null,
      )
      .map((nItem) => nItem.id) || [];
};

const setCheckedByItem = (event: boolean, invoices: InvoiceModel[]) => {
  if (!checkIdsForMultipleCancel.value) {
    checkIdsForMultipleCancel.value = [];
  }

  if (event) {
    const newIds =
      invoices
        ?.filter(
          (nItem) =>
            nItem?.status?.id !== invoicesStore.StatusIds.cancel &&
            nItem?.status?.id !== invoicesStore.StatusIds.checked,
        )
        .map((nItem) => nItem.id) || [];

    checkIdsForMultipleCancel.value = Array.from(
      new Set([...checkIdsForMultipleCancel.value, ...newIds]),
    );
  } else {
    checkIdsForMultipleCancel.value = checkIdsForMultipleCancel.value.filter(
      (id) => !invoices.some((nItem) => nItem.id === id),
    );
  }
};

const getCheckedAssembly = (data: InvoiceModel) => {
  const checkedIds = checkIdsForMultipleCancel.value || [];

  if (!data.id || !checkedIds.length) {
    return false;
  }

  const isAllChecked = !!checkedIds.find((id) => id === data.id);
  return isAllChecked;
};

const multipleCancel = async () => {
  if (checkIdsForMultipleCancel.value.length > 0) {
    isSetMultipleCancelStatusLoading.value = true;
    for (const item of checkIdsForMultipleCancel.value) {
      const cancelData = {
        comment: null,
        invoiceId: item, // Use the item from the loop for invoiceId
      };

      try {
        const response =
          await invoicesStore.setWarehouseInvoiceCancel(cancelData);
        if (response !== "error") {
        } else {
          notify({ title: t("failed_to_cancel"), type: "error" });
        }
      } catch (error) {
        notify({ title: t("error"), type: "error" });
      }
    }
    notify({ title: t("successful"), type: "success" });
    checkIdsForMultipleCancel.value = [];
    isSetMultipleCancelStatusLoading.value = false;
    await refresh();
  } else {
    notify({ title: t("first_select_invoice"), type: "warning" });
  }
};

const isStatusesCancelable = (data: InvoiceModel) => {
  if (data.id === null) return true;

  const hasCancelableStatus =
    data?.status?.id !== invoicesStore.StatusIds.cancel &&
    data?.status?.id !== invoicesStore.StatusIds.checked;

  return !hasCancelableStatus;
};

const getFormattedCollectionDate = (date: {
  from: string | null;
  to: string | null;
}) => {
  const fromDate = date?.from
    ? t("filters.from") +
      " " +
      getFormattedDate(date?.from!, "DD.MM.YYYY HH:mm")
    : "";
  const endDate = date?.to
    ? t("filters.to") + " " + getFormattedDate(date?.to!, "DD.MM.YYYY HH:mm")
    : "";

  return fromDate + " " + endDate;
};

const getAvailableStatuses = (statusId: number) => {
  const statusMapping: Record<number, StatusType[]> = {
    [invoicesStore.StatusIds.waitingToCollect]: [statuses.startCollecting],
    [invoicesStore.StatusIds.collecting]: [
      statuses.endCollecting,
      statuses.cancel,
    ],
    [invoicesStore.StatusIds.collected]: [statuses.cancel],
  };

  const relevantStatuses = statusMapping[statusId] || [];

  return relevantStatuses
    .filter((status: StatusType) => status.hasAccess.value)
    .map(({ id, name }: StatusType) => ({ id, name }));
};

const setStatus = async (
  statusId: number,
  itemData: InvoiceModel,
  index: number,
) => {
  switch (statusId) {
    case 1:
      openStartCollectingDialog(itemData);
      invoiceItemIndex.value = index;
      return;
    case 2:
      isSettingStatusLoading.value = itemData.id;
      await invoicesStore.endCollecting(itemData.id);
      isSettingStatusLoading.value = null;
      break;
    case 3:
      isCancelStatusInvoiceId.value = itemData.id;
      break;
  }
  await invoicesStore.refresh();
  emit("updateNextTabs", props.tabNum);
};

const openStartCollectingDialog = (itemData: InvoiceModel) => {
  startCollectingItemData.value = itemData;
};

const refreshByItemId = async (id: string) => {
  const invoiceItem = await invoicesStore.getInvoiceById(id);
  invoicesStore.data.items[invoiceItemIndex.value] = invoiceItem;
  invoiceItemIndex.value = null;
};
<\/script>
`;export{e as default};
