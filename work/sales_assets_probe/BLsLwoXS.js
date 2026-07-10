const e=`<template>
  <card :classes="{ header: 'mb-4' }">
    <template #header> {{ t("clients.list_of_clients") }} </template>

    <div class="table-content-container">
      <div class="table-content-header !p-3 justify-between">
        <div class="table-content-btn-group">
          <table-sort-columns
            :templates="clientsStore.templates"
            :save-key="dashboardFinanceClientsHeader"
            @onChangeTableHeaders="onChangeTableHeaders"
          />
          <show-hide-column
            :headers="clientsStore.templates"
            :save-key="dashboardFinanceClientsHeader"
          />
          <excel-btn
            :loading="clientsStore.isExcelFileDownloading"
            @click="clientsStore.onDownloadExcelFile()"
          />
          <page-size-btn
            :current-size="clientsStore.params.page_size"
            :total-count="clientsStore.data?.total_count"
            :page-number="clientsStore.data?.page_number"
            @setPageSize="clientsStore.setPageSize"
          />
          <search-input
            :value="clientsStore.params.search"
            @change="clientsStore.params.search = $event"
          />
          <refresh-btn
            @click="clientsStore.refresh()"
            :loading="clientsStore.isLoading"
          />
        </div>
      </div>
      <div class="table-content-body !p-0">
        <data-table
          :headers="clientsStore.templates"
          :sorted="clientsStore.params.order_by"
          :loading="clientsStore.isLoading"
          :is-empty="!clientsStore.data?.items.length"
          @sort="clientsStore.sortData"
        >
          <template #body>
            <c-tr
              v-for="item in clientsStore.data?.items"
              :key="item.group.id"
              class="cursor-pointer"
            >
              <c-td-no-edit
                v-for="column in clientsStore.templates"
                :is-checked="column.checked"
                :key="column.key"
                :type="column.type"
              >
                {{
                  getDataValue(
                    item,
                    column.accessorKey || column.key,
                    column.type,
                  )
                }}
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div
        v-if="clientsStore.data?.items.length"
        class="table-content-footer !p-3"
      >
        <curren-page-btn
          :current-size="clientsStore.params.page_size"
          :total-count="clientsStore.data?.total_count"
          :page-number="clientsStore.data?.page_number"
        />
        <page-index
          :available-pages="clientsStore.data?.total_pages"
          :current-page="clientsStore.data?.page_number"
          @setPage="clientsStore.setPage"
        />
      </div>
    </div>
  </card>
</template>

<script setup lang="ts">
import { getDataValue, type Template } from "#imports";
import { useI18n } from "vue-i18n";
import { dashboardFinanceClientsHeader } from "~/variable/column-constants";

// Types
type Props = {
  currencies: SharedApiCurrenciesModel[];
};

// Props
const props = defineProps<Props>();

// Composables
const { t } = useI18n();

// Stores
const { clientsStore, params } = useDashboardFinanceStore();

// States
const currencyHeaders = ref<Template[]>([]);

// Hooks
watch(
  () => params,
  (params) => {
    if (!params.date_filter) return;

    clientsStore.getData();
  },
  { immediate: true, deep: true },
);

watch(
  [() => props.currencies, () => clientsStore.data] as const,
  ([currencies, data]) => {
    if (!currencies.length || !data?.items.length) return;

    currencyHeaders.value = currencies.map<Template>((currency) => ({
      name: currency.name,
      key: currency.id,
      type: "number",
      checked: true,
      is_sortable: false,
    }));
  },
);

watch(
  currencyHeaders,
  (currencyHeaders) => {
    if (!currencyHeaders.length) return;

    clientsStore.templates = getCheckedItemsByKey(
      dashboardFinanceClientsHeader,
    ) || [
      {
        name: t("column.name"),
        key: "group",
        type: "object",
        accessorKey: "group.name",
        checked: true,
      },
      {
        name: t("column.total_sum"),
        key: "total_amount",
        type: "number",
        checked: true,
      },
      ...currencyHeaders,
    ];
  },
  { immediate: true },
);

const onChangeTableHeaders = (newHeaders: Template[]) => {
  clientsStore.templates = newHeaders;
};
<\/script>
`;export{e as default};
