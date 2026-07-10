const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :templates="vanSellingOrdersStore.headers"
          :save-key="orderVanSellingColumn"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="vanSellingOrdersStore.headers"
          :save-key="orderVanSellingColumn"
        />
        <page-size-btn
          :current-size="vanSellingOrdersStore.params.page_size"
          :total-count="vanSellingOrdersStore.data?.total_count"
          :page-number="vanSellingOrdersStore.data?.page_number"
          @setPageSize="vanSellingOrdersStore.setPageSize"
        />
        <search-input
          :value="vanSellingOrdersStore.params.search"
          @change="vanSellingOrdersStore.search"
        />
        <excel-btn
          @click="vanSellingOrdersStore.onDownloadExcelFile"
          :loading="vanSellingOrdersStore.isExcelFileDownloading"
        />
        <RefreshBtn
          @click="refresh"
          :loading="vanSellingOrdersStore.isLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="vanSellingOrdersStore.headers"
          :loading="vanSellingOrdersStore.isLoading"
          :isEmpty="!vanSellingOrdersStore.data?.items.length"
          :check="isTableAllChecked"
          :indeterminate="isTableIndeterminate"
          :sorted="vanSellingOrdersStore.params.order_by"
          @sort="vanSellingOrdersStore.sortData"
          @getAllId="getAllOrdersId"
        >
          <template #body>
            <template
              v-for="data in vanSellingOrdersStore.data?.items"
              :key="data.id"
            >
              <c-tr class="cursor-pointer">
                <c-td-no-edit
                  v-for="key in vanSellingOrdersStore.headers"
                  :key="key.key"
                  :is-checked="key.checked"
                  :type="key.type"
                >
                  <div v-if="key.key === 'checkbox'">
                    <Checkbox
                      :id="data.id"
                      :checked="isTableChecked(data.id)"
                      @change="onSelectOrder(data.id)"
                    />
                  </div>

                  <div v-if="key.key === 'status'">
                    <StatusBtnForTable
                      :status-data="data[key.key]"
                      :data-id="data.id"
                      :type-id="data?.type?.id"
                      :available-statuses-by-id="availableStatusesForCurrentId"
                      @onOpenStatusDropdown="onOpenStatusDropdown"
                      :is-setting-status-loading="isSettingStatusLoading"
                      type="van-selling"
                      @onChangeStatusById="onChangeStatusById"
                    />
                  </div>
                  <div v-else-if="typeof data[key.key] === 'object'">
                    {{ data[key.key]?.name }}
                  </div>
                  <div v-else-if="key.type === 'number'">
                    {{ getFormattedAmount(data[key.key]) }}
                  </div>
                  <div v-else-if="key.type === 'date'">
                    {{ getFormattedDate(data[key.key]) }}
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
          :current-size="vanSellingOrdersStore.params.page_size"
          :total-count="vanSellingOrdersStore.data?.total_count"
          :page-number="vanSellingOrdersStore.data?.page_number"
        />
        <page-index
          :available-pages="vanSellingOrdersStore.data?.total_pages"
          :current-page="vanSellingOrdersStore.data?.page_number"
          @setPage="vanSellingOrdersStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="isSettingAccepted">
        <SetDateTimeModal
          :modal-name="t('orders.expected_shipping_date')"
          :is-loading="isSettingStatusLoading"
          @onSave="onSetAcceptedToShip"
          @closeDialog="isSettingAccepted = null"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isSettingShipped">
        <SetDateTimeModal
          :modal-name="t('orders.shipped')"
          :is-loading="isSettingStatusLoading"
          @closeDialog="isSettingShipped = null"
          @onSave="onSetShipped"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isSettingDelivered">
        <SetDateTimeModal
          :modal-name="t('orders.delivered')"
          :is-loading="isSettingStatusLoading"
          @closeDialog="isSettingDelivered = null"
          @onSave="onSetDelivered"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isSettingConfirmed">
        <SetDateTimeModal
          :name="t('orders.received_warehouse')"
          :is-loading="isSettingStatusLoading"
          @closeDialog="isSettingConfirmed = null"
          @onSave="onSetConfirmed"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { getFormattedAmount } from "~/utils/filter";
import { getFormattedDate } from "~/utils/formatters";
import { useI18n } from "vue-i18n";
import { orderVanSellingColumn } from "~/variable/column-constants";

// store
const vanSellingOrdersStore = useVanSellingOrdersStore("main");

// emits
const emit = defineEmits(["onOpenEditModal"]);

// states
const { t } = useI18n();
const route = useRoute();
const isSettingShipped = ref("");
const isSettingDelivered = ref("");
const isSettingAccepted = ref("");
const isSettingConfirmed = ref("");
const availableStatusesForCurrentId = ref([]);
const isSettingStatusLoading = ref(false);

// hooks

const isTableAllChecked = computed(() => {
  if (!vanSellingOrdersStore.data?.items.length) return false;
  return vanSellingOrdersStore.data?.items.every((item) =>
    vanSellingOrdersStore.ordersIds.includes(item.id),
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !vanSellingOrdersStore.data?.items.length)
    return false;
  return vanSellingOrdersStore.data?.items.some((item) =>
    vanSellingOrdersStore.ordersIds.includes(item.id),
  );
});

