const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="returnContainersColumn"
        :templates="refundTarasStore.templates"
        @onChangeTableHeaders="onChangeHeaders"
      />
      <ShowHideColumn
        :headers="refundTarasStore.templates"
        :save-key="returnContainersColumn"
      />
      <page-size-btn
        :current-size="refundTarasStore.params.page_size"
        :total-count="refundTarasStore.data?.total_count"
        :page-number="refundTarasStore.data?.page_number"
        @setPageSize="refundTarasStore.setPageSize"
      />
      <search-input @change="refundTarasStore.search" />
      <excel-btn />
      <RefreshBtn @click="refresh" :loading="refundTarasStore.isLoading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="refundTarasStore.templates"
        :check="isTableAllChecked"
        :indeterminate="isTableIndeterminate"
        :sorted="refundTarasStore.params.order_by"
        :loading="refundTarasStore.isLoading"
        :isEmpty="!refundTarasStore.data?.items.length"
        @getAllId="getAllOrdersId()"
        @sort="refundTarasStore.sortData"
      >
        <template #body>
          <c-tr v-for="data in refundTarasStore.data?.items" :key="data.id">
            <c-td-no-edit
              v-for="key in refundTarasStore.templates"
              :key="key"
              :is-checked="key.checked"
              :type="key.type"
            >
              <Checkbox
                v-if="key.type === 'checkbox'"
                :id="data.id"
                :checked="isTableChecked(data.id)"
                @change="onSelectOrder(data.id)"
              />
              <div v-else-if="key.type === 'date'">
                {{ getFormattedDate(data[key.key], "DD.MM.YYYY") }}
              </div>
              <div v-else-if="key.key === 'action'">
                <rounded-icon-btn
                  type="edit"
                  :iconSize="20"
                  @click="onOpenTaraDialog(data?.client_id, data?.id)"
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
        :current-size="refundTarasStore.params.page_size"
        :total-count="refundTarasStore.data?.total_count"
        :page-number="refundTarasStore.data?.page_number"
      />
      <page-index
        :available-pages="refundTarasStore.data?.total_pages"
        :current-page="refundTarasStore.data?.page_number"
        @setPage="refundTarasStore.setPage"
      />
    </div>
  </div>

  <div>
    <m-btn group="blue" @click="onChangeMultipleStatuses">
      {{ t("orders.change_status") }}
    </m-btn>
  </div>
  <flex-col v-show="isMultipleStatusBoxOpen" class="bg-white w-42 rounded-lg">
    <div class="flex items-center gap-2 p-2">
      <IconCheck class="w-10" color="green" />
      <div class="cursor-pointer" @click="onSetReceivedMultiStatus">
        {{ t("orders.received") }}
      </div>
    </div>
    <div class="flex items-center gap-2 p-2">
      <IconX class="w-10" />
      <div class="cursor-pointer" @click="onSetCanceledMultiStatus">
        {{ t("orders.canceled") }}
      </div>
    </div>
    <div class="flex items-center gap-2 p-2">
      <IconRe class="w-10" />
      <div class="cursor-pointer" @click="onSetRestoreMultiStatus">
        {{ t("users.restore") }}
      </div>
    </div>
  </flex-col>
  <transition name="modal">
    <div v-if="refundTaraDialogClientId">
      <d-modal @closeDialog="onCloseTaraDialog">
        <OrdersReturnContainersDialog
          :clientId="refundTaraDialogClientId"
          @closeDialog="onCloseTaraDialog"
          :orderId="orderId"
        />
      </d-modal>
    </div>
  </transition>
</template>

<script setup>
import { notify } from "@kyvg/vue3-notification";
import { returnContainersColumn } from "~/variable/column-constants";
import { useI18n } from "vue-i18n";

// store
const refundTarasStore = useOrderReturnContainersStore("main");

// State
const { t } = useI18n();
const refundTaraDialogClientId = ref("");
const orderId = ref("");
const isStatusDropDownOpen = ref("");
const isMultipleStatusBoxOpen = ref(false);

// hooks

const isTableAllChecked = computed(() => {
  if (!refundTarasStore.data?.items.length) return false;
  return refundTarasStore.data?.items.every((item) =>
    refundTarasStore.ordersIds.includes(item.id)
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !refundTarasStore.data?.items.length)
    return false;
  return refundTarasStore.data?.items.some((item) =>
    refundTarasStore.ordersIds.includes(item.id)
  );
});

// Methods
const refresh = () => {
  refundTarasStore.refresh();
};

const onSetCanceledStatus = async (_orderId) => {
  await refundTarasStore.setCanceledStatus(_orderId);
  await refundTarasStore.refresh();
  isStatusDropDownOpen.value = "";
};

const onSetCanceledMultiStatus = async (_orderId) => {
  await Promise.all(
    refundTarasStore.ordersIds.map(
      async (orderId) => await refundTarasStore.setCanceledStatus(orderId)
    )
  );
  await refundTarasStore.refresh();
  isMultipleStatusBoxOpen.value = false;
};

const onSetReceivedStatus = async (_orderId) => {
  await refundTarasStore.setRecievedStatus(_orderId);
  await refundTarasStore.refresh();
  isStatusDropDownOpen.value = "";
};

const onSetReceivedMultiStatus = async (_orderId) => {
  await Promise.all(
    refundTarasStore.ordersIds.map(
      async (orderId) => await refundTarasStore.setRecievedStatus(orderId)
    )
  );
  await refundTarasStore.refresh();
  isMultipleStatusBoxOpen.value = false;
};

const onSetRestoreOrder = async (_orderId) => {
  await refundTarasStore.onRestoreOrder(_orderId);
  await refundTarasStore.refresh();
  isStatusDropDownOpen.value = "";
};

const onSetRestoreMultiStatus = async (_orderId) => {
  await Promise.all(
    refundTarasStore.ordersIds.map(
      async (orderId) => await refundTarasStore.onRestoreOrder(orderId)
    )
  );
  await refundTarasStore.refresh();
  isMultipleStatusBoxOpen.value = false;
};

const onChangeMultipleStatuses = async () => {
  if (!refundTarasStore.ordersIds.length) {
    notify({ title: "Сначала выберите заказов!", type: "error" });
    isMultipleStatusBoxOpen.value = false;
    return;
  } else {
    isMultipleStatusBoxOpen.value = !isMultipleStatusBoxOpen.value;
  }
};

const getAllOrdersId = (checked) => {
  if (!checked) {
    refundTarasStore.setNullOrdersIds();
  } else {
    refundTarasStore.ordersIds = refundTarasStore.data?.items.map(
      (order) => order.id
    );
  }
};

const isTableChecked = (orderId) => {
  return refundTarasStore.ordersIds.find((id) => orderId === id);
};

const onSelectOrder = (orderId) => {
  if (!isTableChecked(orderId)) {
    refundTarasStore.ordersIds.push(orderId);
  } else {
    refundTarasStore.ordersIds = refundTarasStore.ordersIds.filter(
      (id) => id !== orderId
    );
  }
};

const onChangeHeaders = (newVal) => {
  refundTarasStore.templates = newVal;
};

const onOpenTaraDialog = (clientId, _orderId) => {
  refundTaraDialogClientId.value = clientId;
  orderId.value = _orderId;
};

const onCloseTaraDialog = () => {
  refundTaraDialogClientId.value = "";
  orderId.value = "";
};
<\/script>
`;export{e as default};
