const e=`<template>
  <div>
    <div class="table-content-container overflow-hidden">
      <div class="table-content-header">
        <table-sort-columns
          :templates="templates"
          :save-key="dashboardSalesProductCategoryReportHeader"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="templates"
          :save-key="dashboardSalesProductCategoryReportHeader"
        />
        <search-input @change="search" />

        <excel-btn />

        <RefreshBtn
          @click="refresh"
          :loading="saleDashboardStore.isLoadingProductReport"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="templates"
          :is-empty="
            !saleDashboardStore.dataProductCategoryReport?.categories?.length
          "
          :loading="saleDashboardStore.isLoadingProductReport"
          :sorted="params.order_by"
          @sort="sortData"
        >
          <template #body>
            <template
              v-for="(data, index) in saleDashboardStore
                .dataProductCategoryReport?.categories"
              :key="index"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in templates"
                  :key="key"
                  :is-checked="key.checked"
                  :class="key?.borderX && 'border-r-1'"
                >
                  <div v-if="key.key === 'category_name'">
                    {{ data["category"]?.name }}
                  </div>
                  <div
                    v-else-if="typeof data[key.key] === 'number'"
                    class="text-end"
                  >
                    {{ getFormattedAmount(data[key.key]) }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </template>
          <template #footer>
            <c-tr
              v-if="
                saleDashboardStore.dataProductCategoryReport?.categories?.length
              "
              class="bg-neutral-50 border-b-0"
            >
              <c-td-no-edit
                v-for="key in templates"
                :key="key.name"
                :is-checked="key.checked"
                :class="key.borderX && 'border-r-1'"
              >
                <div
                  v-if="
                    typeof saleDashboardStore.dataProductCategoryReport[
                      key.key
                    ] === 'number'
                  "
                  class="fw-6 fs-14 text-end"
                >
                  {{
                    getFormattedAmount(
                      saleDashboardStore.dataProductCategoryReport[key.key],
                    )
                  }}
                </div>
                <div v-else-if="key.key === 'category_name'" class="fw-6 fs-14">
                  {{ t("column.total") }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getFormattedAmount } from "~/utils/filter";
import type { Template } from "~/interfaces/ui/template";
import { getCheckedItemsByKey } from "~/utils/local-storage";
import { dashboardSalesProductCategoryReportHeader } from "~/variable/column-constants";
import { ref } from "vue";
// store
const saleDashboardStore = useDashboardSalesStore("main");
//props
const props = defineProps({
  isActive: Boolean,
});

// State
const { t } = useI18n();
const templates: ref<Template[]> = ref(
  getCheckedItemsByKey(dashboardSalesProductCategoryReportHeader) || [
    {
      name: t("labels.name"),
      checked: true,
      key: "category_name",
      type: "category_name",
    },
    {
      name: t("column.total_sum"),
      checked: true,
      key: "total_amount",
      type: "category_name",
      right: true,
    },
    {
      name: t("column.quantity"),
      checked: true,
      key: "count",
      type: "category_name",
      right: true,
    },
    {
      name: t("column.volume"),
      checked: true,
      key: "volume",
      type: "category_name",
      right: true,
    },
    {
      name: t("reports.akb"),
      checked: true,
      key: "acb",
      type: "category_name",
      right: true,
    },
    {
      name: t("column.percentage"),
      checked: true,
      key: "share",
      type: "category_name",
      right: true,
    },
  ],
);
const params = ref({
  order_by: { field: "name", is_asc: true },
});

// methods

const refresh = async () => {
  await getData();
};
const onChangeTableHeaders = (newValue: Template[]) => {
  templates = newValue;
};

const getData = async () => {
  await saleDashboardStore.getProductCategoryReport();
};

const sortData = async (orderBy: { field: string; is_asc?: boolean }) => {
  params.value.order_by = orderBy;

  if (orderBy) {
    const { field, is_asc = true } = orderBy; // Default to ascending order if not specified
    const list = saleDashboardStore.dataProductCategoryReport?.categories;

    if (!Array.isArray(list) || !field) return; // Ensure \`items\` is an array and \`field\` is defined

    saleDashboardStore.dataProductCategoryReport.categories = [...list].sort(
      (a, b) => {
        let aValue, bValue;

        if (field === "category_name") {
          aValue = a["category"]?.name;
          bValue = b["category"]?.name;
        } else {
          aValue = a[field];
          bValue = b[field];
        }
        if (typeof aValue === "string" && typeof bValue === "string") {
          return is_asc
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue); // String sorting
        }
        if (typeof aValue === "number" && typeof bValue === "number") {
          return is_asc ? aValue - bValue : bValue - aValue; // Numeric sorting
        }
        return 0;
      },
    );
  } else {
    await refresh();
  }
};

const search = (value: string) => {
  const results = [];

  const lowerCaseSearchTerm = value.toLowerCase();
  if (value) {
    saleDashboardStore.dataProductCategoryReport?.categories?.map((item) => {
      templates.value?.map((column) => {
        if (column.key === "category_name") {
          if (
            item["category"]?.name
              .toString()
              .toLowerCase()
              .includes(lowerCaseSearchTerm)
          ) {
            results.push(item);
          }
        } else if (item) {
          if (
            item[column.key]
              ?.toString()
              .toLowerCase()
              .includes(lowerCaseSearchTerm)
          ) {
            results.push(item);
          }
        }
      });
    });
    saleDashboardStore.dataProductCategoryReport.categories = results;
  } else {
    saleDashboardStore.dataProductCategoryReport.categories =
      saleDashboardStore.dataProductCategoryReportForSearch?.categories;
  }
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

<style scoped>
.table-content-body {
  padding-bottom: 0;
}
</style>
`;export{e as default};
