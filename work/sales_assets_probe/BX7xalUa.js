const e=`<template>
  <div>
    <flex-col class="gap-5">
      <div v-if="isEmpty" class="text-center p-12 text-xl">
        {{ t("empty") }}
      </div>
      <div
        v-for="(table, tableIdx) in invoicesStore.byExpeditorData?.items"
        :key="table.shipping_date"
        class="rounded-lg border"
      >
        <div
          class="italic sticky top-0 z-1 p-4 border-b-1 blur-background rounded-t-lg"
        >
          {{ t("column.shipped_date") }}:
          {{ getFormattedDate(table.shipping_date, "DD.MM.YYYY") }}
        </div>
        <flex-col class="p-4 gap-4">
          <div
            v-for="whItem in table.warehouse_arr"
            :key="whItem?.warehouse?.id"
            class="table-content-container"
          >
            <div class="table-content-header flex items-center justify-between">
              <div class="flex items-center gap-5">
                <div class="font-semibold">
                  {{ t("sidebar.warehouse") }}:
                  {{ whItem.warehouse?.name }}
                </div>
              </div>
              <InvoicesGeneralConfDropdown
                v-if="hasAccess2Excel520 || hasAccess2Excel217"
                :invoice-ids="checkedShippingInvIds"
              />
            </div>
            <div class="table-content-body">
              <data-table
                :headers="headers"
                :is-empty="!whItem.expeditor_arr?.length"
                :check-disabled="isItemsUncheckable(whItem)"
                :check="
                  isAllItemsChecked(table.shipping_date, whItem.warehouse?.id)
                "
                :indeterminate="
                  isAllItemsIndeterminate(
                    table.shipping_date,
                    whItem.warehouse?.id
                  )
                "
                @getAllId="
                  toggleCheckAllItems(table.shipping_date, whItem.warehouse?.id)
                "
              >
                <template #body>
                  <template
                    v-for="(expItem, expIdx) in whItem.expeditor_arr"
                    :key="expItem.expeditor?.id"
                  >
                    <c-tr class="border-b-0">
                      <c-td-no-edit
                        v-for="key in headers"
                        :key="key.key"
                        :type="key.type"
                        :is-checked="key.checked"
                      >
                        <div v-if="key.key === 'checkbox'">
                          <Checkbox
                            :id="expItem.expeditor?.id + expIdx"
                            :checked="
                              isItemChecked(expItem.shipping_invoice?.id)
                            "
                            :disabled="!expItem.shipping_invoice?.id"
                            @change="
                              onCheckItem(expItem.shipping_invoice?.id, $event)
                            "
                          />
                        </div>
                        <LinkComponent
                          v-else-if="key.key === 'expeditor'"
                          @click="getInvoicesDetails(expItem.invoices)"
                        >
                          {{ expItem.expeditor?.name }}
                        </LinkComponent>
                        <div
                          v-else-if="key.key === 'visual_id'"
                          class="expand-collapse flex gap-2 items-center w-fit select-none"
                          @click="
                            onExpandRow(
                              expItem.expeditor?.id + tableIdx + expIdx
                            )
                          "
                        >
                          <IconArrowBottom
                            :class="[
                              expandedRows.includes(
                                expItem?.expeditor?.id + tableIdx + expIdx
                              )
                                ? 'rotate-180 transition-all'
                                : 'rotate-0 transition-all',
                            ]"
                          />
                          {{ t("expand") }}
                        </div>
                        <div v-else-if="key.key === 'status'">
                          <status-btn-for-table
                            :status-data="getLowestStatus(expItem.invoices)"
                            :data-id="expItem.expeditor?.id"
                            readonly
                          />
                        </div>
                        <div
                          v-else-if="key.key === 'shipping_invoice'"
                          v-show="expItem[key.key]"
                        >
                          <status-btn-for-table
                            :status-data="expItem[key.key]?.status"
                            readonly
                          />
                          - {{ expItem[key.key]?.visual_id }}
                        </div>
                        <div
                          v-else-if="key.key === 'action'"
                          class="flex justify-end gap-4"
                        >
                          <m-btn
                            v-show="isFormInvoicesBtnShowable(expItem)"
                            @click="
                              openSummarizeDialog(
                                expItem.expeditor,
                                whItem.warehouse,
                                table.shipping_date
                              )
                            "
                          >
                            {{ t("invoices.form_shipped_invoices") }}
                          </m-btn>

                          <div v-show="isDownloadInvoiceShowable(expItem)">
                            <InvoicesExcelsDropdown
                              v-if="hasAccess2Excel217 || hasAccess2Excel520"
                              :invoice-id="expItem?.shipping_invoice?.id"
                            />
                          </div>
                        </div>
                        <div v-else>
                          {{ expItem[key.key] }}
                        </div>
                      </c-td-no-edit>
                    </c-tr>
                    <template
                      v-if="
                        expandedRows.includes(
                          expItem?.expeditor?.id + tableIdx + expIdx
                        )
                      "
                    >
                      <c-tr
                        v-for="invoice in expItem?.invoices"
                        :key="invoice.id"
                        class="bg-[#FAFDFD] border-b-0"
                      >
                        <c-td-no-edit
                          v-for="key in headers"
                          :key="key.key"
                          :is-checked="key.checked"
                        >
                          <div v-if="key.key === 'status'">
                            <status-btn-for-table
                              :status-data="invoice[key.key]"
                              :data-id="invoice.id"
                              :available-statuses-by-id="
                                getAvailableStatuses(invoice[key.key].id)
                              "
                              :readonly="
                                getAvailableStatuses(invoice[key.key].id)
                                  ?.length === 0
                              "
                              :is-setting-status-loading="
                                isSettingStatusLoading
                              "
                              @on-change-status-by-id="
                                onChangeStatusById(
                                  $event,
                                  invoice,
                                  table.shipping_date
                                )
                              "
                            />
                          </div>
                          <LinkComponent
                            v-else-if="key.key === 'visual_id'"
                            @click="getInvoiceDetail(invoice.id)"
                          >
                            {{ invoice[key.key] }}
                          </LinkComponent>
                          <div v-else-if="key.key === 'warehouse_block'">
                            {{ invoice?.warehouse_block?.name }}
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
          </div>
        </flex-col>
      </div>
    </flex-col>
    <SkeletonBlock v-if="isLoading" height="200px" />
    <div ref="loadMoreTrigger" class="load-more-trigger"></div>
    <transition name="modal">
      <div v-if="detailIds.length">
        <InvoicesAssemblyDetailDialog
          :ids="detailIds"
          @close-dialog="toggleDetailDialog([])"
          @set-checked="setCheckedStatusByInvIds"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="summarizedDialogData">
        <InvoicesGeneralConfirmationRolesDialog
          :expeditor="summarizedDialogData.expeditor"
          :warehouse="summarizedDialogData.warehouse"
          :shipping-date="summarizedDialogData.shippingDate"
          :is-loading="isSummarizeShippingInvLoading"
          @close-dialog="closeSummarizeDialog"
          @save="summarizeShippingInv"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { InvoicesEventKeys } from "~/variable/event-key-constants";
import { onAddFieldToFilter } from "~/utils/store-params";
import { useAssemblyAccess } from "~/composables/access/invoices/assembly-access";
import { useShippingInvoiceAccess } from "~/composables/access/invoices/shipping-access";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";
import type { Template } from "~/interfaces/ui/template";
import type { SummarizedByExpeditorsParamsModel } from "~/interfaces/api/invoices/assembly/by-expeditor-params";
import type {
  ExpeditorArrayModel,
  InvoiceModel,
  WarehouseArrayModel,
} from "~/interfaces/api/invoices/assembly/summarized-by-expeditor-list-model";

// props
const props = defineProps<{
  tabNum: number;
}>();

// emits
const emit = defineEmits(["updateNextTabs"]);

// store
const invoicesStore = useInvoicesStore("main");

// types
type EmitDataType = {
  warehouse_id_arr: string[];
  status_id_arr: string[];
  expeditor_id_arr: string[];
  date_range: { from_value: string; to_value: string };
};

type SummarizeShippingInvType = {
  warehouse_id: string;
  expeditor_id: string;
  shipping_date: string;
  is_expeditor_confirmation_required: boolean;
  is_warehouseman_confirmation_required: boolean;
  is_operator_confirmation_required: boolean;
};

// states
const { t } = useI18n();
const { hasAccess2Excel, hasAccess2Check } = useAssemblyAccess();
const { hasAccess2Generate, hasAccess2Excel217, hasAccess2Excel520 } =
  useShippingInvoiceAccess();

const updateListEventKey = InvoicesEventKeys.BY_EXPEDITOR_TABLE_UPDATE;
const eventBus = useEventBus();
const loadMoreTrigger = ref(null);
const isLoading = ref(false);
const expandedRows = ref<string[]>([]);
const pageSize = ref(3); // used to fetch by days, 3 = 3 days
const isSettingStatusLoading = ref<string | null>(null);
const detailIds = ref<string[]>([]);
const checkedShippingInvIds = ref<string[]>([]);
const isSummarizeShippingInvLoading = ref<boolean>(false);

const statuses = [
  {
    id: 4,
    name: t("invoices.checked"),
    hasAccess: computed(() => hasAccess2Check.value),
  },
];

const summarizedDialogData = ref<
  | {
      expeditor: { name: string; id: string };
      warehouse: { name: string; id: string };
      shippingDate: string;
    }
  | undefined
>(undefined);

const checkedStatusState = ref<
  Omit<ConstantModel, "key"> & { hex_color: string }
>({
  id: 4,
  name: t("invoices.checked"),
  hex_color: "#23C00A",
});

const waitingToCollectStatusState = ref<
  Omit<ConstantModel, "key"> & { hex_color: string }
>({
  id: 1,
  name: t("invoices.waiting_for_confirm"),
  hex_color: "#299B9B",
});

const accessAction = computed(() => {
  return (
    hasAccess2Excel217.value ||
    hasAccess2Excel520.value ||
    hasAccess2Generate.value
  );
});

const headers = ref<Template[]>([
  {
    name: "",
    checked: true,
    key: "checkbox",
    type: "checkbox",
  },
  {
    name: t("sidebar.delivery"),
    key: "expeditor",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("invoices.assembly_invoices"),
    key: "visual_id",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("column.status"),
    key: "status",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("sidebar.warehouse_block"),
    key: "warehouse_block",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("invoices.shipping_invoice"),
    key: "shipping_invoice",
    checked: true,
    is_sortable: false,
  },
  {
    name: "",
    checked: accessAction.value,
    key: "action",
    type: "action",
  },
]);

const params = reactive<SummarizedByExpeditorsParamsModel>({
  date_range: invoicesStore.params.date_range,
  filter: [],
  reference: computed(() => invoicesStore.byExpeditorData?.reference?.forward),
  page_size: pageSize.value,
  get_next: true,
});

// event-bus
const updateListHandler = async (emitData: EmitDataType | undefined) => {
  if (!emitData && !invoicesStore.byExpeditorData) return;
  if (emitData) {
    setFiltersByEmitData(emitData);
  }
  invoicesStore.byExpeditorData = undefined;
  await getData();
};

eventBus.on(updateListEventKey, updateListHandler);

onUnmounted(() => {
  eventBus.off(updateListEventKey, updateListHandler);
});

// hooks
const isReferenceNull = computed(() => params?.reference === null);

const isEmpty = computed(
  () => !isLoading.value && !invoicesStore.byExpeditorData?.items?.length
);

onMounted(async () => {
  triggerLoadMore();
});

watch(accessAction, (newValue) => {
  headers.value = headers.value.map((template) =>
    template.key === "action" ? { ...template, checked: newValue } : template
  );
});
// methods
// table-check-uncheck
const getWarehouseItem = (
  shippingDate: string,
  warehouseId: string
): WarehouseArrayModel | undefined => {
  return invoicesStore.byExpeditorData?.items
    .find((item) => item.shipping_date === shippingDate)
    ?.warehouse_arr.find((wh) => wh.warehouse?.id === warehouseId);
};

const getShippingInvoiceIds = (whItem: WarehouseArrayModel) => {
  return (
    whItem?.expeditor_arr
      .map((exp) => exp.shipping_invoice?.id)
      .filter(Boolean) || []
  );
};

const isItemsUncheckable = (whItem: WarehouseArrayModel) => {
  const shippingInvIds = getShippingInvoiceIds(whItem);
  return !shippingInvIds.length;
};

const isAllItemsChecked = (shippingDate: string, warehouseId: string) => {
  const whItem = getWarehouseItem(shippingDate, warehouseId);
  if (!whItem) return false;
  const shippingInvIds = getShippingInvoiceIds(whItem);
  if (!shippingInvIds.length) return false;
  return shippingInvIds.every((id) => checkedShippingInvIds.value.includes(id));
};

const isAllItemsIndeterminate = (shippingDate: string, warehouseId: string) => {
  if (isAllItemsChecked(shippingDate, warehouseId)) return false;
  const whItem = getWarehouseItem(shippingDate, warehouseId);
  if (!whItem) return false;
  const shippingInvIds = getShippingInvoiceIds(whItem);
  if (!shippingInvIds.length) return false;
  return shippingInvIds.some((id) => checkedShippingInvIds.value.includes(id));
};

const isItemChecked = (id: string | undefined) => {
  return id ? checkedShippingInvIds.value.includes(id) : false;
};

const toggleCheckAllItems = (shippingDate: string, warehouseId: string) => {
  const whItem = getWarehouseItem(shippingDate, warehouseId);
  if (!whItem) return;

  const shippingInvIds = getShippingInvoiceIds(whItem);
  const areAllChecked = shippingInvIds.every((id) =>
    checkedShippingInvIds.value.includes(id)
  );

  checkedShippingInvIds.value = areAllChecked
    ? checkedShippingInvIds.value.filter((id) => !shippingInvIds.includes(id))
    : [...new Set([...checkedShippingInvIds.value, ...shippingInvIds])];
};

const onCheckItem = (id: string | undefined, isChecked: boolean) => {
  if (!id) return;

  checkedShippingInvIds.value = isChecked
    ? [...checkedShippingInvIds.value, id]
    : checkedShippingInvIds.value.filter((item) => item !== id);
};

// get-data
const setFiltersByEmitData = (emitData: EmitDataType) => {
  onAddFieldToFilter<SummarizedByExpeditorsParamsModel>(
    params,
    "warehouse_id",
    emitData.warehouse_id_arr
  );
  onAddFieldToFilter<SummarizedByExpeditorsParamsModel>(
    params,
    "status",
    emitData.status_id_arr
  );
  onAddFieldToFilter<SummarizedByExpeditorsParamsModel>(
    params,
    "expeditor_id",
    emitData.expeditor_id_arr
  );
  params.date_range.from_value = getFormattedDate(
    emitData.date_range.from_value,
    "YYYY-MM-DD"
  );
  params.date_range.to_value = getFormattedDate(
    emitData.date_range.to_value,
    "YYYY-MM-DD"
  );
};

const getData = async () => {
  isLoading.value = true;
  await invoicesStore.getSummarizedByExpeditorsList(params);
  isLoading.value = false;
};

const refresh = async () => {
  const { reference, ...restParams } = params; // Destructure to remove \`reference\`

  await invoicesStore.getSummarizedByExpeditorsList(restParams);
};

const triggerLoadMore = () => {
  if (loadMoreTrigger.value) {
    const observer = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting) {
        await onLoadElse();
      }
    });
    observer.observe(loadMoreTrigger.value);
  }
};

const onLoadElse = async () => {
  if (isLoading.value || isReferenceNull.value) return;
  isLoading.value = true;
  await invoicesStore.onLoadElseSummarizedByExpeditorsList(params);
  isLoading.value = false;
};

// dialogs
const toggleDetailDialog = (ids: string[]) => {
  detailIds.value = ids;
};

const getInvoicesDetails = (invoices: InvoiceModel[]) => {
  const invoicesIds = invoices.map((invoice) => invoice.id);
  toggleDetailDialog(invoicesIds);
};

const getInvoiceDetail = (id: string) => {
  toggleDetailDialog([id]);
};

const openSummarizeDialog = (
  expeditor: { name: string; id: string },
  warehouse: { name: string; id: string },
  shippingDate: string
) => {
  summarizedDialogData.value = {
    expeditor,
    warehouse,
    shippingDate,
  };
};

const closeSummarizeDialog = () => {
  summarizedDialogData.value = undefined;
};

const summarizeShippingInv = async (payload: SummarizeShippingInvType) => {
  isSummarizeShippingInvLoading.value = true;
  const res = await invoicesStore.generateShippingInvoice(payload);
  if (res !== "error") {
    await setShippingInvoiceDetail(res);
    closeSummarizeDialog();
    await refresh();
  }
  emit("updateNextTabs", props.tabNum);
  isSummarizeShippingInvLoading.value = false;
};

// statuses
const getAvailableStatuses = (statusId: number | null | undefined) => {
  const availableStatuses = statuses.filter((status) => status.hasAccess.value);

  switch (statusId) {
    case 3:
      return availableStatuses.filter((status) => status.id === 4);
    default:
      return [];
  }
};

const getLowestStatus = (invoices: InvoiceModel[]) => {
  const sortedInvoices = [...invoices].sort(
    (a, b) => a.status.id - b.status.id
  );

  return sortedInvoices[0].status;
};

const onChangeStatusById = async (
  statusId: number,
  invoice: InvoiceModel,
  shipping_date: string
) => {
  isSettingStatusLoading.value = invoice.id;
  emit("updateNextTabs", props.tabNum);
  switch (statusId) {
    case 4:
      let res = await invoicesStore.setChecked([invoice.id]);
      if (res !== "error") {
        await setCheckedStatusByInvIds([invoice.id]);
        await refresh();
      }
      break;
    default:
      break;
  }
  isSettingStatusLoading.value = null;
};

const setCheckedStatusByInvIds = async (invoiceIds: string[]) => {
  invoiceIds.forEach((id) => {
    invoicesStore.byExpeditorData?.items.forEach((item) => {
      const expeditor = item.warehouse_arr[0].expeditor_arr.find((exp) =>
        exp.invoices.some((inv) => inv.id === id)
      );
      if (expeditor) {
        const invoice = expeditor.invoices.find((inv) => inv.id === id);
        if (invoice) {
          invoice.status = checkedStatusState.value;
        }
      }
    });
  });
};

// additional
const onExpandRow = (id: string) => {
  if (expandedRows.value.includes(id)) {
    expandedRows.value = expandedRows.value.filter((item) => item !== id);
  } else {
    expandedRows.value = [...expandedRows.value, id];
  }
};

const isFormInvoicesBtnShowable = (expItem: ExpeditorArrayModel) => {
  const isAllStatusesChecked = expItem.invoices.every(
    (invoice) => invoice.status?.id === invoicesStore.StatusIds.checked
  );
  const isAlreadyFormedInvoice = expItem.shipping_invoice;
  return (
    isAllStatusesChecked && !isAlreadyFormedInvoice && hasAccess2Generate.value
  );
};

const isDownloadInvoiceShowable = (expItem: ExpeditorArrayModel) => {
  return !!expItem.shipping_invoice && hasAccess2Excel.value;
};

const setShippingInvoiceDetail = async (detail: {
  id: string;
  visual_id: string;
}) => {
  if (!summarizedDialogData.value) return;

  const { expeditor, warehouse, shippingDate } = summarizedDialogData.value;
  if (!expeditor?.id || !warehouse?.id || !shippingDate) return;

  if (!invoicesStore.byExpeditorData?.items) return;

  invoicesStore.byExpeditorData.items.forEach((item) => {
    if (item.shipping_date !== shippingDate) return;

    const warehouseMatch =
      item.warehouse_arr?.[0]?.warehouse?.id === warehouse.id;
    if (!warehouseMatch) return;

    const expeditorArr = item.warehouse_arr[0].expeditor_arr;
    const targetExpeditor = expeditorArr.find(
      (e) => e.expeditor?.id === expeditor.id
    );

    if (targetExpeditor && !targetExpeditor.shipping_invoice) {
      targetExpeditor.shipping_invoice = {
        id: detail.id,
        visual_id: detail.visual_id,
        status: waitingToCollectStatusState.value,
      };
    }
  });

  closeSummarizeDialog();
};
<\/script>

<style scoped lang="scss">
.load-more-trigger {
  height: 1px;
}

.table-content-container {
  overflow: hidden;

  .table-content-body {
    padding-bottom: 0 !important;
  }
}

.blur-background {
  backdrop-filter: blur(2px);
  background-color: rgba(255, 255, 255, 0.5);
}
</style>
`;export{e as default};
