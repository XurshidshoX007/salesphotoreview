const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="columnSaveKey"
          :templates="templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn :headers="templates" :save-key="columnSaveKey" />
        <page-size-btn
          :current-size="params.page_size"
          :total-count="data?.total_count"
          :page-number="data?.page_number"
          @setPageSize="setPageSize"
        />
        <search-input @change="search" />
        <excel-btn
          @click="onDownloadExcelFile"
          :loading="isExcelFileDownloading"
        />
        <RefreshBtn :loading="isLoading" @click="refresh" />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="templates"
          :sorted="params.order_by"
          :loading="isLoading"
          :is-empty="isEmpty"
          :check="isTableAllChecked"
          :indeterminate="isTableIndeterminate"
          :check-disabled="isGeneralCheckboxDisabled"
          @sort="sortData"
          @get-all-id="getAllItemIds"
        >
          <template #body>
            <template v-for="item in data?.items" :key="item.id">
              <c-tr>
                <c-td-no-edit
                  :is-checked="key.checked"
                  v-for="key in templates"
                  :key="key.key"
                  :type="key.type"
                >
                  <div v-if="key.key === 'checkbox'">
                    <Checkbox
                      :disabled="isRowCheckboxDisabled(item)"
                      :id="item.id"
                      :checked="isTableChecked(item.id)"
                      @change="onSelectOrder(item.id)"
                    />
                  </div>

                  <div v-else-if="key.type === 'date'">
                    {{
                      getFormattedDate(
                        getCellValue(item, key.key),
                        "DD.MM.YYYY",
                      )
                    }}
                  </div>
                  <link-component
                    v-else-if="key.key === 'order_visual_id'"
                    :to="\`/orders/orders/details?id=\${item.order_id}\`"
                    :value="getCellValue(item, key.key)"
                    :is-linkable="allowOrderDetailLink"
                  />
                  <link-component
                    v-else-if="key.key === 'client_name'"
                    :to="\`/clients/about-clients/\${item.client_id}\`"
                    :value="getCellValue(item, key.key)"
                    :is-linkable="allowClientDetailLink"
                  />
                  <div
                    v-else-if="
                      typeof getCellValue(item, key.key) === 'object' &&
                      key.key !== 'status'
                    "
                  >
                    {{ getCellValue(item, key.key)?.name }}
                  </div>
                  <div v-else-if="key.type === 'number'">
                    {{ getFormattedAmount(getCellValue(item, key.key)) }}
                  </div>
                  <div v-else-if="key.type === 'boolean'">
                    {{ getCellValue(item, key.key) ? "Да" : "Нет" }}
                  </div>
                  <div v-else>
                    {{ getCellValue(item, key.key) }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </template>
          <template #footer v-if="totals?.total_amount && !isEmpty">
            <c-tr class="bg-neutral-50">
              <c-td-no-edit
                v-for="key in templates"
                :key="key.key"
                :is-checked="key.checked"
              >
                <div v-if="key.key === 'checkbox'" class="fw-6">Итого</div>
                <div
                  v-else-if="key.key === 'payment_amount'"
                  class="text-end text-nowrap fw-6"
                >
                  {{ getFormattedAmount(totals?.total_amount) }}
                  {{ totals?.base_currency?.code }}
                </div>
              </c-td-no-edit>
            </c-tr>
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
  </div>
</template>

<script setup lang="ts">
import { getFormattedAmount } from "~/utils/filter";
import { getFormattedDate } from "~/utils/formatters";
import type { Template } from "~/interfaces/ui/template";
import type {
  ListParams,
  OrderByParams,
} from "~/interfaces/api/params/list-parameters";
import type { AppResponse } from "~/interfaces/api/response/app-response";
import type {
  PaymentRequestListModel,
  PaymentRequestTotalsModel,
} from "~/interfaces/api/cashbox/payment-request/payment-request-model";
import { ApplicationPaymentStatus } from "~/variable/static-constants";

defineOptions({
  name: "DashboardCashboxApplicationsPaymentDataTableView",
});

// props
const props = withDefaults(
  defineProps<{
    allowOrderDetailLink?: boolean;
    allowClientDetailLink?: boolean;
    columnSaveKey: string;
    templates: Template[];
    params: ListParams;
    data: AppResponse<PaymentRequestListModel> | undefined;
    isExcelFileDownloading: boolean;
    isLoading: boolean;
    selectedIds: string[];
    totals: PaymentRequestTotalsModel | undefined;
  }>(),
  {
    allowOrderDetailLink: false,
    allowClientDetailLink: false,
  },
);

// emits
const emit = defineEmits<{
  (e: "onChangeTemplates", value: Template[]): void;
  (e: "setPageSize", size: number): void;
  (e: "search", query: string): void;
  (e: "onDownloadExcelFile"): void;
  (e: "sortData", data: OrderByParams): void;
  (e: "getAllItemIds", value: boolean): void;
  (e: "refresh"): void;
  (e: "onSelectOrder", orderId: string): void;
  (e: "setPage", page: number): void;
}>();

// hooks
const tableItems = computed(() => {
  return props.data?.items ?? [];
});

const isEmpty = computed(() => {
  return tableItems.value.length === 0;
});

const isSelectionRestrictedToApprovableRows = computed(() => {
  return !props.params.filter?.some(
    (item) =>
      item.field === "status" &&
      item.value.includes(ApplicationPaymentStatus.Approved.toString()),
  );
});

const selectableItems = computed(() => {
  if (!isSelectionRestrictedToApprovableRows.value) {
    return tableItems.value;
  }

  return tableItems.value.filter((item) => item.can_approve);
});

const isTableAllChecked = computed(() => {
  if (!selectableItems.value.length) return false;

  return selectableItems.value.every((item) =>
    props.selectedIds.includes(item.id),
  );
});

const isTableIndeterminate = computed(() => {
  if (!selectableItems.value.length || isTableAllChecked.value) return false;

  return selectableItems.value.some((item) =>
    props.selectedIds.includes(item.id),
  );
});

const isGeneralCheckboxDisabled = computed(() => {
  return selectableItems.value.length === 0;
});

// Methods
const getCellValue = (item: PaymentRequestListModel, key: string) => {
  return (item as Record<string, any>)[key];
};

const isRowCheckboxDisabled = (item: PaymentRequestListModel) => {
  return isSelectionRestrictedToApprovableRows.value && !item.can_approve;
};

const refresh = () => {
  emit("refresh");
};

const getAllItemIds = (checked: boolean) => {
  emit("getAllItemIds", checked);
};

const isTableChecked = (orderId: string) => {
  return props.selectedIds.includes(orderId);
};

const onSelectOrder = (orderId: string) => {
  emit("onSelectOrder", orderId);
};

const onChangeTableHeaders = (newValue: Template[]) => {
  emit("onChangeTemplates", newValue);
};

const setPageSize = (size: number) => {
  emit("setPageSize", size);
};

const search = (value: string) => {
  emit("search", value);
};

const onDownloadExcelFile = () => {
  emit("onDownloadExcelFile");
};

const sortData = (data: OrderByParams) => {
  emit("sortData", data);
};

const setPage = (page: number) => {
  emit("setPage", page);
};
<\/script>
`;export{e as default};
