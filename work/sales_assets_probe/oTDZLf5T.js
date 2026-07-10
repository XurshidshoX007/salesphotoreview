const e=`<template>
  <div>
    <div class="table-content-container relative">
      <OptimizedDataTable
        row-selection
        :headers="orderStore.templates"
        :data="orderStore.data?.items"
        :save-key="orderColumn"
        :is-loading="orderStore.isLoading"
        :pagination-options="pageSizeOptions"
        :is-excel-file-loading="orderStore.isExcelFileDownloading"
        :searching-value="orderStore.params.search"
        :sorted="orderStore.params.order_by"
        :is-filter-visible="isFilterVisible"
        @on-sort="orderStore.sortData"
        @set-page-size="orderStore.setPageSize"
        @set-page="orderStore.setPage"
        @on-search="orderStore.search"
        @download-excel-file="orderStore.onDownloadExcelFile"
        @update-headers-order="onChangeTableHeaders"
        @refresh="refresh"
        @selected-rows="onCheckItem"
      >
        <template #header_right>
          <m-btn v-if="isShowOrderGenerate" @click="openOrderGenerateDialog"
            >{{ t("labels.generating_order") }}
          </m-btn>
        </template>
        <template #visual_id="{ row }">
          <div class="flex flex-col">
            <div class="flex gap-x-2 items-center">
              <link-component
                :to="{
                  path:
                    row?.type?.id === 3
                      ? '/orders/orders/exchange'
                      : '/orders/orders/details',
                  query: { id: row?.id, type: row?.type.id },
                }"
                :value="row.visual_id"
                :is-linkable="hasAccess2Detail"
              />
            </div>
          </div>
        </template>
        <template #status="{ row }">
          <StatusBtnForTable
            :statusData="row.status"
            :dataId="row.id"
            :typeId="row.type.id"
            :isSettingStatusLoading="isSettingStatusLoading"
            :availableStatusesById="availableStatusesForCurrentId"
            :hasPartialReturn="row.has_partial_return"
            :isPartialReturnApproved="row.is_partially_return_approved"
            :sourceId="!!row.source_order"
            @onOpenStatusDropdown="
              onOpenStatusDropdown($event, row?.show_partial_return)
            "
            @onChangeStatusById="onChangeStatusByStatusId"
          />
        </template>
        <template #type_id="{ row }">
          <div v-if="row?.source_order?.id">
            <span>
              <link-component
                :to="{
                  path: '/orders/orders/details',
                  query: {
                    id: row?.id,
                    type: row?.type.id,
                  },
                }"
                :value="\`Возврат с полки по заказу\`"
                :is-linkable="hasAccess2Detail"
                style="color: #640617"
              />
            </span>
            <span>
              <link-component
                :to="{
                  path: '/orders/orders/details',
                  query: {
                    id: row.source_order?.id,
                    type: row?.type.id,
                  },
                }"
                :value="\`(\${row.source_order.visual_id})\`"
                :is-linkable="hasAccess2Detail"
                style="color: #640617"
              />
            </span>
          </div>
          <div v-else>
            {{ row?.type?.name }}
          </div>
        </template>
        <template #location="{ row }">
          <flex-row
            v-if="
              row?.location?.latitude !== 0 && row?.location?.longitude !== 0
            "
            class="w-full items-center justify-center"
            @click="locationData = row.location"
          >
            <rounded-icon-btn icon-file-name="Location" type="outlined" />
          </flex-row>
        </template>
        <template #created_by="{ row }">
          <div>
            {{ row?.created_by?.name }}
            <div class="italic">({{ row?.created_by?.role_name }})</div>
          </div>
        </template>
        <template #client_name="{ row }">
          <div class="flex items-center">
            <link-component
              :is-linkable="hasAccess2ClientDetail"
              :to="\`/clients/about-clients/\${row?.client?.id}\`"
              :value="row?.client?.name"
            />
          </div>
        </template>
        <template #comment="{ row }">
          <div v-if="hasAccessToUpdateComment(row?.type?.id)">
            <div v-if="row?.comment">
              <span :title="row.comment">
                {{ getShortenedComment(row.comment) }}
              </span>
              <div
                class="hover:underline w-fit cursor-pointer text-[#299B9B]"
                @click="onOpenCommentDialog(row?.comment, row?.type, row?.id)"
              >
                {{ t("orders.update") }}
              </div>
            </div>
            <div
              v-else
              class="hover:underline w-fit cursor-pointer text-[#299B9B]"
              @click="onOpenCommentDialog(row?.comment, row?.type, row?.id)"
            >
              {{ t("orders.add_comment") }}
            </div>
          </div>
          <div v-else>
            {{ row?.comment }}
          </div>
        </template>
        <template #count="{ row }">
          <div
            v-if="row?.type?.id === 3"
            class="group underline decoration-dashed hover:decoration-solid cursor-pointer hover-text-[#299B9B]"
            @mouseover="getExchangeCountDetail(row?.id, row?.type?.id)"
          >
            {{ getFormattedAmount(row.count) }}
            <div
              v-show="row?.type?.id === 3"
              class="max-w-[150px] shadow-lg invisible group-hover:visible absolute z-19"
            >
              <OrdersOrdersCountDetail
                :count-detail="getExchangeCountDetailById(row?.id)"
                :loading="isExchangeCountLoading"
              />
            </div>
          </div>
          <div v-else>
            {{ getFormattedAmount(row.count) }}
          </div>
        </template>
        <template #warehouse_name="{ row }">
          <div class="flex items-center gap-x-3">
            {{ row?.warehouse_name }}
            <div v-for="icon in row?.invoice_types" :key="icon">
              <div
                v-tooltip="{
                  text: getInvoiceType(icon),
                  placement: 'top',
                  nowrap: true,
                }"
              >
                <icon-document />
              </div>
            </div>
          </div>
        </template>
        <template #for_consignation="{ row }">
          <flex-row class="w-full items-center">
            {{ row?.for_consignation ? "Есть" : "Нет" }}
            <RoundedIconBtn
              type="edit"
              :iconSize="20"
              without-border
              :tooltip="t('labels.consignation_change')"
              @click="openConsignationUpdateDialog(row, 'for_consignation')"
            />
          </flex-row>
        </template>
        <template #consignation_term="{ row }">
          <div class="flex items-center justify-between">
            {{ getFormattedDate(row.consignation_term) }}
            <RoundedIconBtn
              v-if="
                hasAccess2ChangeConsignation &&
                row?.type?.id !== 2 &&
                row['for_consignation']
              "
              type="edit"
              :iconSize="20"
              without-border
              :tooltip="t('labels.consignation_change_term')"
              @click="openConsignationUpdateDialog(row, 'consignation_term')"
            />
          </div>
        </template>
      </OptimizedDataTable>
    </div>
    <transition name="modal">
      <div v-if="draggable">
        <drag-and-drop
          :templates="orderStore.templates"
          :save-key="orderColumn"
          @change="onChangeTableHeaders"
          @closeDialog="closeDraggableDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="settingAcceptedId">
        <SetDateTimeModal
          :name="
            expectedShippingdate
              ? t('orders.change_expected_shipping_date')
              : t('orders.confirmed_to_ship')
          "
          :is-loading="isSettingStatusLoading"
          :initial-date="expectedShippingdate"
          without-default-date
          :date-placeholder="t('orders.expected_shipping_date')"
          @closeDialog="closeSettingAcceptedDialog"
          @onSave="onSetAcceptedToShip"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="settingShippedId">
        <SetDateTimeModal
          :is-loading="isSettingStatusLoading"
          :name="t('orders.shipped')"
          expeditor-field
          comment-field
          @onSave="onSetShipped"
          @closeDialog="settingShippedId = null"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="settingDeliveredId">
        <SetDateTimeModal
          :is-loading="isSettingStatusLoading"
          :name="t('orders.delivered')"
          commentField
          without-default-date
          :initial-date="null"
          @onSave="onSetDelivered"
          @closeDialog="settingDeliveredId = null"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="settingToPendingReturnId">
        <OrdersOrdersReasonDialog
          type="return"
          :is-btn-loading="isSettingStatusLoading"
          @on-save="onSetToPendingReturn"
          @close-dialog="settingToPendingReturnId = null"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="settingReturnedId">
        <SetDateTimeModal
          comment-field
          :is-loading="isSettingStatusLoading"
          :name="t('orders.return')"
          @onSave="onSetReturned"
          @closeDialog="settingReturnedId = null"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="settingPartiallyReturnedId">
        <OrdersOrdersPartialReturnDialog
          :orderId="settingPartiallyReturnedId"
          @closeDialog="onClosePartialReturnDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="locationData">
        <lazy-clients-equipment-location
          :location="locationData"
          @closeDialog="locationData = ''"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isCommentDialogOpen">
        <OrdersOrdersCommentDialog
          :name="
            orderDetail?.initialComment
              ? 'Изменить коммент'
              : 'Добавить коммент'
          "
          :type="isCommentDialogOpen"
          :detail="orderDetail"
          :is-save-btn-loading="isSavingComment"
          @on-save="onSaveComment"
          @closeDialog="isCommentDialogOpen = false"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="settingCanceledId">
        <OrdersOrdersReasonDialog
          type="cancel"
          :is-btn-loading="isSettingStatusLoading"
          @on-save="onSetCanceled"
          @close-dialog="settingCanceledId = null"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="changingDeliveredDateData.id">
        <SetDateTimeModal
          :name="t('orders.change_delivered_date')"
          comment-field
          :is-loading="isSettingStatusLoading"
          :min-date="changingDeliveredDateData.minDate"
          :max-date="changingDeliveredDateData.maxDate"
          :initial-date="changingDeliveredDateData.initialDate"
          @onSave="onChangeDeliveredDate"
          @closeDialog="closeChangeDeliveredDateDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="changingReturnedDateData.id">
        <SetDateTimeModal
          :name="t('orders.change_return_date')"
          comment-field
          :is-loading="isSettingStatusLoading"
          :min-date="changingReturnedDateData.minDate"
          :max-date="changingReturnedDateData.maxDate"
          :initial-date="changingReturnedDateData.initialDate"
          @onSave="onChangeReturnedDate"
          @closeDialog="closeChangeReturnedDateDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isOrderGenerate">
        <OrdersOrdersGenerationOrder
          :name="t('labels.generating_order')"
          :is-save-btn-loading="orderStore.isGenerateOrderCreateLoading"
          @closeDialog="closeOrderGenerateDialog"
          @onSave="orderGenerate"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="orderItemForUpdateConsignationDialog">
        <OrdersOrdersUpdateConsignationDialog
          :item="orderItemForUpdateConsignationDialog"
          :is-consignation-term="isChangeForConsignationTerm"
          @closeDialog="closeConsignationUpdateDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { getFormattedDate } from "~/utils/formatters";
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";
import { notify } from "@kyvg/vue3-notification";
import { useOrdersAccess } from "~/composables/access/orders/orders";
import { useClientsAccess } from "~/composables/access/clients/clients";
import { useOrderStatusesAccess } from "../orders-statuses-access";
import { orderColumn } from "~/variable/column-constants";

// store
const orderStore = useOrdersStore("main");

// props
const props = defineProps({
  isFilterVisible: Boolean,
});

// state
const {
  hasAccess2Detail,
  hasAccess2UpdateRequest,
  hasAccess2UpdateRefund,
  hasAccess2UpdateExchange,
  hasAccess2ChangeConsignation,
} = useOrdersAccess();

const { getAvailableStatusesForTable } = useOrderStatusesAccess();

const { hasAccess2Detail: hasAccess2ClientDetail } = useClientsAccess();

const { t } = useI18n();
const router = useRouter();
const draggable = ref(false);
const exchangeCounts = reactive({});
const isExchangeCountLoading = ref(false);
const locationData = ref(false);
const isCommentDialogOpen = ref(false);
const orderDetail = ref({});
const isSavingComment = ref(false);
const isOrderGenerate = ref(false);
const isChangeForConsignationTerm = ref(false);
// status-states
const settingCanceledId = ref("");
const settingAcceptedId = ref("");
const settingShippedId = ref("");
const settingDeliveredId = ref("");
const expectedShippingdate = ref("");
const settingPartiallyReturnedId = ref("");
const settingReturnedId = ref("");
const isSettingStatusLoading = ref(false);
const availableStatusesForCurrentId = ref([]);
const settingToPendingReturnId = ref("");
const exchangeListForOrderDetailTabId = ref(1);

const exchangeListForOrderDetailTabs = ref([
  {
    id: 1,
    name: t("orders.exchange_return"),
  },
  {
    id: 2,
    name: t("orders.exchange_sending"),
  },
]);
const orderItemForUpdateConsignationDialog = ref(null);

const changingDeliveredDateData = ref({
  id: undefined,
  initialDate: undefined,
  minDate: undefined,
  maxDate: undefined,
});

const changingReturnedDateData = ref({
  id: undefined,
  initialDate: undefined,
  minDate: undefined,
  maxDate: undefined,
});

const showProduct = ref({
  isActive: false,
  order_id: null,
});

// hooks
const pageSizeOptions = computed(() => ({
  pageSize: orderStore.params.page_size,
  page: orderStore.data?.page_number,
  totalCount: orderStore.data?.total_count,
  totalPages: orderStore.data?.total_pages,
}));

// Methods
const onCheckItem = (ids) => {
  orderStore.orderIds = ids;
};

const getShortenedComment = (comment) => {
  let modifiedComment = comment;
  if (modifiedComment.includes(";")) {
    // to delete ';' if one of comment parts is nullable
    const commentParts = modifiedComment.split(";");
    if (!commentParts[0].trim() || !commentParts[1].trim()) {
      modifiedComment = modifiedComment
        .split("")
        .filter((letter) => letter !== ";")
        .join("");
    }
  }
  if (modifiedComment?.length > 18) return modifiedComment.slice(0, 18) + "...";
  return modifiedComment;
};

const onOpenCommentDialog = (initialComment, type, id) => {
  isCommentDialogOpen.value = true;
  orderDetail.value = {
    id,
    initialComment,
    typeId: type.id,
  };
};

const onSaveComment = async (commentData, id) => {
  isSavingComment.value = true;
  const data = {
    order_id: id,
    request_comment: commentData.orderComment,
    refund_comment: commentData.refundComment,
  };
  const res = await orderStore.onEditComment(data);
  if (res !== "error") {
    isCommentDialogOpen.value = false;
    notify({ title: t("saved"), type: "success" });
    await orderStore.refresh();
  } else {
    notify({ title: t("error"), type: "error" });
  }
  isSavingComment.value = false;
};

const onOpenStatusDropdown = (args, showPartialReturn) => {
  const { statusId, typeId } = args;
  availableStatusesForCurrentId.value = getAvailableStatuses(
    t,
    statusId,
    typeId,
    showPartialReturn,
  );
};

const openChangeDeliveredDateDialog = (orderId) => {
  const order = orderStore.data?.items.find((item) => item.id === orderId);
  changingDeliveredDateData.value = {
    id: orderId,
    initialDate: order?.delivered_date,
    minDate: order?.shipped_date,
    maxDate: Date.now(),
  };
};

const closeChangeDeliveredDateDialog = () => {
  changingDeliveredDateData.value = {};
};

const openChangeReturnedDateDialog = (orderId) => {
  const order = orderStore.data?.items.find((item) => item.id === orderId);
  changingReturnedDateData.value = {
    id: orderId,
    initialDate: order?.returned_date,
    minDate: order?.shipped_date,
    maxDate: Date.now(),
  };
};

const closeChangeReturnedDateDialog = () => {
  changingReturnedDateData.value = {};
};

const getExchangeCountDetailById = (id) => {
  return exchangeCounts[id];
};

const setExpectedShippingDate = (id) => {
  const order = orderStore.data?.items.find((item) => item.id === id);
  expectedShippingdate.value = order?.expected_shipping_date;
};

const closeSettingAcceptedDialog = () => {
  settingAcceptedId.value = null;
  expectedShippingdate.value = "";
};

const getExchangeCountDetail = async (id, typeId) => {
  if (typeId !== 3) return;
  const fetchedIds = Object.keys(exchangeCounts);
  if (fetchedIds.includes(id) || isExchangeCountLoading.value === id) return;
  isExchangeCountLoading.value = id;
  const data = await orderStore.getExchangeCountDetail(id);
  exchangeCounts[id] = data;
  isExchangeCountLoading.value = null;
};

const getAvailableStatuses = (t, statusId, typeId, showPartialReturn) => {
  return getAvailableStatusesForTable(t, statusId, typeId, showPartialReturn);
};

const onChangeStatusByStatusId = async (statusId, orderId) => {
  switch (statusId) {
    case 1:
      isSettingStatusLoading.value = orderId;
      await orderStore.setOrderRestore(orderId);
      await orderStore.refresh();
      isSettingStatusLoading.value = null;
      break;
    case 2:
      settingCanceledId.value = orderId;
      break;
    case 3:
    case 3.1:
      settingAcceptedId.value = orderId;
      setExpectedShippingDate(orderId);
      break;
    case 4:
      settingShippedId.value = orderId;
      break;
    case 5:
      settingDeliveredId.value = orderId;
      break;
    case 6:
      settingToPendingReturnId.value = orderId;
      break;
    case 7:
      settingReturnedId.value = orderId;
      break;
    case 8:
      settingPartiallyReturnedId.value = orderId;
      break;
    case 9:
      isSettingStatusLoading.value = orderId;
      await orderStore.setOrderCancelPendingReturn(orderId);
      await orderStore.refresh();
      isSettingStatusLoading.value = null;
      break;
    case "edit":
      navigateToEditOrder(orderId);
      break;
    case "refund-by-bonus":
      navigateToRefundByBonus(orderId);
      break;
    case "change-delivered-date":
      openChangeDeliveredDateDialog(orderId);
      break;
    case "change-return-date":
      openChangeReturnedDateDialog(orderId);
    default:
      break;
  }
};

const onSetCanceled = async ({ comment, reasonId }) => {
  isSettingStatusLoading.value = settingCanceledId.value;
  await orderStore.setOrderCancel({
    orderId: settingCanceledId.value,
    reasonId,
    comment,
  });
  await orderStore.refresh();
  settingCanceledId.value = null;
  isSettingStatusLoading.value = null;
};

const onSetAcceptedToShip = async (expectedShippingdate) => {
  isSettingStatusLoading.value = true;
  const id = settingAcceptedId.value;
  await orderStore.setOrderAccepted(id, expectedShippingdate);
  await orderStore.refresh();
  closeSettingAcceptedDialog();
  isSettingStatusLoading.value = false;
};

const onSetShipped = async (params) => {
  isSettingStatusLoading.value = true;
  const id = settingShippedId.value;
  await orderStore.setOrderShipped(id, params);
  await orderStore.refresh();
  settingShippedId.value = null;
  isSettingStatusLoading.value = false;
};

const onSetDelivered = async (params) => {
  isSettingStatusLoading.value = true;
  const id = settingDeliveredId.value;
  await orderStore.setOrderDelivered(id, params.date, params?.comment);
  await orderStore.refresh();
  settingDeliveredId.value = null;
  isSettingStatusLoading.value = false;
};

const onSetToPendingReturn = async ({ comment, reasonId }) => {
  isSettingStatusLoading.value = true;
  const id = settingToPendingReturnId.value;
  await orderStore.setOrderPendingReturn(id, reasonId, comment);
  await orderStore.refresh();
  settingToPendingReturnId.value = null;
  isSettingStatusLoading.value = false;
};

const onSetReturned = async (params) => {
  isSettingStatusLoading.value = true;
  const id = settingReturnedId.value;
  await orderStore.setOrderReturned(id, params.date, params?.comment);
  await orderStore.refresh();
  settingReturnedId.value = null;
  isSettingStatusLoading.value = false;
};

const onChangeDeliveredDate = async (params) => {
  isSettingStatusLoading.value = true;
  const id = changingDeliveredDateData.value.id;
  const res = await orderStore.changeDeliveredDate(id, params.date);
  if (res !== "error") {
    await orderStore.refresh();
    closeChangeDeliveredDateDialog();
  }
  isSettingStatusLoading.value = false;
};

const onChangeReturnedDate = async (params) => {
  isSettingStatusLoading.value = true;
  const id = changingReturnedDateData.value.id;
  const res = await orderStore.changeReturnedDate(id, params.date);
  if (res !== "error") {
    await orderStore.refresh();
    closeChangeReturnedDateDialog();
  }
  isSettingStatusLoading.value = false;
};

const navigateToEditOrder = (orderId) => {
  const order = orderStore.data?.items.find((item) => item.id === orderId);

  const typeId = order?.type?.id;

  const getPathByTypeId = (typeId) => {
    switch (typeId) {
      case 1:
      case 2:
        return order.source_order
          ? "/orders/create-orders/creating-orders-refund"
          : "/orders/create-orders/creating-orders";
      case 3:
        return "/orders/orders/exchange";
      default:
        return "/";
    }
  };

  router.push({
    path: getPathByTypeId(typeId),
    query: { id: orderId, type: typeId },
  });
};

const navigateToRefundByBonus = (orderId) => {
  const typeId = orderStore.data?.items.find((item) => item.id === orderId)
    ?.type?.id;

  router.push({
    path: "/orders/create-orders/creating-orders-refund",
    query: { "refundable-order": orderId, type: typeId },
  });
};

const closeDraggableDialog = () => {
  draggable.value = false;
};

const onChangeTableHeaders = (newValue) => {
  orderStore.templates = [...newValue];
};

const onClosePartialReturnDialog = async () => {
  settingPartiallyReturnedId.value = null;
};

const hasAccessToUpdateComment = (orderType) => {
  switch (orderType) {
    case 1:
      return hasAccess2UpdateRequest.value;
    case 2:
      return hasAccess2UpdateRefund.value;
    case 3:
      return hasAccess2UpdateExchange.value;
    default:
      return true;
  }
};

const getInvoiceType = (id) => {
  if (orderStore.invoiceTypesCache) {
    return orderStore.invoiceTypesCache.find((item) => item.id === id)?.name;
  }
};

const refresh = async () => {
  await orderStore.refresh();
};

const getOrderDetail = async (order_id, type_id) => {
  showProduct.value.isActive =
    order_id === showProduct.value.order_id
      ? !showProduct.value.isActive
      : true;
  showProduct.value.order_id = order_id;
  const order = orderStore.data?.items?.find((item) => item.id === order_id);
  const typeId = type_id === 3 ? 1 : null;
  if (!order) return;

  if (!order.details && !order.return && !order.refund) {
    order["detail_loading"] = true;
    if (typeId) {
      exchangeListForOrderDetailTabId.value = 1;
      order.return = await orderStore.getOrderDetailProductList(
        order_id,
        typeId,
      );
    } else {
      order.details = await orderStore.getOrderDetailProductList(
        order_id,
        typeId,
      );
    }
    order["detail_loading"] = false;
  }
};

const setExchangeType = async (order_id, type_id) => {
  const order = orderStore.data?.items?.find((item) => item.id === order_id);
  if (!order.return || !order.refund) {
    order["detail_loading"] = true;
    if (type_id === 1 && !order.return) {
      order.return = await orderStore.getOrderDetailProductList(
        order_id,
        type_id,
      );
    } else if (!order.refund) {
      order.refund = await orderStore.getOrderDetailProductList(
        order_id,
        type_id,
      );
    }
    order["detail_loading"] = false;
  }
  exchangeListForOrderDetailTabId.value = type_id;
};

const getOrderDetailProductList = (order_id, type_id) => {
  const order = orderStore.data?.items?.find((item) => item.id === order_id);
  if (type_id === 3) {
    return exchangeListForOrderDetailTabId.value === 1
      ? order.return
      : order.refund;
  } else {
    return order?.details;
  }
};

const openOrderGenerateDialog = () => {
  isOrderGenerate.value = true;
};

const closeOrderGenerateDialog = () => {
  isOrderGenerate.value = false;
};

const orderGenerate = async (orderGenerationData) => {
  notify({
    type: "warning",
    title: t("labels.started_creating_orders"),
    duration: -1,
  });
  closeOrderGenerateDialog();
  const response = await orderStore.fakerOrderCreate(orderGenerationData);
  if (response !== "error") {
    await refresh();
    notify({
      type: "success",
      title: t("labels.order_successfully_created"),
      duration: -1,
    });
  } else {
    notify({
      type: "error",
      title: t("labels.error_occurred_creating_orders"),
      duration: -1,
    });
  }
};

const openConsignationUpdateDialog = (item, key) => {
  orderItemForUpdateConsignationDialog.value = item;
  if (key === "consignation_term") {
    isChangeForConsignationTerm.value = true;
  }
};

const closeConsignationUpdateDialog = () => {
  isChangeForConsignationTerm.value = false;
  orderItemForUpdateConsignationDialog.value = null;
};
//  Hook
onMounted(async () => {
  await orderStore.getOrderInvoiceType();
});

const isShowOrderGenerate = computed(() => {
  return !window.location.hostname.includes(".com");
});
<\/script>

<style scoped lang="scss">
.order-detail-content {
  padding: 0 24px;
  width: calc(100vw - 200px);
  position: sticky;
  top: 0;
  left: 10px;
}

@media (max-width: 998px) {
  .order-detail-content {
    width: calc(100vw - 50px);
  }
}
</style>
`;export{e as default};
