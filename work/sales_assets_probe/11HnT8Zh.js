const n=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <page-size-btn
          :current-size="params?.page_size"
          @setPageSize="setPageSize"
        />
        <search-input @change="search" />

        <excel-btn />

        <RefreshBtn
          @click="refresh"
          :loading="dashboardDailyReportStore?.isLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :is-empty="!dashboardDailyReportStore.data?.items?.length"
          :loading="dashboardDailyReportStore?.isLoading"
        >
          <template #header>
            <c-tr>
              <c-td-no-edit
                rowspan="4"
                class="border-r-1 bg-neutral-50 border-color-[#E1E4E4] hover:bg-transparent"
              >
                <order-by-universal
                  :name="t('users.agents.agent')"
                  propsKey="agent"
                  @sort="sortData"
                  :sorted="params?.order_by"
                />
              </c-td-no-edit>
              <c-td-no-edit
                colspan="9"
                class="bg-[#dff0d8] border-r-1 pointer-events-none"
              >
                {{ t("dashboard.according_to_plan") }}
              </c-td-no-edit>
              <c-td-no-edit
                colspan="7"
                class="bg-[#f2dede] pointer-events-none"
              >
                {{ t("dashboard.off_plane") }}
              </c-td-no-edit>
            </c-tr>
            <c-tr class="bg-neutral-50">
              <c-td-no-edit rowspan="3" class="border-r-1">
                <order-by-universal
                  :name="t('column.plan')"
                  propsKey="planned_required_visits_count"
                  @sort="sortData"
                  :sorted="params?.order_by"
                />
              </c-td-no-edit>
              <c-td-no-edit rowspan="3" class="border-r-1">
                <order-by-universal
                  :name="t('column.visited')"
                  propsKey="planned_visits_count"
                  @sort="sortData"
                  :sorted="params?.order_by"
                />
              </c-td-no-edit>
              <c-td-no-edit rowspan="3" class="border-r-1">
                <order-by-universal
                  :name="t('column.unvisited')"
                  propsKey="planned_not_visited_count"
                  @sort="sortData"
                  :sorted="params?.order_by"
                />
              </c-td-no-edit>
              <c-td-no-edit colspan="3" class="border-r-1">
                {{ t("column.visited") }}
              </c-td-no-edit>
              <c-td-no-edit colspan="2" class="border-r-1">
                {{ t("column.unvisited") }}
              </c-td-no-edit>
              <c-td-no-edit rowspan="3" class="border-r-1">
                <order-by-universal
                  :name="t('column.photo')"
                  propsKey="planned_uploaded_photo_report_count"
                  @sort="sortData"
                  :sorted="params?.order_by"
                />
              </c-td-no-edit>
              <c-td-no-edit rowspan="3" class="border-r-1">
                <order-by-universal
                  :name="t('column.visited')"
                  propsKey="not_planned_visits_count"
                  @sort="sortData"
                  :sorted="params?.order_by"
                />
              </c-td-no-edit>
              <c-td-no-edit colspan="3" class="border-r-1">
                {{ t("column.visited") }}
              </c-td-no-edit>
              <c-td-no-edit colspan="2" class="border-r-1">
                {{ t("column.unvisited") }}
              </c-td-no-edit>
              <c-td-no-edit rowspan="3">
                <order-by-universal
                  :name="t('column.photo')"
                  propsKey="not_planned_uploaded_photo_report_count"
                  @sort="sortData"
                  :sorted="order_by"
                />
              </c-td-no-edit>
            </c-tr>
            <c-tr class="bg-neutral-50">
              <c-td-no-edit colspan="2" class="border-r-1">
                {{ t("column.order") }}
              </c-td-no-edit>
              <c-td-no-edit rowspan="2" class="border-r-1">
                <order-by-universal
                  :name="t('column.no_order')"
                  propsKey="count_of_planned_visits_without_orders"
                  @sort="sortData"
                  :sorted="params?.order_by"
                />
              </c-td-no-edit>
              <c-td-no-edit colspan="2" class="border-r-1">
                {{ t("column.order") }}
              </c-td-no-edit>
              <c-td-no-edit colspan="2" class="border-r-1">
                {{ t("column.order") }}
              </c-td-no-edit>
              <c-td-no-edit rowspan="2" class="border-r-1">
                <order-by-universal
                  :name="t('column.no_order')"
                  propsKey="count_of_not_planned_visits_without_orders"
                  @sort="sortData"
                  :sorted="params?.order_by"
                />
              </c-td-no-edit>
              <c-td-no-edit colspan="2" class="border-r-1">
                {{ t("column.order") }}
              </c-td-no-edit>
            </c-tr>
            <c-tr class="bg-neutral-50">
              <c-td-no-edit class="border-r-1">
                <order-by-universal
                  :name="t('column.sum')"
                  propsKey="planned_order_total_cost"
                  @sort="sortData"
                  :sorted="params.order_by"
                />
              </c-td-no-edit>
              <c-td-no-edit class="border-r-1">
                <order-by-universal
                  :name="t('settings.count')"
                  propsKey="planned_order_count"
                  @sort="sortData"
                  :sorted="params?.order_by"
                />
              </c-td-no-edit>
              <c-td-no-edit class="border-r-1">
                <order-by-universal
                  :name="t('column.sum')"
                  propsKey="planned_not_visited_order_amount"
                  @sort="sortData"
                  :sorted="params?.order_by"
                />
              </c-td-no-edit>
              <c-td-no-edit class="border-r-1">
                <order-by-universal
                  :name="t('settings.count')"
                  propsKey="planned_not_visited_order_count"
                  @sort="sortData"
                  :sorted="params?.order_by"
                />
              </c-td-no-edit>
              <c-td-no-edit class="border-r-1">
                <order-by-universal
                  :name="t('column.sum')"
                  propsKey="planned_order_total_cost"
                  @sort="sortData"
                  :sorted="params.order_by"
                />
              </c-td-no-edit>
              <c-td-no-edit class="border-r-1">
                <order-by-universal
                  :name="t('settings.count')"
                  propsKey="planned_order_count"
                  @sort="sortData"
                  :sorted="params?.order_by"
                />
              </c-td-no-edit>
              <c-td-no-edit class="border-r-1">
                <order-by-universal
                  :name="t('column.sum')"
                  propsKey="not_planned_not_visited_order_amount"
                  @sort="sortData"
                  :sorted="params?.order_by"
                />
              </c-td-no-edit>
              <c-td-no-edit class="border-r-1">
                <order-by-universal
                  :name="t('settings.count')"
                  propsKey="not_planned_not_visited_order_count"
                  @sort="sortData"
                  :sorted="params?.order_by"
                />
              </c-td-no-edit>
            </c-tr>
          </template>
          <template #body>
            <template
              v-for="(data, index) in dashboardDailyReportStore?.data?.items"
              :key="index"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in dashboardDailyReportStore?.headers"
                  :key="key"
                  :is-checked="key.checked"
                  :class="key.borderX && 'border-r-1'"
                >
                  <div v-if="key.key === 'agent'">
                    {{ data["agent"]?.name }}
                  </div>
                  <div v-else-if="key?.category === 'planned'" class="text-end">
                    <div v-if="key.type === 'total_amount'">
                      {{
                        getFormattedAmount(data["planned"][key.type]?.amount)
                      }}
                    </div>
                    <div v-else>
                      {{ getFormattedAmount(data[key.category][key.type]) }}
                    </div>
                  </div>
                  <div
                    v-else-if="key?.category === 'not_planned'"
                    class="text-end"
                  >
                    <div v-if="key.type === 'total_amount'">
                      {{
                        getFormattedAmount(
                          data["not_planned"][key.type]?.amount
                        )
                      }}
                    </div>
                    <div v-else>
                      {{ getFormattedAmount(data[key.category][key.type]) }}
                    </div>
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </template>
          <template #footer>
            <c-tr
              v-if="dashboardDailyReportStore.dataTotal"
              class="border-b-1 bg-neutral-50"
            >
              <c-td-no-edit
                v-for="key in dashboardDailyReportStore?.headers"
                :key="key"
                :is-checked="key.checked"
                :class="key.borderX && 'border-r-1'"
                class="fw-6"
              >
                <div v-if="key.key === 'agent'">
                  {{ t("column.total") }}
                </div>
                <div v-else-if="key?.category === 'planned'" class="text-end">
                  <div v-if="key.type === 'total_amount'">
                    {{
                      getFormattedAmount(
                        dashboardDailyReportStore.dataTotal["planned"][key.type]
                          ?.amount
                      )
                    }}
                  </div>
                  <div v-else>
                    {{
                      getFormattedAmount(
                        dashboardDailyReportStore.dataTotal[key.category][
                          key.type
                        ]
                      )
                    }}
                  </div>
                </div>
                <div
                  v-else-if="key?.category === 'not_planned'"
                  class="text-end"
                >
                  <div v-if="key.type === 'total_amount'">
                    {{
                      getFormattedAmount(
                        dashboardDailyReportStore.dataTotal["not_planned"][
                          key.type
                        ]?.amount
                      )
                    }}
                  </div>
                  <div v-else>
                    {{
                      getFormattedAmount(
                        dashboardDailyReportStore.dataTotal[key.category][
                          key.type
                        ]
                      )
                    }}
                  </div>
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="params?.page_size"
          :page-number="dashboardDailyReportStore?.data?.page_number"
          :total-count="dashboardDailyReportStore?.data?.total_count"
        />
        <page-index
          :available-pages="dashboardDailyReportStore?.data?.total_pages"
          :current-page="dashboardDailyReportStore?.data?.page_number"
          @setPage="setPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";
