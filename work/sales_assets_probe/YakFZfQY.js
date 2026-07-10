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
                <div
                  v-if="key.key === 'load_date'"
                  class="flex justify-start items-center expand-collapse w-fit select-none"
                  @click="onExpandRow(index)"
                >
                  <IconArrowBottom
                    :class="[
                      expandedRows.includes(index)
                        ? 'rotate-180 transition-all'
                        : 'rotate-0 transition-all',
                    ]"
                  />
                  <div class="ml-3 text-[#424F4F]">
                    {{ getFormattedDate(data[key.key], "DD.MM.YYYY HH:mm") }}
                  </div>
                </div>
                <Checkbox
                  :id="index"
                  v-else-if="key.key === 'checkbox'"
                  :disabled="isStatusesCancelable(data.invoices)"
                  :checked="getCheckedAssembly(data?.invoices)"
                  @change="setCheckedByItem($event, data.invoices)"
                />
                <div v-else-if="isMultiShowableField(key.key)">
                  <show-more
                    :show-count="1"
                    :data="getDataForShowCount(data.invoices, key.key)"
                  />
                </div>
                <div v-else-if="key.key === 'shipping_date'">
                  {{ getFormattedDate(data[key.key], "DD.MM.YYYY") }}
                </div>
                <div v-else-if="key.key === 'status'">
                  <status-btn-for-table
                    :status-data="getLowestStatus(data.invoices)"
                    readonly
                  />
                </div>
                <div v-else-if="key.key === 'action'">
                  <excel-btn
                    v-if="hasAccess2Excel"
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
            <template
              v-if="expandedRows.includes(index) && data.invoices.length"
            >
              <c-tr
                v-for="invoice in data.invoices"
                :key="invoice.id"
                class="bg-[#FAFDFD]"
              >
                <c-td-no-edit
                  v-for="key in invoicesStore.headersItem"
                  :key="key.key"
                  :is-checked="key.checked"
                >
                  <div v-if="key.key === 'status'">
                    <status-btn-for-table
                      :status-data="invoice.status"
                      :data-id="invoice.id"
                      :available-statuses-by-id="
                        getAvailableStatuses(invoice.status.id)
                      "
                      :is-setting-status-loading="isSettingStatusLoading"
                      @onChangeStatusById="setStatus($event, invoice.id)"
                    />
                  </div>
                  <Checkbox
                    :id="invoice?.id"
                    v-else-if="key.key === 'checkbox'"
                    :disabled="isChildStatusesCancelable(invoice)"
                    :checked="getCheckedAssembly([invoice])"
                    @change="setCheckedByItem($event, [invoice])"
                  />
                  <div v-else-if="key.key === 'collection_date'">
                    <div v-if="invoice[key.key]" class="w-35">
                      {{ getFormattedCollectionDate(invoice[key.key]) }}
                    </div>
                  </div>
                  <div v-else-if="key.key === 'warehouse_name'">
                    {{ invoice?.warehouse.name }}
                  </div>
                  <div v-else-if="isObjectType(invoice[key.key])">
                    {{ invoice[key.key].name }}
                  </div>
                  <div v-else-if="key.key === 'shipping_date'">
                    {{ getFormattedDate(data[key.key], "DD.MM.YYYY") }}
                  </div>
                  <div
                    v-else-if="key.key === 'action'"
                    class="flex justify-end"
                  >
                    <excel-btn
                      v-if="hasAccess2Excel"
                      :loading="downloadingInvoiceId === invoice.id"
                      :tooltip="t('invoices.download_assembly_invoices_detail')"
                      @click="
                        getExcelByInvoicesDetail(
                          invoice.id,
                          invoice.expeditor.name,
                        )
                      "
                    />
                  </div>
                  <div v-else>
                    {{ invoice[key.key] }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
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
    <div v-if="startCollectingDataId">
      <InvoicesAssemblyStartCollectingDialog
        :id="startCollectingDataId"
        @close-dialog="closeStartCollectingDialog"
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
import type { WarehouseInvoiceListModel } from "~/interfaces/api/invoices/assembly/warehouse-invoice-list-model";
import type { Template } from "~/interfaces/ui/template";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { InvoicesEventKeys } from "~/variable/event-key-constants";
import type { InvoiceModel } from "~/interfaces/api/invoices/assembly/summarized-by-expeditor-list-model";
import { useAssemblyAccess } from "~/composables/access/invoices/assembly-access";
import { notify } from "@kyvg/vue3-notification";
import { assemblyInvoices } from "~/variable/column-constants";
import type { ComputedRef } from "vue";

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

type StatusType = {
  id: number;
  name: string;
  hasAccess: ComputedRef<boolean>;
};

// stores
const invoicesStore = useInvoicesStore("main");

// states
const { t } = useI18n();
const { hasAccess2Excel, hasAccess2Collect, hasAccess2Cancel } =
  useAssemblyAccess();

const eventBus = useEventBus();
const isSettingStatusLoading = ref<string | null>(null);
const downloadingInvoiceId = ref<number | string | null>(null);
const expandedRows = ref<number[]>([]);
const startCollectingDataId = ref<string | null>(null);
const isCancelStatusInvoiceId = ref<null | string>(null);
const isSetCancelStatusLoading = ref<boolean>(false);
const isSetMultipleCancelStatusLoading = ref<boolean>(false);
const checkIdsForMultipleCancel = ref<string[]>([]);
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
    invoicesStore.data?.items?.flatMap(
      (item) =>
        item?.invoices
          ?.filter(
            (nItem) =>
              nItem?.status?.id !== invoicesStore.StatusIds.cancel &&
              nItem?.status?.id !== invoicesStore.StatusIds.checked,
          ) // Correct logical condition
          .map((nItem) => nItem.id) || [],
    ) || [];
  return invoiceAllData?.length === checkIdsForMultipleCancel.value.length;
});

