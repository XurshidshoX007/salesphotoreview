const e=`<template>
  <div>
    <div class="table-content-container relative">
      <div class="table-content-header justify-between">
        <div class="table-content-btn-group">
          <table-sort-columns
            :templates="orderStore.templates"
            :save-key="orderColumn"
            @onChangeTableHeaders="onChangeTableHeaders"
          />
          <ShowHideColumn
            :headers="orderStore.templates"
            :disabled-headers="['visual_id']"
            :save-key="orderColumn"
          />
          <page-size-btn
            :current-size="orderStore.params.page_size"
            :total-count="orderStore.data?.total_count"
            :page-number="orderStore.data?.page_number"
            @setPageSize="orderStore.setPageSize"
          />
          <search-input
            :value="orderStore.params.search"
            @change="orderStore.search"
          />
          <excel-btn
            :loading="orderStore.isExcelFileDownloading"
            @click="orderStore.onDownloadExcelFile"
          />
          <RefreshBtn @click="refresh" :loading="orderStore.isLoading" />
        </div>
        <m-btn v-if="isShowOrderGenerate" @click="openOrderGenerateDialog"
          >{{ t("labels.generating_order") }}
        </m-btn>
      </div>
      <div class="table-content-body">
        <data-table
          :headers="orderStore.templates"
          :sorted="orderStore.params.order_by"
          :loading="orderStore.isLoading"
          :isEmpty="!orderStore.data?.items?.length"
          :check="isTableAllChecked"
          :indeterminate="isTableIndeterminate"
          @sort="orderStore.sortData"
          @getAllId="getAllItemIds"
        >
          <template #body>
            <template v-for="data in orderStore.data?.items" :key="data.id">
              <c-tr :is-checked="isItemChecked(data.id)">
                <c-td-no-edit
                  v-for="key in orderStore.templates"
                  :key="key.key"
                  :is-checked="key.checked"
                  :header-key="key.key"
                  :style="[
                    data?.type?.id === 3 && 'color: #E47200',
                    data?.type?.id === 2 && 'color: #640617',
                  ]"
                  :type="key.type"
                >
                  <div v-if="key.key === 'checkbox'">
                    <Checkbox
                      :id="data.id"
                      :checked="isItemChecked(data.id)"
                      @change="onCheckItem(data.id, $event)"
                    />
                  </div>
                  <div v-else-if="key.key === 'type' && data?.source_order?.id">
                    {{ t("orders.return_from_shelf_order") }}
                    <link-component
                      :to="{
                        path: '/orders/orders/details',
                        query: {
                          id: data.source_order?.id,
                          type: data?.type.id,
                        },
                      }"
                      :value="\`(\${data.source_order.visual_id})\`"
                      :is-linkable="hasAccess2Detail"
                      style="color: #640617"
                    />
                  </div>
                  <div
                    v-else-if="key.key === 'warehouse_name'"
                    class="flex items-center gap-x-3"
                  >
                    {{ data[key.key] }}
                    <div v-for="icon in data['invoice_types']" :key="icon">
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
                  <div v-else-if="key.key === 'location' && data[key.key]">
                    <rounded-icon-btn
                      icon-file-name="Location"
                      type="outlined"
                      @click="locationData = data[key.key]"
                    />
                  </div>
                  <div v-else-if="key.type === 'date'" class="text-nowrap">
                    {{ getFormattedDate(data[key.key]) }}
                  </div>
                  <div
                    v-else-if="key.key === 'consignation_term'"
                    class="flex items-center justify-between"
                  >
                    {{ getFormattedDate(data[key.key]) }}
                    <rounded-icon-btn
                      v-if="
                        hasAccess2ChangeConsignation &&
                        data?.type?.id !== 2 &&
                        data['for_consignation']
                      "
                      type="edit"
                      :iconSize="20"
                      :tooltip="t('labels.consignation_change_term')"
                      @click="openConsignationUpdateDialog(data, key.key)"
                    />
                  </div>
                  <div v-else-if="key.key === 'created_by'">
                    <div>
                      {{ data?.created_by?.name }}
                      <span class="italic">
                        ({{ data?.created_by?.role_name }})
                      </span>
                    </div>
                  </div>
                  <link-component
                    v-else-if="key.key === 'client'"
                    :to="\`/clients/about-clients/\${data[key.key].id}\`"
                    :value="data[key.key]?.name"
                    :is-linkable="hasAccess2ClientDetail"
                  />

                  <div v-else-if="key.key === 'comment'">
                    <div v-if="hasAccessToUpdateComment(data?.type?.id)">
                      <div v-if="data?.comment">
                        <span :title="data.comment">
                          {{ getShortenedComment(data.comment) }}
                        </span>
                        <div
                          class="hover:underline w-fit cursor-pointer text-[#299B9B]"
                          @click="
                            onOpenCommentDialog(
                              data?.comment,
                              data?.type.id,
                              data?.id,
                            )
                          "
                        >
                          {{ t("orders.update") }}
                        </div>
                      </div>
                      <div
                        v-else
                        class="hover:underline w-fit cursor-pointer text-[#299B9B]"
                        @click="
                          onOpenCommentDialog(
                            data?.comment,
                            data?.type.id,
                            data?.id,
                          )
                        "
                      >
                        {{ t("orders.add_comment") }}
                      </div>
                    </div>
                    <div v-else>
                      {{ data[key.key] }}
                    </div>
                  </div>

                  <div
                    v-else-if="
                      typeof data[key.key] === 'object' && key.key !== 'status'
                    "
                  >
                    {{ data[key.key]?.name }}
                  </div>

                  <div
                    v-else-if="
                      key.key === 'for_consignation' &&
                      hasAccess2ChangeConsignation &&
                      data?.type?.id !== 2
                    "
                    class="flex items-center justify-between"
                  >
                    {{ data[key.key] ? "Есть" : "Нет" }}
                    <rounded-icon-btn
                      type="edit"
                      :iconSize="20"
                      size="xsm"
                      without-border
                      :tooltip="t('labels.consignation_change')"
                      @click="openConsignationUpdateDialog(data, key.key)"
                    />
                  </div>

                  <div v-else-if="key.type === 'boolean'">
                    {{ data[key.key] ? "Есть" : "Нет" }}
                  </div>
                  <div v-else-if="key.key === 'visual_id'">
                    <flex-row class="items-center justify-center gap-2">
                      <div v-tooltip="data?.client_platform?.name">
                        <component
                          :is="getClientPlatformIcon(data?.client_platform?.id)"
                          class="text-primary-600"
                        />
                      </div>

                      <div class="flex gap-x-2 items-center">
                        <link-component
                          :to="{
                            path:
                              data?.type?.id === 3
                                ? '/orders/orders/exchange'
                                : '/orders/orders/details',
                            query: { id: data?.id, type: data?.type.id },
                          }"
                          :value="data[key.key]"
                          :is-linkable="hasAccess2Detail"
                        />
                        <div
                          class="p-2 cursor-pointer"
                          @click="toggleRowDetail(data?.id)"
                        >
                          <IconArrowBottom
                            class="cursor-pointer"
                            :class="[
                              (expandedItemId === data?.id &&
                                'rotate-180 transition-all') ||
                                'rotate-0 transition-all',
                            ]"
                          />
                        </div>
                      </div>
                    </flex-row>
                  </div>

                  <div v-else-if="key.type === 'number'">
                    <div
                      v-if="key.key === 'count' && data?.type?.id === 3"
                      class="group underline decoration-dashed hover:decoration-solid cursor-pointer hover-text-[#299B9B]"
                      @mouseover="
                        getExchangeCountDetail(data?.id, data?.type?.id)
                      "
                    >
                      {{ getFormattedAmount(data[key.key]) }}
                      <div
                        v-show="data?.type?.id === 3"
                        class="max-w-fit shadow-lg invisible group-hover:visible absolute z-19"
                      >
                        <OrdersOrdersCountDetail
                          :count-detail="getExchangeCountDetailById(data?.id)"
                          :loading="!!isExchangeCountLoading"
                        />
                      </div>
                    </div>
                    <div v-else>
                      {{ getFormattedAmount(data[key.key]) }}
                    </div>
                  </div>

                  <div v-else-if="key.key === 'status'" class="relative">
                    <StatusBtnForTable
                      :status-data="data?.status"
                      :data-id="data.id"
                      :type-id="data?.type?.id"
                      :is-setting-status-loading="isSettingStatusLoading"
                      :available-statuses-by-id="availableStatusesForCurrentId"
                      :has-partial-return="data?.has_partial_return"
                      :is-partial-return-approved="
                        data?.is_partially_return_approved
                      "
                      :source-id="!!data?.source_order"
                      @onOpenStatusDropdown="
                        onOpenStatusDropdown($event, data?.show_partial_return)
                      "
                      @onChangeStatusById="onChangeStatusByStatusId"
                    />
                  </div>

                  <div v-else-if="key.key === 'client_visual_id'">
                    <link-component :value="data?.client_visual_id" />
                  </div>

                  <div v-else-if="key.isDynamic && key.dynamicConfig">
                    {{ getDynamicValue(data, key.dynamicConfig) }}
                  </div>

                  <div v-else>
                    {{ data[key.key] }}
                  </div>
                </c-td-no-edit>
              </c-tr>
              <template v-if="expandedItemId === data?.id">
                <OrdersOrdersTableRowDetail
                  :details-map="detailsMap"
                  :typeId="data?.type?.id"
                  :id="data?.id"
                  :templatesLength="orderStore.templates.length"
                  :get-detail="getDetail"
                />
              </template>
            </template>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="orderStore.params.page_size"
          :total-count="orderStore.data?.total_count"
          :page-number="orderStore.data?.page_number"
        />
        <page-index
          :available-pages="orderStore.data?.total_pages"
          :current-page="orderStore.data?.page_number"
          @setPage="orderStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="settingAcceptedId">
        <SetDateTimeModal
          :name="
            expectedShippingdate
              ? t('orders.change_expected_shipping_date')
              : t('orders.confirmed_to_ship')
          "
          :is-loading="!!isSettingStatusLoading"
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
          :is-loading="!!isSettingStatusLoading"
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
          :is-loading="!!isSettingStatusLoading"
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
          :is-btn-loading="!!isSettingStatusLoading"
          @on-save="onSetToPendingReturn"
          @close-dialog="settingToPendingReturnId = null"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="settingReturnedId">
        <SetDateTimeModal
          comment-field
          :is-loading="!!isSettingStatusLoading"
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
          @closeDialog="locationData = null"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="orderDetail">
        <OrdersOrdersCommentDialog
          :name="
            orderDetail.initialComment ? 'Изменить коммент' : 'Добавить коммент'
          "
          :detail="orderDetail"
          :is-save-btn-loading="isSavingComment"
          @on-save="onSaveComment"
          @closeDialog="orderDetail = null"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="settingCanceledId">
        <OrdersOrdersReasonDialog
          type="cancel"
          :is-btn-loading="!!isSettingStatusLoading"
          @on-save="onSetCanceled"
          @close-dialog="settingCanceledId = null"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="changingDeliveredDateData">
        <SetDateTimeModal
          :name="t('orders.change_delivered_date')"
          comment-field
          :is-loading="!!isSettingStatusLoading"
          :min-date="changingDeliveredDateData.minDate"
          :max-date="changingDeliveredDateData.maxDate"
          :initial-date="changingDeliveredDateData.initialDate"
          @onSave="onChangeDeliveredDate"
          @closeDialog="closeChangeDeliveredDateDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="changingReturnedDateData">
        <SetDateTimeModal
          :name="t('orders.change_return_date')"
          comment-field
          :is-loading="!!isSettingStatusLoading"
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
      <div v-if="updateConsignationDialogData">
        <OrdersOrdersUpdateConsignationDialog
          type="single"
          :data="updateConsignationDialogData"
          :refresh-data="orderStore.refresh"
          @closeDialog="closeConsignationUpdateDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { notify } from "@kyvg/vue3-notification";
import { useOrdersAccess } from "~/composables/access/orders/orders";
import { useClientsAccess } from "~/composables/access/clients/clients";
import { useOrderStatusesAccess } from "../orders-statuses-access";
import { orderColumn } from "~/variable/column-constants";
import type { Template } from "~/interfaces/ui/template";
import type { OrdersModel } from "~/interfaces/api/orders/orders-model";
import type { LocationModel } from "~/interfaces/api/clients/client-location-model";
import type { StatusType } from "~/interfaces/ui/order-status-model";
import type { ExchangeCountDetailModel } from "~/interfaces/api/orders/exchange-count-detail-model";
import type { ProductCategoriesModel } from "~/interfaces/api/orders/order-detail-model";
import {
  getDynamicValue,
  getFormattedDate,
  getFormattedAmount,
  type BasicEntity,
} from "#imports";
import { ClientPlatformType } from "~/variable/static-constants";
import { IconDeviceMobile, IconEarthGlobe } from "#components";

// types
type ChanginDateType = {
  id: string;
  initialDate?: string;
  minDate?: string;
  maxDate?: string;
};

// store
const orderStore = useOrdersStore("main");

// states
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
const exchangeCounts = reactive<Record<string, ExchangeCountDetailModel>>({});
const isExchangeCountLoading = ref<string | null>(null);
const locationData = ref<LocationModel | null>(null);
const orderDetail = ref<{
  id: string;
  typeId: number;
  initialComment: string;
} | null>();
const isSavingComment = ref<boolean>(false);
const isOrderGenerate = ref<boolean>(false);
const expandedItemId = ref<string | null>(null);

// status-states
const settingCanceledId = ref<string | null>("");
const settingAcceptedId = ref<string | null>("");
const settingShippedId = ref<string | null>("");
const settingDeliveredId = ref<string | null>("");
const expectedShippingdate = ref<string | null>("");
const settingPartiallyReturnedId = ref<string | null>("");
const settingReturnedId = ref<string | null>("");
const isSettingStatusLoading = ref<boolean | string>(false);
const availableStatusesForCurrentId = ref<Array<StatusType>>([]);
const settingToPendingReturnId = ref<string | null>("");
const changingDeliveredDateData = ref<ChanginDateType | null>(null);
const changingReturnedDateData = ref<ChanginDateType | null>(null);

const updateConsignationDialogData = ref<
  | (Pick<
      OrdersModel,
      | "id"
      | "visual_id"
      | "consignation_term"
      | "order_date"
      | "for_consignation"
    > & { isTermOnly: boolean })
  | null
>(null);

const detailsMap = ref(
  new Map<
    string,
    {
      loading: boolean;
      data: Record<"request" | "return", ProductCategoriesModel[]>;
    }
  >(),
);

// hooks
const isTableAllChecked = computed(() => {
  if (!orderStore.data?.items.length) return false;
  return orderStore.data?.items.every((item) =>
    orderStore.orderIds.includes(item.id),
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !orderStore.data?.items.length) return false;
  return orderStore.data?.items.some((item) =>
    orderStore.orderIds.includes(item.id),
  );
});

const isShowOrderGenerate = computed(() => {
  return !window.location.hostname.includes(".com");
});

onMounted(async () => {
  await orderStore.getOrderInvoiceType();
});

// Methods
const getClientPlatformIcon = (platformId: ClientPlatformType) => {
  if (platformId === ClientPlatformType.WebSite) {
    return IconEarthGlobe;
  } else if (platformId === ClientPlatformType.MobileApp) {
    return IconDeviceMobile;
  }
};

const getAllItemIds = (checked: boolean) => {
  if (!checked) {
    orderStore.setNullOrderIds();
  } else {
    orderStore.orderIds = orderStore.data?.items.map(
      (order) => order.id,
    ) as string[];
  }
};

const isItemChecked = (orderId: string) => {
  return !!orderStore.orderIds.find((id) => orderId === id);
};

const onCheckItem = (orderId: string, isChecked: boolean) => {
  if (isChecked) {
    orderStore.orderIds.push(orderId);
  } else {
    orderStore.orderIds = orderStore.orderIds.filter((id) => id !== orderId);
  }
};

const getShortenedComment = (comment: string) => {
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

const onOpenCommentDialog = (
  initialComment: string,
  typeId: number,
  id: string,
) => {
  orderDetail.value = {
    id,
    initialComment,
    typeId,
  };
};

const onSaveComment = async (
  commentData: Record<"orderComment" | "refundComment", string | null>,
  id: string,
) => {
  isSavingComment.value = true;
  const data = {
    order_id: id,
    request_comment: commentData.orderComment as string,
    refund_comment: commentData.refundComment as string,
  };
  const res = await orderStore.onEditComment(data);
  if (res !== "error") {
    orderDetail.value = null;
    notify({ title: t("saved"), type: "success" });
    await orderStore.refresh();
  } else {
    notify({ title: t("error"), type: "error" });
  }
  isSavingComment.value = false;
};

const onOpenStatusDropdown = (
  args: {
    statusId: number | string;
    typeId: number;
  },
  showPartialReturn: boolean | undefined,
) => {
  const { statusId, typeId } = args;
  availableStatusesForCurrentId.value = getAvailableStatuses(
    t,
    statusId,
    typeId,
    showPartialReturn as boolean,
  );
};

const openChangeDeliveredDateDialog = (orderId: string) => {
  const order = orderStore.data?.items.find((item) => item.id === orderId);
  changingDeliveredDateData.value = {
    id: orderId,
    initialDate: order?.delivered_date,
    minDate: order?.shipped_date,
    maxDate: Date.now().toString(),
  };
};

const closeChangeDeliveredDateDialog = () => {
  changingDeliveredDateData.value = null;
};

const openChangeReturnedDateDialog = (orderId: string) => {
  const order = orderStore.data?.items.find((item) => item.id === orderId);
  changingReturnedDateData.value = {
    id: orderId,
    initialDate: order?.returned_date,
    minDate: order?.shipped_date,
    maxDate: Date.now().toString(),
  };
};

const closeChangeReturnedDateDialog = () => {
  changingReturnedDateData.value = null;
};

const getExchangeCountDetailById = (id: string) => {
  return exchangeCounts[id];
};

const setExpectedShippingDate = (id: string) => {
  const order = orderStore.data?.items.find((item) => item.id === id);
  expectedShippingdate.value = order?.expected_shipping_date || null;
};

const closeSettingAcceptedDialog = () => {
  settingAcceptedId.value = null;
  expectedShippingdate.value = null;
};

const getExchangeCountDetail = async (id: string, typeId: number) => {
  if (typeId !== 3) return;
  const fetchedIds = Object.keys(exchangeCounts);
  if (fetchedIds.includes(id) || isExchangeCountLoading.value === id) return;
  isExchangeCountLoading.value = id;
  const data = await orderStore.getExchangeCountDetail(id);
  exchangeCounts[id] = data as ExchangeCountDetailModel;
  isExchangeCountLoading.value = null;
};

const getAvailableStatuses = (
  t: (str: string) => string,
  statusId: string | number,
  typeId: number,
  showPartialReturn: boolean,
) => {
  return getAvailableStatusesForTable(t, statusId, typeId, showPartialReturn);
};

const onChangeStatusByStatusId = async (
  statusId: number | string,
  orderId: string,
) => {
  switch (statusId) {
    case 1:
    case 1.1:
      isSettingStatusLoading.value = orderId;
      await orderStore.setOrderRestore(orderId);
      await orderStore.refresh();
      isSettingStatusLoading.value = false;
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
      isSettingStatusLoading.value = false;
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

const onSetCanceled = async ({
  comment,
  reasonId,
}: {
  comment: string;
  reasonId: string;
}) => {
  isSettingStatusLoading.value = true;
  await orderStore.setOrderCancel({
    orderId: settingCanceledId.value as string,
    reasonId,
    comment,
  });
  await orderStore.refresh();
  settingCanceledId.value = null;
  isSettingStatusLoading.value = false;
};

const onSetAcceptedToShip = async (expectedShippingdate: string) => {
  isSettingStatusLoading.value = true;
  const id = settingAcceptedId.value as string;
  await orderStore.setOrderAccepted(id, expectedShippingdate);
  await orderStore.refresh();
  closeSettingAcceptedDialog();
  isSettingStatusLoading.value = false;
};

const onSetShipped = async (params: {
  date: string;
  comment: string | null;
  expeditorId: string | null;
}) => {
  isSettingStatusLoading.value = true;
  const id = settingShippedId.value as string;
  await orderStore.setOrderShipped(id, params);
  await orderStore.refresh();
  settingShippedId.value = null;
  isSettingStatusLoading.value = false;
};

const onSetDelivered = async (params: {
  date: string;
  comment?: string;
  expeditorId: string | null;
}) => {
  isSettingStatusLoading.value = true;
  const id = settingDeliveredId.value as string;
  await orderStore.setOrderDelivered(id, params.date, params?.comment);
  await orderStore.refresh();
  settingDeliveredId.value = null;
  isSettingStatusLoading.value = false;
};

const onSetToPendingReturn = async ({
  comment,
  reasonId,
}: {
  comment: string;
  reasonId: string;
}) => {
  isSettingStatusLoading.value = true;
  const id = settingToPendingReturnId.value as string;
  await orderStore.setOrderPendingReturn(id, reasonId, comment);
  await orderStore.refresh();
  settingToPendingReturnId.value = null;
  isSettingStatusLoading.value = false;
};

const onSetReturned = async (params: {
  date: string;
  comment: string | undefined;
  expeditorId: string | null;
}) => {
  isSettingStatusLoading.value = true;
  const id = settingReturnedId.value as string;
  await orderStore.setOrderReturned(id, params.date, params?.comment);
  await orderStore.refresh();
  settingReturnedId.value = null;
  isSettingStatusLoading.value = false;
};

const onChangeDeliveredDate = async (params: {
  date: string;
  comment: string | null;
  expeditorId: string | null;
}) => {
  isSettingStatusLoading.value = true;
  const id = changingDeliveredDateData.value!.id;
  const res = await orderStore.changeDeliveredDate(id, params.date);
  if (res !== "error") {
    await orderStore.refresh();
    closeChangeDeliveredDateDialog();
  }
  isSettingStatusLoading.value = false;
};

const onChangeReturnedDate = async (params: {
  date: string;
  comment: string | null;
  expeditorId: string | null;
}) => {
  isSettingStatusLoading.value = true;
  const id = changingReturnedDateData.value!.id;
  const res = await orderStore.changeReturnedDate(id, params.date);
  if (res !== "error") {
    await orderStore.refresh();
    closeChangeReturnedDateDialog();
  }
  isSettingStatusLoading.value = false;
};

const navigateToEditOrder = (orderId: string) => {
  const order = orderStore.data?.items.find((item) => item.id === orderId);

  const typeId = order?.type?.id as number;

  const getPathByTypeId = (typeId: number) => {
    switch (typeId) {
      case 1:
      case 2:
        return order && order.source_order
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

const navigateToRefundByBonus = (orderId: string) => {
  const typeId = orderStore.data?.items.find((item) => item.id === orderId)
    ?.type?.id;

  router.push({
    path: "/orders/create-orders/creating-orders-refund",
    query: { "refundable-order": orderId, type: typeId },
  });
};

const onChangeTableHeaders = (newValue: Template[]) => {
  orderStore.templates = newValue;
};

const onClosePartialReturnDialog = () => {
  settingPartiallyReturnedId.value = null;
};

const hasAccessToUpdateComment = (orderType: number) => {
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

const getInvoiceType = (id: number) => {
  if (orderStore.invoiceTypesCache) {
    return orderStore.invoiceTypesCache.find((item) => item.id === id)?.name;
  }
};

const toggleRowDetail = (id: string) => {
  expandedItemId.value = expandedItemId.value === id ? null : id;
};

const openOrderGenerateDialog = () => {
  isOrderGenerate.value = true;
};

const closeOrderGenerateDialog = () => {
  isOrderGenerate.value = false;
};

const refresh = async () => {
  await orderStore.refresh();
};

const getDetail = async (
  id: string,
  typeId?: number,
): Promise<ProductCategoriesModel[] | undefined> => {
  const data = await orderStore.getOrderDetailProductList(id, typeId);
  return data;
};

const orderGenerate = async (orderGenerationData: {
  orderCount: number;
  orderDate: string | null;
}) => {
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

const openConsignationUpdateDialog = (item: OrdersModel, key: string) => {
  const { consignation_term, for_consignation, id, visual_id, order_date } =
    item;

  updateConsignationDialogData.value = {
    id,
    visual_id,
    consignation_term,
    order_date,
    for_consignation,
    isTermOnly: key === "consignation_term",
  };
};

const closeConsignationUpdateDialog = () => {
  updateConsignationDialogData.value = null;
};
<\/script>
`;export{e as default};
