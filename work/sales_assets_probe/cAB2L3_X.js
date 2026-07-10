const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="clientsPaymentExpenseHeader"
          :templates="expenseStore.templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="expenseStore.templates"
          :save-key="clientsPaymentExpenseHeader"
        />
        <page-size-btn
          :current-size="expenseStore.params.page_size"
          :total-count="expenseStore.data?.total_count"
          :page-number="expenseStore.data?.page_number"
          @setPageSize="expenseStore.setPageSize"
        />
        <search-input @change="expenseStore.search" />
        <excel-btn
          :loading="expenseStore.isExcelFileDownloading"
          @click="expenseStore.onDownloadExcelFile"
        />
        <RefreshBtn
          @click="refresh"
          :loading="expenseStore.isDataTableLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="expenseStore.templates"
          :sorted="expenseStore.params.order_by"
          :loading="expenseStore.isDataTableLoading"
          :isEmpty="!expenseStore.data?.items?.length"
          @sort="expenseStore.sortData"
        >
          <template #body>
            <template v-for="data in expenseStore.data?.items" :key="data.id">
              <c-tr class="w-full">
                <c-td-no-edit
                  v-for="key in expenseStore.templates"
                  :key="key.key"
                  :is-checked="key.checked"
                  :header-key="key.key"
                  :type="key.type"
                >
                  <div v-if="key.type === 'date'">
                    {{ getFormattedDate(data[key.key]) }}
                  </div>
                  <LinkComponent
                    v-else-if="key.key === 'visual_id'"
                    non-copyable
                    :value="data.visual_id"
                    @click="openDetail(data.id)"
                  />
                  <div v-else-if="key.type === 'number'">
                    {{ getFormattedAmount(data[key.key]) }}
                  </div>
                  <div
                    v-else-if="key.key === 'client_balance'"
                    class="text-end"
                  >
                    {{ getFormattedAmount(data.client?.balance) }}
                  </div>
                  <div v-else-if="key.key === 'client'">
                    <link-component
                      :value="data[key.key]?.name"
                      :to="\`/clients/about-clients/\${data[key.key]?.id}\`"
                      isLinkable
                    />
                  </div>
                  <div v-else-if="key.type?.includes('.name')">
                    {{ data[key.key?.split("_name")[0]]?.name }}
                  </div>
                  <div v-else-if="key.key === 'action'" class="flex gap-2">
                    <rounded-icon-btn
                      v-show="hasAccess2UpdateClientExpensePayment"
                      type="edit"
                      :iconSize="20"
                      :tooltip="t('edit')"
                      @click="selectedDebt = data.id"
                    />
                    <rounded-icon-btn
                      v-show="hasAccess2DeletedClientExpensePayment"
                      type="danger"
                      :tooltip="t('deleted')"
                      @click="deleteDialogId = data.id"
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
          :current-size="expenseStore.params.page_size"
          :total-count="expenseStore.data?.total_count"
          :page-number="expenseStore.data?.page_number"
        />
        <page-index
          :available-pages="expenseStore.data?.total_pages"
          :current-page="expenseStore.data?.page_number"
          @setPage="expenseStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="selectedDebt">
        <ClientsExpensePaymentClientExpensesDialog
          :modal-name="t('cash.edit_debt')"
          :debt-id="selectedDebt"
          title-color-for-header="#D10505"
          @refresh="refresh"
          @closeDialog="selectedDebt = null"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="deleteDialogId">
        <CommonDeletedDialog
          reason-input
          :isLoading="isDeleteLoading"
          @onInputReason="reasonOfDelete = $event"
          @onSelectExit="deleteDialogId = null"
          @onSelectDelete="onDeletePayment"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="openedDetailId">
        <ClientsExpensePaymentDetailDialog
          :id="openedDetailId"
          @closeDialog="closeDetailDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { getFormattedAmount } from "~/utils/filter";
import { useClientsExpensePaymentStore } from "~/stores/clients/client-expense-payment/client-expense";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";
import { useI18n } from "vue-i18n";
import { clientsPaymentExpenseHeader } from "~/variable/column-constants";
import { getFormattedDate } from "~/utils/formatters";
import type { Template } from "~/interfaces/ui/template";

// store
const expenseStore = useClientsExpensePaymentStore("main");

// state
const { t } = useI18n();
const {
  hasAccess2DeletedClientExpensePayment,
  hasAccess2UpdateClientExpensePayment,
} = useCashboxAccess();
const selectedDebt = ref<string | null>(null);
const deleteDialogId = ref<string | null>(null);
const isDeleteLoading = ref<boolean>(false);
const reasonOfDelete = ref<string>("");
const openedDetailId = ref<string | null>();

// methods
const refresh = () => {
  expenseStore.refresh();
};

const onChangeTableHeaders = (newValue: Template[]) => {
  expenseStore.templates = newValue;
};

const openDetail = (id: string) => {
  openedDetailId.value = id;
};

const closeDetailDialog = () => {
  openedDetailId.value = null;
};

const onDeletePayment = async () => {
  isDeleteLoading.value = true;

  let responseDeleted = await expenseStore.deleteExpense(
    deleteDialogId.value,
    reasonOfDelete.value,
  );

  if (responseDeleted !== "error") {
    await expenseStore.refresh();
    deleteDialogId.value = null;
  }
  isDeleteLoading.value = false;
};
<\/script>
`;export{e as default};
