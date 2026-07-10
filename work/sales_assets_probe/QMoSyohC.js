const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header justify-between">
      <div class="table-content-btn-group">
        <table-sort-columns
          :save-key="reportsReturnSalesByClientHeader"
          :templates="salesByCustomerPeriodStore.templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="salesByCustomerPeriodStore.templates"
          :save-key="reportsReturnSalesByClientHeader"
        />
        <page-size-btn
          :current-size="salesByCustomerPeriodStore.localParams.page_size"
          :page-number="salesByCustomerPeriodStore.paginationData.total_page"
          @setPageSize="salesByCustomerPeriodStore.setPageSize"
        />
        <excel-btn @click="onDownloadExcelFile" />
        <search-input
          @change="salesByCustomerPeriodStore.search"
          :value="salesByCustomerPeriodStore.localParams.search"
        />
        <RefreshBtn
          @click="refresh"
          :loading="salesByCustomerPeriodStore.isLoadingPage"
        />
      </div>
      <Checkbox
        :title="t('reports.only_with_meaning')"
        :id="reportsReturnSalesByClientHeader + '-hideNullableValues'"
        :checked="salesByCustomerPeriodStore.hideNullableValues"
        @change="updateHideNullableValues"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :loading="salesByCustomerPeriodStore.isLoadingPage"
        :is-empty="!salesByCustomerPeriodStore.dataTable?.length"
      >
        <template #header>
          <c-tr class="bg-neutral-50">
            <c-td-no-edit
              v-for="(header, index) in salesByCustomerPeriodStore
                .salesReportPeriodData.columns || []"
              :key="\`header-\${index}-\${header.key}\`"
              :rowspan="checkRowSpan(header.key)"
              :class="index !== 0 && 'border-l-1'"
              :is-checked="header.checked"
            >
              <div v-if="header.key === 'client'">
                <order-by-universal
                  :name="header.name"
                  :propsKey="header.key"
                  @sort="onSort(header.key, 'object', 'client', 'name')"
                  :sorted="salesByCustomerPeriodStore.localParams.order_by"
                />
              </div>
              <div v-else-if="header.key === 'client_code'">
                <order-by-universal
                  :name="header.name"
                  :propsKey="header.key"
                  @sort="onSort(header.key, 'object', 'client', 'visual_id')"
                  :sorted="salesByCustomerPeriodStore.localParams.order_by"
                />
              </div>
              <div v-else-if="header.key === 'agent'">
                <order-by-universal
                  :name="header.name"
                  :propsKey="header.key"
                  @sort="onSort(header.key, 'object', 'agent', 'name')"
                  :sorted="salesByCustomerPeriodStore.localParams.order_by"
                />
              </div>
              <div v-else-if="header.key === 'agent_code'">
                <order-by-universal
                  :name="header.name"
                  :propsKey="header.key"
                  @sort="onSort(header.key, 'object', 'agent', 'code')"
                  :sorted="salesByCustomerPeriodStore.localParams.order_by"
                />
              </div>
              <div v-else-if="header.key === 'territory'">
                <order-by-universal
                  :name="header.name"
                  :propsKey="header.key"
                  @sort="onSort(header.key, 'object', 'territory', 'name')"
                  :sorted="salesByCustomerPeriodStore.localParams.order_by"
                />
              </div>
              <div v-else :title="getColumnTitle(header.data)">
                <order-by-universal
                  :name="getColumnTitle(header.data)"
                  :propsKey="header.key"
                  :sorted="salesByCustomerPeriodStore.localParams.order_by"
                  @sort="onSort(header.key)"
                />
              </div>
            </c-td-no-edit>
          </c-tr>
          <c-tr class="bg-neutral-50">
            <c-td-no-edit
              v-for="(header, idx) in salesByCustomerPeriodStore
                .salesReportPeriodData.columns || []"
              :key="\`amount-header-\${idx}\`"
              :class="header.data && 'border-l-1'"
              :is-checked="typeof header.data?.amount === 'number'"
            >
              <div
                :title="\`Итого по \${salesByCustomerPeriodStore.format(
                  formatYearMonth(header.data?.year_month),
                )}\`"
                class="fs-14 fw-6 text-black text-end"
              >
                {{ getFormattedAmount(header.data?.amount) }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
        <template #body>
          <c-tr
            v-for="(data, rowIndex) in salesByCustomerPeriodStore.dataTable"
            :key="\`row-\${rowIndex}\`"
          >
            <c-td-no-edit
              v-for="(header, colIndex) in salesByCustomerPeriodStore
                .salesReportPeriodData.columns || []"
              :key="\`cell-\${rowIndex}-\${colIndex}\`"
              :is-checked="header.checked"
              :class="colIndex !== 0 && 'border-l-1'"
            >
              <div v-if="typeof data[header.key] === 'number'" class="text-end">
                {{ getFormattedAmount(data[header.key]) }}
              </div>
              <div v-else-if="header.key === 'client_code'">
                {{ data["client"]?.visual_id }}
              </div>
              <div v-else-if="header.key === 'agent_code'">
                {{ data["agent"]?.code }}
              </div>
              <div v-else-if="header.key === 'client'">
                <link-component
                  :value="data['client']?.name"
                  :to="\`/clients/about-clients/\${data['client']?.id}\`"
                />
              </div>
              <div v-else-if="typeof data[header.key] === 'object'">
                {{ data[header.key]?.name }}
              </div>
              <div v-else>
                {{ data[header.key] }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="salesByCustomerPeriodStore.localParams.page_size"
        :total-count="salesByCustomerPeriodStore.activeData?.length"
        :page-number="salesByCustomerPeriodStore.paginationData.current_page"
      />
      <page-index
        :available-pages="salesByCustomerPeriodStore.paginationData.total_page"
        :current-page="salesByCustomerPeriodStore.paginationData.current_page"
        @setPage="salesByCustomerPeriodStore.setPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { reportsReturnSalesByClientHeader } from "~/variable/column-constants";
import type { Template } from "~/interfaces/ui/template";

// Stores
const salesByCustomerPeriodStore =
  useSalesByClientsByPeriodCompareStore("main");

// Composition API
const { t } = useI18n();
const isSortAsc = ref<boolean>(false);
const sortingKey = ref<string>("");
interface SalesColumnData {
  year_month: {
    year: number;
    month: number;
  };
  acb: string;
}

// Methods
const updateHideNullableValues = (value: boolean) => {
  salesByCustomerPeriodStore.hideNullableValues = value;
  salesByCustomerPeriodStore.updateTableData();
  salesByCustomerPeriodStore.setPage(1);
};

const onSort = (key: string, type?: string, aSort?: string, bSort?: string) => {
  isSortAsc.value = sortingKey.value === key ? !isSortAsc.value : true;
  sortingKey.value = key;

  const getValue = (item: any, key: string): any => {
    if (type === "object" && aSort && bSort) {
      return item[aSort]?.[bSort];
    }
    return item[key];
  };

  const compare = (a: any, b: any): number => {
    const aValue = getValue(a, key);
    const bValue = getValue(b, key);

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return isSortAsc.value ? 1 : -1;
    if (bValue == null) return isSortAsc.value ? -1 : 1;

    if (typeof aValue === "string" && typeof bValue === "string") {
      return isSortAsc.value
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return isSortAsc.value ? aValue - bValue : bValue - aValue;
    }

    return isSortAsc.value
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  };

  const dataToSort = [...salesByCustomerPeriodStore.activeData];
  const sorted = dataToSort.sort(compare);

  salesByCustomerPeriodStore.dataTable = sorted.slice(
    0,
    salesByCustomerPeriodStore.localParams.page_size,
  );

  salesByCustomerPeriodStore.localParams.order_by = {
    field: key,
    is_asc: isSortAsc.value,
  };
};

const transformExcelData = (data: GenericObject[], headers: Template[]) => {
  const result: GenericObject[] = [];
  for (const item of data) {
    const row: GenericObject = {
      client: item.client.name || "",
      client_code: item.client.visual_id || "",
      agent: item.agent.name || "",
      agent_code: item.agent.code || "",
      territory: item.territory.name || "",
    };
    for (const hh of headers) {
      if (
        !["client", "client_code", "agent", "agent_code", "territory"].includes(
          hh.key,
        )
      ) {
        row[\`_\${hh.key}\`] = item[hh.key] || "";
      }
    }

    result.push(row);
  }
  return result;
};

const onDownloadExcelFile = () => {
  if (!salesByCustomerPeriodStore.salesReportPeriodData?.columns) {
    return;
  }

  const {
    salesReportPeriodPaginationData: data,
    salesReportPeriodData: { columns },
  } = salesByCustomerPeriodStore;

  const typedColumns = columns as Array<Template & { data: any }>;
  const header = typedColumns.reduce(
    (acc, item) => {
      if (item.data)
        acc[\`_\${item.key}\`] = salesByCustomerPeriodStore.format(
          formatYearMonth(item.data.year_month),
        );
      else acc[item.key] = item.name;
      return acc;
    },
    {} as Record<string, string>,
  );

  const excelData = transformExcelData(data, typedColumns);
  excelData.unshift(header);
  downloadLocalExcelFile({
    headers: typedColumns,
    data: excelData,
    title: "Продажи по клиентам 4",
  });
};

const onChangeTableHeaders = (param: Template[]) => {
  if (param && Array.isArray(param)) {
    salesByCustomerPeriodStore.templates = param;
    salesByCustomerPeriodStore.refresh();
  }
};

function formatYearMonth(dateObj?: { year: number; month: number }): string {
  if (
    !dateObj ||
    typeof dateObj.year !== "number" ||
    typeof dateObj.month !== "number"
  ) {
    return "";
  }
  return \`\${dateObj.year}-\${String(dateObj.month).padStart(2, "0")}\`;
}

const checkRowSpan = (header: string): number => {
  if (
    header === "client" ||
    header === "client_code" ||
    header === "agent" ||
    header === "agent_code" ||
    header === "territory"
  ) {
    return 2;
  } else {
    return 1;
  }
};

const refresh = () => {
  salesByCustomerPeriodStore.refresh();
};

const getColumnTitle = (data: SalesColumnData): string => {
  const formattedDate = salesByCustomerPeriodStore.format(
    formatYearMonth(data.year_month),
  );
  const acbText = data.acb ? \` АКБ: \${data.acb}\` : "";
  return \`\${formattedDate}\${acbText}\`;
};
<\/script>
`;export{e as default};