watch(
  () => route.query.order_type,
  () => {
    isTableAllChecked.value = false;
    vanSellingOrdersStore.setNullOrdersIds();
  },
);

// methods

const onChangeTableHeaders = (param) => {
  vanSellingOrdersStore.headers = param;
};

const getAllOrdersId = (checked) => {
  if (!checked) {
    vanSellingOrdersStore.setNullOrdersIds();
  } else {
    vanSellingOrdersStore.ordersIds = vanSellingOrdersStore.data?.items.map(
      (order) => order.id,
    );
  }
};

const isTableChecked = (orderId) => {
  return !!vanSellingOrdersStore.ordersIds.find((id) => orderId === id);
};

const onSelectOrder = (orderId) => {
  if (!isTableChecked(orderId)) {
    vanSellingOrdersStore.ordersIds.push(orderId);
  } else {
    vanSellingOrdersStore.ordersIds = vanSellingOrdersStore.ordersIds.filter(
      (id) => id !== orderId,
    );
  }
};

const onOpenStatusDropdown = (args) => {
  const { statusId, typeId } = args;
  availableStatusesForCurrentId.value = getAvailableStatuses(statusId, typeId);
};

const getAvailableStatuses = (statusId, typeId) => {
  if (route.query.order_type === "1") {
    switch (statusId) {
      case 1: // Available statuses in 'Новый'
        return [
          {
            id: 2,
            name: t("orders.canceled"),
          },
          {
            id: 3,
            name: t("orders.expected_shipping_date"),
          },
          {
            id: "edit-modal",
            name: t("edit"),
          },
        ];
      case 2: // Available statuses in 'Отменен'
      case 5: // and 'Доставлен'
        return [
          {
            name: t("orders.new"),
            id: 1,
          },
        ];
      case 3: // Available statuses in 'Подтвержден к отгрузке'
        return [
          {
            id: 3,
            name: t("column.shipped_date"),
          },
          {
            id: 4,
            name: t("orders.shipped"),
          },
        ];
      case 4: // Available statuses in 'Отгружен'
        return [
          {
            id: 5,
            name: t("orders.delivered"),
          },
        ];
      default:
        return [];
    }
  } else if (route.query.order_type === "2") {
    switch (statusId) {
      case 1:
        return [
          {
            id: 6,
            name: t("orders.received_warehouse"),
          },
          {
            id: 2,
            name: t("orders.canceled"),
          },
        ];
      case 2:
      case 6:
        return [
          {
            id: 1,
            name: t("orders.new"),
          },
        ];
      default:
        break;
    }
  } else return [];
};

const onChangeStatusById = async (statusId, orderId) => {
  switch (statusId) {
    case 1:
      isSettingStatusLoading.value = orderId;
      await vanSellingOrdersStore.setRestore(orderId);
      await vanSellingOrdersStore.refresh();
      isSettingStatusLoading.value = null;
      break;
    case 2:
      isSettingStatusLoading.value = orderId;
      await vanSellingOrdersStore.setCancel(orderId);
      await vanSellingOrdersStore.refresh();
      isSettingStatusLoading.value = null;
      break;
    case 3:
      isSettingAccepted.value = orderId;
      break;
    case 4:
      isSettingShipped.value = orderId;
      break;
    case 5:
      isSettingDelivered.value = orderId;
      break;
    case 6:
      isSettingConfirmed.value = orderId;
      break;
    case "edit-modal":
      emit("onOpenEditModal");
      vanSellingOrdersStore.editingOrderId = orderId;
      break;
    default:
      break;
  }
};

const onSetAcceptedToShip = async (expectedShippingdate) => {
  isSettingStatusLoading.value = true;
  const id = isSettingAccepted.value;
  await vanSellingOrdersStore.setAcceptToShip(id, expectedShippingdate);
  await vanSellingOrdersStore.refresh();
  isSettingAccepted.value = null;
  isSettingStatusLoading.value = false;
};

const onSetShipped = async (shippedDate) => {
  isSettingStatusLoading.value = true;
  const id = isSettingShipped.value;
  await vanSellingOrdersStore.setShipped(id, shippedDate);
  await vanSellingOrdersStore.refresh();
  isSettingShipped.value = null;
  isSettingStatusLoading.value = false;
};

const onSetDelivered = async (deliveredDate) => {
  isSettingStatusLoading.value = true;
  const id = isSettingDelivered.value;
  await vanSellingOrdersStore.setDelivered(id, deliveredDate);
  await vanSellingOrdersStore.refresh();
  isSettingDelivered.value = null;
  isSettingStatusLoading.value = false;
};

const onSetConfirmed = async (receivedDate) => {
  isSettingStatusLoading.value = true;
  const id = isSettingConfirmed.value;
  await vanSellingOrdersStore.setConfirmed(id, receivedDate);
  await vanSellingOrdersStore.refresh();
  isSettingConfirmed.value = null;
  isSettingStatusLoading.value = false;
};

const refresh = () => {
  vanSellingOrdersStore.refresh();
};
<\/script>
`;export{e as default};