const isAllCheckboxDisabled = computed(() => {
  return (
    invoicesStore.data?.items?.every((item) =>
      item?.invoices?.every(
        (nItem) =>
          nItem?.status?.id === invoicesStore.StatusIds.cancel ||
          nItem?.status?.id === invoicesStore.StatusIds.checked,
      ),
    ) ?? true
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

const openStartCollectingDialog = (id: string) => {
  startCollectingDataId.value = id;
};

const closeStartCollectingDialog = () => {
  startCollectingDataId.value = null;
};

const onChangeTableHeaders = (value: Template[]) => {
  invoicesStore.headersItem = value;
};

const isMultiShowableField = (key: string) => {
  return (
    key === "visual_id" ||
    key === "expeditor" ||
    key === "collector_name" ||
    key === "warehouse_block"
  );
};

const getDataForShowCount = (
  data: WarehouseInvoiceListModel["invoices"],
  key: "visual_id" | "expeditor" | "collector_name" | "warehouse_block",
) => {
  return data.map((item) => item[key]);
};

const getAvailableStatuses = (statusId: number) => {
  const statusMapping: Record<number, StatusType[]> = {
    [invoicesStore.StatusIds.waitingToCollect]: [
      statuses.startCollecting,
      statuses.cancel,
    ],
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

const getLowestStatus = (invoices: InvoiceModel[]) => {
  const sortedInvoices = [...invoices].sort(
    (a, b) => a.status.id - b.status.id,
  );

  return sortedInvoices[0].status;
};

const setStatus = async (statusId: number, dataId: string) => {
  switch (statusId) {
    case 1:
      openStartCollectingDialog(dataId);
      return;
    case 2:
      isSettingStatusLoading.value = dataId;
      await invoicesStore.endCollecting(dataId);
      isSettingStatusLoading.value = null;
      break;
    case 3:
      isCancelStatusInvoiceId.value = dataId;
      break;
  }
  await invoicesStore.refresh();
  emit("updateNextTabs", props.tabNum);
};

const onExpandRow = (index: number) => {
  if (expandedRows.value.includes(index)) {
    expandedRows.value = expandedRows.value.filter((item) => item !== index);
  } else {
    expandedRows.value = [...expandedRows.value, index];
  }
};

const isObjectType = (data: unknown) => {
  return data && typeof data === "object";
};

const refresh = async () => {
  await invoicesStore.refresh();
};

const getExcelByInvoicesDetail = async (id: string, expeditor_name: string) => {
  downloadingInvoiceId.value = id;
  await invoicesStore.getAssemblyExcel(
    [id],
    \`\${t("invoices.assembly_invoices_for")} \${expeditor_name}\`,
  );
  downloadingInvoiceId.value = null;
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
    return;
  }
  isSetCancelStatusLoading.value = false;
};

const getExcelByInvoices = async (
  data: WarehouseInvoiceListModel,
  index: number,
) => {
  downloadingInvoiceId.value = index;
  const invoicesIdArr = data.invoices.map((item) => item.id);
  await invoicesStore.getAssemblyExcel(
    invoicesIdArr,
    t("invoices.assembly_invoices_for_all_forwarders"),
  );
  downloadingInvoiceId.value = null;
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

const setCheckAllAssemblyIds = () => {
  if (isAllChecked.value) {
    checkIdsForMultipleCancel.value = [];
    return;
  }

  checkIdsForMultipleCancel.value =
    invoicesStore.data?.items?.flatMap(
      (item) =>
        item?.invoices
          ?.filter(
            (nItem) =>
              nItem?.status?.id !== invoicesStore.StatusIds.cancel &&
              nItem?.status?.id !== invoicesStore.StatusIds.checked,
          ) // Correct logical condition
          .map((nItem) => nItem.id) || [],
    ) || [];
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

const getCheckedAssembly = (invoices: InvoiceModel[]) => {
  if (!invoices || !checkIdsForMultipleCancel.value) {
    return false;
  }

  const invoicesIds =
    invoices
      ?.filter(
        (nItem) =>
          nItem?.status?.id !== invoicesStore.StatusIds.cancel &&
          nItem?.status?.id !== invoicesStore.StatusIds.checked,
      )
      .map((nItem) => nItem.id) || [];

  const checkedIds = checkIdsForMultipleCancel.value.filter((item) =>
    invoicesIds.includes(item),
  );
  return invoicesIds.length > 0 && checkedIds.length === invoicesIds.length;
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

const isStatusesCancelable = (invoices: InvoiceModel[]) => {
  const invoicesIds =
    invoices
      ?.filter(
        (nItem) =>
          nItem?.status?.id !== invoicesStore.StatusIds.cancel &&
          nItem?.status?.id !== invoicesStore.StatusIds.checked,
      )
      .map((nItem) => nItem.id) || [];
  return invoicesIds.length === 0;
};

const isChildStatusesCancelable = (invoice: InvoiceModel) => {
  return (
    invoice.status.id === invoicesStore.StatusIds.cancel ||
    invoice.status.id === invoicesStore.StatusIds.checked
  );
};
<\/script>
`;export{e as default};
