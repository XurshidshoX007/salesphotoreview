const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="orderDebtsColumn"
          :templates="orderDebtsStore.templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="orderDebtsStore.templates"
          :save-key="orderDebtsColumn"
        />
        <page-size-btn
          :current-size="orderDebtsStore.params.page_size"
          :total-count="orderDebtsStore?.data?.total_count"
          :page-number="orderDebtsStore?.data?.page_number"
          @setPageSize="orderDebtsStore.setPageSize"
        />
        <search-input
          @change="orderDebtsStore.search"
          :value="orderDebtsStore.params.search"
        />
        <excel-btn
          @click="orderDebtsStore.onDownloadExcelFile"
          :loading="orderDebtsStore.isExcelFileDownloading"
        />
        <RefreshBtn @click="refresh" :loading="orderDebtsStore.isLoading" />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="orderDebtsStore.templates"
          :loading="orderDebtsStore.isLoading"
          :isEmpty="!orderDebtsStore.data?.items?.length"
          :check="isTableAllChecked"
          :indeterminate="isTableIndeterminate"
          :sorted="orderDebtsStore.params.order_by"
          @sort="orderDebtsStore.sortData"
          @getAllId="getAllItemId"
        >
          <template #body>
            <template v-for="data in orderDebtsStore.data?.items" :key="index">
              <c-tr>
                <c-td-no-edit
                  v-for="key in orderDebtsStore.templates"
                  :key="key"
                  :is-checked="key.checked"
                  :type="key.type"
                >
                  <div v-if="key.key === 'checkbox'">
                    <Checkbox
                      :id="data.id"
                      :checked="isTableChecked(data.client.id)"
                      @change="onSelectItem(data.client.id)"
                    />
                  </div>
                  <div v-else-if="key.type === 'number'">
                    {{ getFormattedAmount(data[key.key]) }}
                  </div>
                  <link-component
                    v-else-if="key.key === 'client'"
                    :to="\`/clients/about-clients/\${data[key.key].id}\`"
                    :value="data[key.key]?.name"
                  />
                  <div v-else-if="key.type === 'date'">
                    {{ getFormattedDate(data[key.key], "DD.MM.YYYY") }}
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
          :current-size="orderDebtsStore.params.page_size"
          :total-count="orderDebtsStore?.data?.total_count"
          :page-number="orderDebtsStore?.data?.page_number"
        />
        <page-index
          :available-pages="orderDebtsStore.data?.total_pages"
          :current-page="orderDebtsStore.data?.page_number"
          @setPage="orderDebtsStore.setPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useOrderDebtsStore } from "~/stores/dashboard/cashbox/order-debts/order-debts.store";
import { orderDebtsColumn } from "~/variable/column-constants";

// store
const orderDebtsStore = useOrderDebtsStore("main");

// hooks

const isTableAllChecked = computed(() => {
  if (!orderDebtsStore.data?.items.length) return false;
  return orderDebtsStore.data?.items.every((item) =>
    orderDebtsStore.editMultipleDialog.includes(item.client.id!),
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !orderDebtsStore.data?.items.length)
    return false;
  return orderDebtsStore.data?.items.some((item) =>
    orderDebtsStore.editMultipleDialog.includes(item.client.id!),
  );
});

// Methods

const onSelectItem = (selectingId: string) => {
  if (!isTableChecked(selectingId)) {
    orderDebtsStore.editMultipleDialog.push(selectingId);
  } else {
    orderDebtsStore.editMultipleDialog =
      orderDebtsStore.editMultipleDialog.filter((id) => id !== selectingId);
  }
};

const getAllItemId = (checked: boolean) => {
  if (orderDebtsStore.data?.items) {
    if (!checked) {
      orderDebtsStore.setNullMultipleDialog();
    } else {
      orderDebtsStore.editMultipleDialog = orderDebtsStore.data?.items.map(
        (item) => item.client.id,
      );
    }
  }
};

const isTableChecked = (id: string) => {
  return !!orderDebtsStore.editMultipleDialog.find((item) => item === id);
};

const refresh = () => {
  orderDebtsStore.refresh();
};

const onChangeTableHeaders = (newValue) => {
  orderDebtsStore.templates = newValue;
};
<\/script>
`;export{e as default};
