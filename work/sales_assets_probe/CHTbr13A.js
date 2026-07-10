const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :templates="dashboardSupervisorStore?.headers"
          :save-key="dashboardSupervisorsHeader"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="dashboardSupervisorStore?.headers"
          :save-key="dashboardSupervisorsHeader"
        />
        <page-size-btn
          :current-size="params?.page_size"
          @setPageSize="setPageSize"
        />
        <search-input @change="search" />

        <excel-btn @click="onDownloadExcelFile" :loading="isExcelFileLoading" />

        <RefreshBtn
          @click="refresh"
          :loading="dashboardSupervisorStore?.isLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :is-empty="!dashboardSupervisorStore.data?.items?.length"
          :loading="dashboardSupervisorStore?.isLoading"
          :headers="dashboardSupervisorStore?.headers"
          :sorted="params?.order_by"
          @sort="sortData"
        >
          <template #body>
            <template
              v-for="data in dashboardSupervisorStore?.data?.items"
              :key="data.id"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in dashboardSupervisorStore?.headers"
                  :key="key.key"
                  :is-checked="key.checked"
                  :type="key.type"
                >
                  <div v-if="key.key === 'supervisor'">
                    {{
                      data["supervisor"]?.name ||
                      t("column.agents_without_supervisor")
                    }}
                  </div>
                  <div v-else-if="key.type === 'number'">
                    {{ getFormattedAmount(data[key.key]?.toFixed(1)) }}
                  </div>
                  <div v-else-if="key.key === 'total_amount'" class="text-end">
                    {{ getFormattedAmount(data[key.key]?.amount) }}
                  </div>
                  <div v-else>
                    {{ data[key.key] }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </template>
          <template #footer>
            <tr
              v-if="!!dashboardSupervisorStore.data?.items.length"
              class="border-b-1 bg-neutral-50"
            >
              <c-td-no-edit
                v-for="total in dashboardSupervisorStore.headers"
                :is-checked="total.checked"
              >
                <div
                  v-if="total.key === 'total_amount'"
                  class="fs-14 fw-6 text-black text-end"
                >
                  {{
                    getFormattedAmount(
                      dashboardSupervisorStore.dataTotal?.[total.key]?.amount,
                    )
                  }}
                </div>
                <div
                  v-else-if="total.key === 'supervisor'"
                  class="fs-14 fw-6 text-black"
                >
                  Общий
                </div>
                <div v-else class="fs-14 fw-6 text-black text-end">
                  {{
                    getFormattedAmount(
                      dashboardSupervisorStore.dataTotal?.[total.key],
                    )
                  }}
                </div>
              </c-td-no-edit>
            </tr>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="params?.page_size"
          :page-number="dashboardSupervisorStore?.data?.page_number"
          :total-count="dashboardSupervisorStore?.data?.total_count"
        />
        <page-index
          :available-pages="dashboardSupervisorStore?.data?.total_pages"
          :current-page="dashboardSupervisorStore?.data?.page_number"
          @setPage="setPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getFormattedAmount } from "~/utils/filter";
import type { UnwrapNestedRefs } from "@vue/reactivity";
import type { ListParams } from "~/interfaces/api/params/list-parameters";
import {
  dashboardPageSizeConst,
  dashboardSupervisorsHeader,
} from "~/variable/column-constants";
import { useI18n } from "vue-i18n";

// store
const dashboardSupervisorStore = useDashboardSupervisorStore("main");

//props
const props = defineProps({
  params: Object,
});

// State
const { t } = useI18n();
const isDataFetching = ref(false);
const isExcelFileLoading = ref<boolean>(false);

const params: UnwrapNestedRefs<ListParams> = reactive({
  page: 1,
  page_size: getPageSizeByKey(dashboardPageSizeConst) || 10,
  search: null,
  order_by: {
    field: "supervisor",
    is_asc: true,
  },
});
// methods

const refresh = async () => {
  await getData();
};

const getData = async () => {
  await dashboardSupervisorStore.refresh({ ...props.params, ...params });
};

const setPage = (page: number) => {
  params.page = page;
};

const setPageSize = (pageSize: number) => {
  setPageSizeByKey(dashboardPageSizeConst, pageSize);
  params.page = 1;
  params.page_size = pageSize;
};

const sortData = (
  newValue: Record<"field" | "is_asc", boolean | string | undefined>,
) => {
  params.order_by = newValue;
};

const search = (value: string) => {
  params.page = 1;
  params.search = value;
};

const onChangeTableHeaders = (newValue) => {
  dashboardSupervisorStore.headers = newValue;
};

watch(params, async () => {
  await dashboardSupervisorStore._loadData({ ...props.params, ...params });
});

onMounted(async () => {
  if (props.params) {
    await getData();
  }
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
  { deep: true },
);

const onDownloadExcelFile = async () => {
  isExcelFileLoading.value = true;
  await dashboardSupervisorStore.onDownloadSupervisorExcelFile({
    ...props.params,
    ...params,
  });
  isExcelFileLoading.value = false;
};
<\/script>
`;export{e as default};
