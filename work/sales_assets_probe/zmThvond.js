const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <div class="table-content-btn-group">
        <table-sort-columns
          :templates="supplierPaymentsStore.headers"
          :save-key="paymentBySuppliers"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="supplierPaymentsStore.headers"
          :save-key="paymentBySuppliers"
        />
        <page-size-btn
          :current-size="supplierPaymentsStore.params.page_size"
          :total-count="supplierPaymentsStore.data?.total_count"
          :page-number="supplierPaymentsStore.data?.page_number"
          @setPageSize="supplierPaymentsStore.setPageSize"
        />
        <search-input
          :value="supplierPaymentsStore.params.search"
          @change="supplierPaymentsStore.onSearch"
        />
        <excel-btn
          :loading="supplierPaymentsStore.isExcelFileDownloading"
          @click="supplierPaymentsStore.downloadExcelFile"
        />
        <RefreshBtn
          @click="supplierPaymentsStore.refresh"
          :loading="supplierPaymentsStore.isLoading"
        />
      </div>
    </div>
    <div v-if="hasAccess2PaymentList" class="table-content-body">
      <data-table
        :headers="supplierPaymentsStore.headers"
        :sorted="supplierPaymentsStore.params.order_by"
        :loading="supplierPaymentsStore.isLoading"
        :isEmpty="!supplierPaymentsStore.data?.items?.length"
        @sort="supplierPaymentsStore.sortData"
      >
        <template #body>
          <template
            v-for="data in supplierPaymentsStore.data?.items"
            :key="data.visual_id"
          >
            <c-tr>
              <c-td-no-edit
                v-for="key in supplierPaymentsStore.headers"
                :key="key.key"
                :type="key.type"
              >
                <div v-if="key.key === 'visual_id'">
                  <link-component
                    non-copyable
                    :value="data.visual_id"
                    @click="openDetailDialog(data.id)"
                  />
                </div>
                <div v-else-if="key.type === 'date'">
                  {{ getFormattedDate(getNestedValue(data, key.key)) }}
                </div>
                <div v-else-if="key.type === 'object'">
                  {{
                    key.accessorKey
                      ? getNestedValue(data, key.accessorKey)
                      : getDataValue(data, key.key)?.name
                  }}
                </div>
                <div v-else-if="key.type === 'number'">
                  {{ getFormattedAmount(getNestedValue(data, key.key)) }}
                </div>
                <flex-row
                  v-else-if="key.key === 'action'"
                  class="items-center gap-2"
                >
                  <rounded-icon-btn
                    v-if="hasAccess2PaymentUpdate"
                    type="edit"
                    :iconSize="20"
                    @click="openEditDialog(data.id)"
                  />
                  <rounded-icon-btn
                    v-if="hasAccess2PaymentDelete"
                    type="danger"
                    @click="openDeletConfirmation(data.id)"
                  />
                </flex-row>
                <div v-else>
                  {{ getDataValue(data, key.key) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="supplierPaymentsStore.params.page_size"
        :total-count="supplierPaymentsStore.data?.total_count"
        :page-number="supplierPaymentsStore.data?.page_number"
      />
      <page-index
        :available-pages="supplierPaymentsStore.data?.total_pages"
        :current-page="supplierPaymentsStore.data?.page_number"
        @setPage="supplierPaymentsStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingItemId">
      <SuppliersPaymentsAddEditDialog
        :id="editingItemId"
        @close-dialog="closeEditDialog"
      />
    </div>
  </transition>
  <transition name="modal">
    <div v-if="openedDetailItemId">
      <SuppliersPaymentsDetailDialog
        :id="openedDetailItemId"
        @open-edit-dialog="openEditDialog"
        @open-delete-confirmation="openDeletConfirmation"
        @close-dialog="closeDetailDialog"
      />
    </div>
  </transition>
  <transition name="modal">
    <div v-if="deleteInfo.id">
      <CommonDeletedDialog
        reason-input
        :is-loading="deleteInfo.isDeleting"
        @on-input-reason="setDeletingReason"
        @on-select-exit="closeDeleteConfirmation"
        @on-select-delete="onDelete"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { paymentBySuppliers } from "~/variable/column-constants";
import { getFormattedDate } from "~/utils/formatters";
import { getNestedValue } from "~/utils/helpers";
import { getFormattedAmount } from "~/utils/filter";
import type { PaymentListItemModel } from "~/interfaces/api/supplier/payment-models";
import type { Template } from "~/interfaces/ui/template";
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useSuppliersAccess } from "~/composables/access/suppliers/suppliers";

// stores
const supplierPaymentsStore = useSupplierPaymentsStore("main");

// accesses
const {
  hasAccess2PaymentList,
  hasAccess2PaymentUpdate,
  hasAccess2PaymentDelete,
} = useSuppliersAccess();

// states
const { t } = useI18n();
const editingItemId = ref<string | null>(null);
const openedDetailItemId = ref<string | null>(null);

const deleteInfo = reactive<{
  id: string | null;
  reason: string | undefined;
  isDeleting: boolean;
}>({
  id: null,
  reason: undefined,
  isDeleting: false,
});

// methods
const getDataValue = (data: PaymentListItemModel, key: string) => {
  return (data as any)[key];
};

const onChangeTableHeaders = (newValue: Template[]) => {
  supplierPaymentsStore.headers = newValue;
};

const openEditDialog = (id: string) => {
  editingItemId.value = id;
};

const closeEditDialog = () => {
  editingItemId.value = null;
};

const openDetailDialog = (id: string) => {
  openedDetailItemId.value = id;
};

const closeDetailDialog = () => {
  openedDetailItemId.value = null;
};

const openDeletConfirmation = async (id: string) => {
  deleteInfo.id = id;
};

const closeDeleteConfirmation = () => {
  deleteInfo.id = null;
};

const setDeletingReason = (reason: string | undefined) => {
  deleteInfo.reason = reason;
};

const onDelete = async () => {
  if (deleteInfo.id) {
    const payload = {
      id: deleteInfo.id,
      reason: deleteInfo.reason,
    };
    deleteInfo.isDeleting = true;
    const res = await supplierPaymentsStore.deletePayment(payload);
    if (res !== "error") {
      notify({
        title: t("toast.deleted"),
        type: "success",
      });
      supplierPaymentsStore.refresh();
      closeDeleteConfirmation();
    } else {
      notify({
        title: t("toast.error"),
        type: "error",
      });
    }
    deleteInfo.isDeleting = false;
  }
};
<\/script>
`;export{e as default};
