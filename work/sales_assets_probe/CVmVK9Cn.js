const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header justify-between">
        <div class="table-content-btn-group">
          <table-sort-columns
            :templates="otherIncomeStore.templates"
            :save-key="otherIncomeColumn"
            @onChangeTableHeaders="onChangeTableHeaders"
          />
          <ShowHideColumn
            :headers="otherIncomeStore.templates"
            :save-key="otherIncomeColumn"
          />
          <page-size-btn
            :current-size="otherIncomeStore.params.page_size"
            @setPageSize="otherIncomeStore.setPageSize"
          />
          <search-input @change="otherIncomeStore.search" />
          <excel-btn />
          <RefreshBtn @click="refresh" :loading="otherIncomeStore.isLoading" />
        </div>
      </div>
      <div class="table-content-body">
        <data-table
          :headers="otherIncomeStore.templates"
          :sorted="otherIncomeStore.params.order_by"
          :loading="otherIncomeStore.isLoading"
          :isEmpty="!otherIncomeStore.data?.items?.length"
          :check="isTableAllChecked"
          :indeterminate="isTableIndeterminate"
          @sort="otherIncomeStore.sortData"
          @getAllId="getAllPaymentsId"
        >
          <template #body>
            <template
              v-for="(data, index) in otherIncomeStore.data?.items"
              :key="index"
            >
              <c-tr class="b-bottom">
                <c-td-no-edit
                  v-for="key in otherIncomeStore.templates"
                  :key="key"
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
                  <div v-if="key.type === 'date'">
                    {{ getFormattedDate(data[key.key]) }}
                  </div>
                  <div
                    v-else-if="key.key === 'action'"
                    v-show="key.checked"
                    class="flex gap-2"
                  >
                    <rounded-icon-btn
                      v-if="allowToDetail"
                      type="edit"
                      :iconSize="20"
                      @click="onEdit(data?.id)"
                    />
                    <rounded-icon-btn
                      v-if="allowToDelete"
                      type="danger"
                      @click="deletingItemId = data?.id"
                    />
                  </div>
                  <div v-else-if="key.type === 'number'">
                    {{ getFormattedAmount(data[key.key]) }}
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
          :current-size="otherIncomeStore.params.page_size"
          :total-count="otherIncomeStore.data?.total_count"
          :page-number="otherIncomeStore.data?.page_number"
        />
        <page-index
          :available-pages="otherIncomeStore.data?.total_pages"
          :current-page="otherIncomeStore.data?.page_number"
          @setPage="otherIncomeStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="editingItemId">
        <DashboardCashboxOtherIncomeDialog
          :id="editingItemId"
          :allow-to-save="allowToUpdate"
          @closeDialog="editingItemId = null"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="deletingItemId">
        <CommonDeletedDialog
          :isLoading="isDeleteLoading"
          @onSelectExit="deletingItemId = null"
          @onSelectDelete="onDelete"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { getFormattedDate } from "~/utils/formatters";
import { getFormattedAmount } from "~/utils/filter";
import { otherIncomeColumn } from "~/variable/column-constants";

// stores
const otherIncomeStore = useOtherIncome("");

// props
const props = defineProps({
  allowToCreate: Boolean,
  allowToDelete: Boolean,
  allowToDetail: Boolean,
  allowToUpdate: Boolean,
});

// states
const editingItemId = ref(null);
const deletingItemId = ref(null);
const isDeleteLoading = ref(false);

// hooks

const isTableAllChecked = computed(() => {
  if (!otherIncomeStore.data?.items.length) return false;
  return otherIncomeStore.data?.items.every((item) =>
    otherIncomeStore.paymentIds.includes(item.id),
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !otherIncomeStore.data?.items.length)
    return false;
  return otherIncomeStore.data?.items.some((item) =>
    otherIncomeStore.paymentIds.includes(item.id),
  );
});

// methods

const refresh = () => {
  otherIncomeStore.refresh();
};

const onChangeTableHeaders = (newValue) => {
  otherIncomeStore.templates = newValue;
};

const getAllPaymentsId = (checked) => {
  if (!checked) {
    otherIncomeStore.setNullPaymentIds();
  } else {
    otherIncomeStore.paymentIds = otherIncomeStore.data?.items.map(
      (payment) => payment.id,
    );
  }
};

const isTableChecked = (paymentId) => {
  return !!otherIncomeStore.paymentIds.find((id) => paymentId === id);
};

const onSelectOrder = (paymentId) => {
  if (!isTableChecked(paymentId)) {
    otherIncomeStore.paymentIds.push(paymentId);
  } else {
    otherIncomeStore.paymentIds = otherIncomeStore.paymentIds.filter(
      (id) => id !== paymentId,
    );
  }
};

const onEdit = (id) => {
  editingItemId.value = id;
};

const onDelete = async () => {
  isDeleteLoading.value = true;
  const data = {
    id: deletingItemId.value,
  };
  await otherIncomeStore.onDelete(data);
  await otherIncomeStore.refresh();
  deletingItemId.value = null;
  isDeleteLoading.value = false;
};
<\/script>
`;export{e as default};
