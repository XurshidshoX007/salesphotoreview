const e=`<template>
  <div class="table-content-container">
    <div class="flex justify-between p-4">
      <page-title20 :title="t('clients.list_of_clients')" />
      <FlexibleItemsMenu
        tab-mode
        :items-arr="tabItems"
        :active-item-id="activeTabNumber"
        :is-btn-loading="salesByClientsMinAkbStore.isClientsDataLoading"
        @onChangeActiveItem="activeTabNumber = $event"
      />
    </div>
    <div class="table-content-header border-t-1">
      <table-sort-columns
        :save-key="reportsCustomerMinClientHeader"
        :templates="salesByClientsMinAkbStore.clientsHeaders"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="salesByClientsMinAkbStore.clientsHeaders"
        :save-key="reportsCustomerMinClientHeader"
      />
      <page-size-btn
        :current-size="params?.page_size"
        @setPageSize="setPageSize"
      />
      <search-input @change="onSearch" />
      <excel-btn
        @click="onDownloadExcelFile"
        :loading="salesByClientsMinAkbStore.isClientsExcelDownloading"
      />
      <RefreshBtn
        @click="refresh"
        :loading="salesByClientsMinAkbStore.isClientsDataLoading"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="salesByClientsMinAkbStore.clientsHeaders"
        :sorted="params?.order_by"
        :loading="salesByClientsMinAkbStore.isClientsDataLoading"
        :isEmpty="!salesByClientsMinAkbStore.clientsData?.items.length"
        @sort="onSortData"
      >
        <template #body>
          <template
            v-for="data in salesByClientsMinAkbStore.clientsData?.items"
            :key="data.id"
          >
            <c-tr>
              <c-td-no-edit
                v-for="key in salesByClientsMinAkbStore.clientsHeaders"
                :key="key.key"
                :is-checked="key.checked"
                :header-key="key.key"
                :type="key.type"
              >
                <div v-if="key.type === 'number'">
                  {{ getFormattedAmount(data[key.key]) }}
                </div>
                <show-more
                  v-else-if="key.type === 'array'"
                  :show-count="2"
                  :data="data[key.key]"
                />
                <div v-else-if="key.type === 'date'">
                  {{ getFormattedDate(data[key.key]) }}
                </div>
                <div v-else-if="key.key === 'client_name'">
                  <link-component
                    :to="'/clients/about-clients/' + data?.client_id"
                    :value="data[key.key]"
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
        :current-size="params?.page_size"
        :page-number="salesByClientsMinAkbStore?.clientsData?.page_number"
        :total-count="salesByClientsMinAkbStore?.clientsData?.total_count"
        @setPageSize="setPageSize"
      />
      <page-index
        :available-pages="salesByClientsMinAkbStore.clientsData?.total_pages"
        :current-page="salesByClientsMinAkbStore.clientsData?.page_number"
        @setPage="setPageNumber"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReportsSalesAgentsMinAkbParams } from "~/interfaces/api/params/list-parameters";
import type { Template } from "~/interfaces/ui/template";
import { getFormattedDate } from "~/utils/formatters";
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";
import { reportsCustomerMinClientHeader } from "~/variable/column-constants";

// store
const salesByClientsMinAkbStore = useSalesByClientsMinAkbStore("main");

// state
const { t } = useI18n();
const activeTabNumber = ref<number>(1);
const params = reactive<Partial<ReportsSalesAgentsMinAkbParams>>({
  page: 1,
  page_size: 10,
  search: "",
  order_by: {
    field: "client_name",
    is_asc: true,
  },
});

const tabItems = ref([
  {
    id: 1,
    name: t("reports.akb"),
  },
  {
    id: 2,
    name: t("reports.not_akb"),
  },
]);
// hooks
const isAKb = computed(() => activeTabNumber.value === 1);

watch(params, async () => {
  await getData();
});

watch(isAKb, async () => {
  salesByClientsMinAkbStore.clientsSearchParams.search = "";
  salesByClientsMinAkbStore.params.show_akb = isAKb.value;
});

// methods

const getData = async () => {
  await salesByClientsMinAkbStore.getClientsData({
    ...salesByClientsMinAkbStore.params,
    ...params,
  });
};

const onDownloadExcelFile = async () => {
  salesByClientsMinAkbStore.onDownloadClientsExcelFile({
    ...salesByClientsMinAkbStore.params,
    ...params,
  });
};

const setPageNumber = (pageNumber: number) => {
  params.page = pageNumber;
};

const setPageSize = (pageSize: number) => {
  params.page_size = pageSize;
};

const onSearch = (value: string) => {
  salesByClientsMinAkbStore.clientsSearchParams.page = 1;
  salesByClientsMinAkbStore.clientsSearchParams.search = value;
};

const onSortData = (
  newValue: Record<"field" | "is_asc", boolean | string | undefined>,
) => {
  params.order_by = newValue;
};

const onChangeTableHeaders = (newValue: Template[]) => {
  salesByClientsMinAkbStore.clientsHeaders = newValue;
};

const refresh = () => {
  salesByClientsMinAkbStore.refreshClientsData();
};
<\/script>
`;export{e as default};
