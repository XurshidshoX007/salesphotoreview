const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="expensesColumn"
          :templates="expenseStore.templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="expenseStore.templates"
          :save-key="expensesColumn"
        />
        <page-size-btn
          :current-size="expenseStore.params.page_size"
          :total-count="expenseStore.data?.total_count"
          :page-number="expenseStore.data?.page_number"
          @setPageSize="expenseStore.setPageSize"
        />
        <search-input @change="expenseStore.search" />
        <excel-btn
          @click="expenseStore.onDownloadExcelFile"
          :loading="expenseStore.isExcelFileDownloading"
        />
        <RefreshBtn @click="refresh" :loading="expenseStore.isLoading" />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="expenseStore.templates"
          :sorted="expenseStore.params.order_by"
          :loading="expenseStore.isLoading"
          :isEmpty="!expenseStore.data?.items?.length"
          :check="isTableAllChecked"
          :indeterminate="isTableIndeterminate"
          @sort="expenseStore.sortData"
          @getAllId="getAllExpenseId"
        >
          <template #body>
            <template
              v-for="(data, index) in expenseStore.data?.items"
              :key="index"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in expenseStore.templates"
                  :key="key"
                  :is-checked="key.checked"
                  :header-key="key.key"
                  :type="key.type"
                >
                  <div v-if="key.key === 'checkbox'">
                    <Checkbox
                      :id="data.id"
                      :checked="isTableChecked(data.id)"
                      @change="onSelectExpense(data.id)"
                    />
                  </div>
                  <div v-else-if="key.type === 'date'">
                    {{
                      getFormattedDate(
                        data[key.key],
                        getDateFormatByKey(key.key),
                      )
                    }}
                  </div>
                  <div v-else-if="key.type === 'number'">
                    {{ getFormattedAmount(data[key.key]) }}
                  </div>
                  <div v-else-if="key.key === 'action'">
                    <rounded-icon-btn
                      v-if="allowToUpdate"
                      type="edit"
                      :iconSize="20"
                      @click="() => editFunctions(data['id'])"
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
  </div>
</template>

<script setup>
import { getFormattedDate } from "~/utils/formatters";
import { getFormattedAmount } from "~/utils/filter";
import { expensesColumn } from "~/variable/column-constants";

// store
const expenseStore = useCashExpenses("main");

// props
const props = defineProps({
  allowToUpdate: Boolean,
});

const isTableAllChecked = computed(() => {
  if (!expenseStore.data?.items.length) return false;
  return expenseStore.data?.items.every((item) =>
    expenseStore.expenseIds.includes(item.id),
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !expenseStore.data?.items.length) return false;
  return expenseStore.data?.items.some((item) =>
    expenseStore.expenseIds.includes(item.id),
  );
});

// methods
const getDateFormatByKey = (key) => {
  return key === "payment_date" ? "DD.MM.YYYY HH:mm" : "DD.MM.YYYY";
};

// methods
const editFunctions = (id) => {
  expenseStore.editId = id;
  expenseStore.expensesShow = true;
};

const getAllExpenseId = (checked) => {
  if (!checked) {
    expenseStore.setNullExpenseIds();
  } else {
    expenseStore.expenseIds = expenseStore.data?.items.map(
      (payment) => payment.id,
    );
  }
};

const refresh = () => {
  expenseStore.refresh();
};

const isTableChecked = (expenseId) => {
  return expenseStore.expenseIds?.includes(expenseId) || false;
};

const onSelectExpense = (expenseId) => {
  const expenseIdsSet = new Set(expenseStore.expenseIds);

  if (!isTableChecked(expenseId)) {
    expenseIdsSet.add(expenseId);
  } else {
    expenseIdsSet.delete(expenseId);
  }

  expenseStore.expenseIds = Array.from(expenseIdsSet);
};

const onChangeTableHeaders = (newValue) => {
  expenseStore.templates = newValue;
};
<\/script>
`;export{e as default};
