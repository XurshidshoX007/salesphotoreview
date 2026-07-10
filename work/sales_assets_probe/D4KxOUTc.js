const e=`<template>
  <div>
    <div class="table-content-container overflow-hidden">
      <div class="table-content-header">
        <table-sort-columns
          :templates="templates"
          :save-key="dashboardSalesClientTerritoryReportHeader"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="templates"
          :save-key="dashboardSalesClientTerritoryReportHeader"
        />
        <page-size-btn
          :current-size="saleDashboardStore.paramsTerritory.page_size"
          :total-count="
            saleDashboardStore.dataClientTerritoryReport?.total_count
          "
          :page-number="
            saleDashboardStore.dataClientTerritoryReport?.page_number
          "
          @setPageSize="setPageSize"
        />
        <search-input @change="search" />

        <excel-btn />

        <RefreshBtn
          :loading="saleDashboardStore.isLoadingProductReport"
          @click="refresh"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="templates"
          :is-empty="
            !saleDashboardStore.dataClientTerritoryReport?.items?.length
          "
          :loading="saleDashboardStore.isLoadingTerritoryReport"
          @sort="sortData"
          :sorted="saleDashboardStore.paramsTerritory.order_by"
        >
          <template #body>
            <template
              v-for="(data, index) in saleDashboardStore
                .dataClientTerritoryReport?.items"
              :key="index"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in templates"
                  :key="key"
                  :is-checked="key.checked"
                >
                  <div
                    v-if="typeof data[key.key] === 'number'"
                    class="text-end"
                  >
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
          :current-size="saleDashboardStore.paramsTerritory.page_size"
          :total-count="
            saleDashboardStore.dataClientTerritoryReport?.total_count
          "
          :page-number="
            saleDashboardStore.dataClientTerritoryReport?.page_number
          "
        />
        <page-index
          :available-pages="
            saleDashboardStore.dataClientTerritoryReport?.total_pages
          "
          :current-page="
            saleDashboardStore.dataClientTerritoryReport?.page_number
          "
          @setPage="setPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getFormattedAmount } from "~/utils/filter";
import type { Template } from "~/interfaces/ui/template";
import { getCheckedItemsByKey } from "~/utils/local-storage";
import { dashboardSalesClientTerritoryReportHeader } from "~/variable/column-constants";
// store
const saleDashboardStore = useDashboardSalesStore("main");

//props
const props = defineProps({
  isActive: Boolean,
});

// State
const { t } = useI18n();
const templates: ref<Template[]> = ref(
  getCheckedItemsByKey(dashboardSalesClientTerritoryReportHeader) || [
    {
      name: t("settings_sidebar.territory"),
      checked: true,
      key: "territory_name",
      type: "territory_name",
    },
    {
      name: t("column.sum"),
      checked: true,
      key: "order_amount",
      type: "order_amount",
      right: true,
    },
    {
      name: t("reports.akb"),
      checked: true,
      key: "acb",
      type: "acb",
      right: true,
    },
  ],
);

// methods

const refresh = async () => {
  await getData();
};
const onChangeTableHeaders = (newValue: Template[]) => {
  templates = newValue;
};

const sortData = (data: any) => {
  saleDashboardStore.paramsTerritory.order_by = data;
};

const search = (value: string) => {
  saleDashboardStore.paramsTerritory.page = 1;
  saleDashboardStore.paramsTerritory.search = value;
};

const setPageSize = (pageSize: number) => {
  saleDashboardStore.paramsTerritory.page_size = pageSize;
  saleDashboardStore.paramsTerritory.page = 1;
};

const setPage = (page: number) => {
  saleDashboardStore.paramsTerritory.page = page;
};

const getData = async () => {
  await saleDashboardStore.getClientTerritoryReport();
};
// hooks

watch(saleDashboardStore.filterParams, async (value, oldValue, onCleanup) => {
  await getData();
});

onMounted(async () => {
  if (props.isActive) {
    await getData();
  }
});
<\/script>
`;export{e as default};
