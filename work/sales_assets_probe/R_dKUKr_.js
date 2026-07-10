const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header justify-between">
      <div class="table-content-btn-group">
        <table-sort-columns
          :templates="headers"
          :save-key="headersSaveKey"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn :headers="headers" :save-key="headersSaveKey" />
        <page-size-btn
          :current-size="params.page_size"
          :total-count="data?.total_count"
          :page-number="data?.page_number"
          @setPageSize="setPageSize"
        />
        <search-input @change="search" />
        <RefreshBtn @click="refresh" :loading="isLoading" />
      </div>
      <InvoicesGeneralConfDropdown
        v-if="hasAccess2Excel217 || hasAccess2Excel520"
        v-show="!isReturnType"
        :invoice-ids="checkedItemIds"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="headers"
        :loading="isLoading"
        :is-empty="!data?.items?.length"
        :sorted="params.order_by"
        :check="isTableAllChecked"
        :indeterminate="isTableIndeterminate"
        @sort="sortData"
        @getAllId="getAllItemIds"
      >
        <template #body>
          <template v-for="data in data?.items" :key="data.id">
            <c-tr>
              <c-td-no-edit
                v-for="key in headers"
                :key="key.key"
                :type="key.type"
                :is-checked="key.checked"
              >
                <div v-if="key.key === 'checkbox'">
                  <Checkbox
                    :id="data.id"
                    :checked="isItemChecked(data.id)"
                    @change="onCheckItem(data.id, $event)"
                  />
                </div>
                <div v-else-if="key.type === 'date'">
                  {{ getFormattedDate(data[key.key], "DD.MM.YYYY HH:mm") }}
                </div>
                <div v-else-if="key.key === 'status'">
                  <status-btn-for-table
                    :status-data="data[key.key]"
                    :data-id="data.id"
                    :is-setting-status-loading="isSettingStatusLoading"
                    :available-statuses-by-id="
                      getAvailableStatusesById(data.status.id, data.id)
                    "
                    @on-change-status-by-id="onChangeStatusById"
                  />
                </div>
                <div v-else-if="key.type === 'boolean'">
                  {{ data[key.key] ? t("filters.yes") : t("filters.no") }}
                </div>
                <LinkComponent
                  v-else-if="key.key === 'visual_id'"
                  :value="data[key.key]"
                  @click="openDetailDialog(data.id)"
                />
                <div v-else-if="key.key === 'action'">
                  <InvoicesExcelsDropdown
                    v-if="hasAccess2Excel217 || hasAccess2Excel520"
                    :invoice-id="data.id"
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
        :current-size="params.page_size"
        :total-count="data?.total_count"
        :page-number="data?.page_number"
      />
      <page-index
        :available-pages="data?.total_pages"
        :current-page="data?.page_number"
        @setPage="setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="openedDetailId">
      <InvoicesShippingGeneralDetail
        :id="openedDetailId"
        :type="type"
        @closeDialog="closeDetailDialog"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { ComputedRef } from "vue";
import { useI18n } from "vue-i18n";
import { useShippingInvoiceAccess } from "~/composables/access/invoices/shipping-access";
import { returnInvoice, shippingInvoice } from "~/variable/column-constants";
import type { Template } from "~/interfaces/ui/template";
import type { AppResponse } from "~/interfaces/api/response/app-response";
import type { ShippingInvoiceListModel } from "~/interfaces/api/invoices/shipping/shipping-invoice-list-model";
import type { ListParams } from "~/interfaces/api/params/list-parameters";

// props
const props = defineProps<{
  type?: "return";
  data: AppResponse<ShippingInvoiceListModel> | undefined;
  headers: Template[];
  params: ListParams & {
    shipping_date_range: Record<"from" | "to", string>;
  };
  isLoading: boolean;
  isSettingStatusLoading: string | boolean;
  hasAccessToConfirm?: boolean;
  hasAccessToCancel?: boolean;
}>();

// emits
const emit = defineEmits([
  "refresh",
  "setPage",
  "setPageSize",
  "search",
  "sortData",
  "onConfirm",
  "updateHeaderOrder",
  "onCancel",
]);

// types
enum StatusIds {
  waitingForConfirm = 1,
  confirmed = 2,
  canceled = 3,
}

type StatusType = {
  id: number;
  name: string;
  hasAccess: ComputedRef<boolean>;
};

// states
const { t } = useI18n();

const { hasAccess2Excel520, hasAccess2Excel217 } = useShippingInvoiceAccess();

const openedDetailId = ref<string | null>(null);
const checkedItemIds = ref<string[]>([]);

const statuses: StatusType[] = [
  {
    id: StatusIds.waitingForConfirm,
    name: t("invoices.waiting_for_confirm"),
    hasAccess: computed(() => true),
  },
  {
    id: StatusIds.confirmed,
    name: t("invoices.set_confirmed"),
    hasAccess: computed(() => props.hasAccessToConfirm),
  },
  {
    id: StatusIds.canceled,
    name: t("invoices.return.set_canceled"),
    hasAccess: computed(() => props.hasAccessToCancel),
  },
];

// hooks
const isReturnType = computed(() => props.type === "return");

const headersSaveKey = computed(() => {
  if (isReturnType.value) return returnInvoice;
  return shippingInvoice;
});

const isTableAllChecked = computed(() => {
  if (!props.data?.items.length) return false;
  return props.data?.items.every((item) =>
    checkedItemIds.value.includes(item.id),
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !props.data?.items.length) return false;
  return props.data?.items.some((item) =>
    checkedItemIds.value.includes(item.id),
  );
});
// methods
const refresh = async () => {
  emit("refresh");
};

const setPage = (page: number) => {
  emit("setPage", page);
};

const setPageSize = (size: number) => {
  emit("setPageSize", size);
};

const search = (value: string) => {
  emit("search", value);
};

const sortData = (value: string) => {
  emit("sortData", value);
};

const getAllItemIds = (checked: boolean) => {
  if (!checked) {
    checkedItemIds.value = [];
  } else {
    checkedItemIds.value = props.data?.items.map((item) => item.id) || [];
  }
};

const isItemChecked = (id: string) => {
  return checkedItemIds.value.includes(id);
};

const onCheckItem = (id: string, checked: boolean) => {
  if (checked) {
    checkedItemIds.value.push(id);
  } else {
    checkedItemIds.value = checkedItemIds.value.filter((item) => item !== id);
  }
};

const openDetailDialog = (id: string) => {
  openedDetailId.value = id;
};

const closeDetailDialog = () => {
  openedDetailId.value = null;
};

const onChangeTableHeaders = (value: Template[]) => {
  emit("updateHeaderOrder", value);
};

const getAvailableStatusesById = (statusId: number, id: string) => {
  const availableStatuses = statuses.filter((status) => status.hasAccess.value);

  switch (statusId) {
    case StatusIds.waitingForConfirm:
      if (isReturnType.value) {
        return availableStatuses.filter(
          (status) =>
            status.id === StatusIds.confirmed ||
            status.id === StatusIds.canceled,
        );
      } else
        return availableStatuses.filter(
          (status) => status.id === StatusIds.confirmed,
        );
    default:
      return [];
  }
};

const onChangeStatusById = async (statusId: number, dataId: string) => {
  switch (statusId) {
    case StatusIds.confirmed:
      emit("onConfirm", dataId);
      break;
    case StatusIds.canceled:
      emit("onCancel", dataId);
      break;
    default:
      break;
  }
};
<\/script>
`;export{e as default};