import { dashboardPageSizeConst } from "~/variable/column-constants";
//props
const props = defineProps({
  params: Object,
  isActive: Boolean,
});

// store
const dashboardDailyReportStore = useDashboardDailyVisitReportStore("main");
// State
const isDataFetching = ref(false);
const { t } = useI18n();
let params = reactive({
  page: 1,
  page_size: getPageSizeByKey(dashboardPageSizeConst) || 10,
  search: null,
  order_by: {
    field: "agent",
    is_asc: true,
  },
});

// methods

const refresh = async () => {
  await getData();
};

const getData = async () => {
  await dashboardDailyReportStore.refresh({ ...props.params, ...params });
};

const setPage = (page: number) => {
  params.page = page;
};

const setPageSize = (pageSize: number) => {
  params.page = 1;
  params.page_size = pageSize;
  setPageSizeByKey(dashboardPageSizeConst, pageSize);
};

const sortData = (
  newValue: Record<"field" | "is_asc", boolean | string | undefined>
) => {
  params.order_by = newValue;
};

const search = (value: string) => {
  params.page = 1;
  params.search = value;
};

watch(params, async () => {
  await dashboardDailyReportStore._loadData({ ...props.params, ...params });
});

watch(
  () => props.params,
  async (newParams, oldParams) => {
    if (newParams) {
      if (!isDataFetching.value) {
        isDataFetching.value = true;
        try {
          await getData();
        } finally {
          isDataFetching.value = false;
        }
      }
    }
  },
  { deep: true }
);

onMounted(async () => {
  if (props.params) {
    await getData();
  }
});
<\/script>
`;export{n as default};
