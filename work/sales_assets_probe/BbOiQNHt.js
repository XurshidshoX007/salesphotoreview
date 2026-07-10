const n=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <flex-col class="gap-4">
        <page-title
          :title="t('dashboard.plan_fact.sales_by_clients_dates')"
          size="xl"
        />
        <flex-row class="gap-4">
          <page-size-btn
            :current-size="planFactStore.dailyClientSalesListParams.page_size"
            :total-count="planFactStore.dailyClientSalesListData?.total_count"
            :page-number="planFactStore.dailyClientSalesListData?.page_number"
            @setPageSize="planFactStore.setDailyClientSalesListPageSize"
          />
          <search-input @change="planFactStore.searchDailyClientSalesList" />
          <RefreshBtn
            :loading="planFactStore.dailyClientSalesListIsLoading"
            @click="onRefresh"
          />
        </flex-row>
      </flex-col>
    </div>

    <div class="px-4">
      <div class="table-content-body border rounded-lg">
        <data-table
          with-information-above-header
          :headers="columns"
          :is-empty="!planFactStore.dailyClientSalesListData?.items?.length"
          :loading="planFactStore.dailyClientSalesListIsLoading"
          :sorted="planFactStore.dailyClientSalesListParams.order_by"
          @sort="planFactStore.sortDailyClientSalesList"
          class="whitespace-nowrap"
        >
          <template #body>
            <c-tr
              v-for="item in planFactStore.dailyClientSalesListData?.items"
              :key="item.canonical_client_visual_id"
            >
              <c-td-no-edit
                v-for="col in columns"
                :key="col.key"
                :is-checked="col.checked"
              >
                <div
                  v-if="col.type === 'number'"
                  class="text-end whitespace-nowrap"
                >
                  {{ getFormattedAmount(Number(item[col.key]) || 0) }}
                </div>
                <div v-else>{{ item[col.key] }}</div>
              </c-td-no-edit>
            </c-tr>
          </template>

          <template
            v-if="planFactStore.dailyClientSalesReportTotalData"
            #footer
          >
            <c-tr class="bg-neutral-50">
              <c-td-no-edit
                v-for="(col, colIndex) in columns"
                :key="col.key"
                :is-checked="col.checked"
              >
                <div v-if="colIndex === 0" class="fw-6 fs-14">
                  {{ t("column.total") }}
                </div>
                <div
                  v-else-if="col.type === 'number'"
                  class="text-end whitespace-nowrap fw-6 fs-14"
                >
                  {{
                    getFormattedAmount(
                      planFactStore.dailyClientSalesReportTotalData?.[
                        col.key
                      ] ?? 0,
                    )
                  }}
                </div>
                <div v-else></div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
    </div>

    <div
      v-if="planFactStore.dailyClientSalesListData?.items?.length"
      class="table-content-footer"
    >
      <curren-page-btn
        :current-size="planFactStore.dailyClientSalesListParams.page_size"
        :total-count="planFactStore.dailyClientSalesListData?.total_count"
        :page-number="planFactStore.dailyClientSalesListData?.page_number"
      />
      <page-index
        :available-pages="planFactStore.dailyClientSalesListData?.total_pages"
        :current-page="planFactStore.dailyClientSalesListData?.page_number"
        @setPage="planFactStore.setDailyClientSalesListPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import moment from "moment/min/moment-with-locales";
import type { Template } from "~/interfaces/ui/template";
import { getFormattedAmount } from "~/utils/filter";

const { t } = useI18n();

const planFactStore = usePlanFactStore("main");

const columns = computed<Template[]>(() => {
  const { year, month } = planFactStore.generalParams.year_month as {
    year: number;
    month: number;
  };
  const startOfMonth = moment({ year, month: month - 1, date: 1 });
  const daysInMonth = startOfMonth.daysInMonth();

  const dayCols: Template[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const key = \`col\${startOfMonth.clone().date(day).format("YYYYMMDD")}\`;
    dayCols.push({
      name: getFormattedDate(\`\${year}-\${month}-\${day}\`, "D MMM"),
      key,
      checked: true,
      type: "number",
      right: true,
      is_sortable: false,
    });
  }

  return [
    {
      name: t("column.client_name"),
      key: "canonical_client_name",
      checked: true,
    },
    {
      name: t("column.visual_id"),
      key: "canonical_client_visual_id",
      checked: true,
    },
    {
      name: t("settings_sidebar.territory"),
      key: "territory_name",
      checked: true,
    },
    ...dayCols,
    {
      name: t("column.total_sum"),
      key: "total_sum",
      checked: true,
      type: "number",
      right: true,
      is_sortable: false,
    },
  ];
});

const onRefresh = async () => {
  await Promise.all([
    planFactStore.refreshDailyClientSalesList(),
    planFactStore.getDailyClientSalesReportTotal(),
  ]);
};
<\/script>
`;export{n as default};
