const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :templates="supervisorProductCategoryHeaders"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn :headers="supervisorProductCategoryHeaders" />
        <page-size-btn
          :current-size="params?.page_size"
          @setPageSize="setPageSize"
        />
        <search-input @change="search" />

        <excel-btn
          :loading="supervisorByCategorySupervisorStore.isExcelFileDownloading"
          @click="
            supervisorByCategorySupervisorStore.onDownloadSupervisorExcelFile(
              commonParams,
              supervisorProductCategoryHeaders,
            )
          "
        />

        <RefreshBtn
          @click="refresh"
          :loading="supervisorByCategorySupervisorStore?.isLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="supervisorProductCategoryHeaders"
          @sort="sortData"
          :sorted="params?.order_by"
          :is-empty="!supervisorByCategorySupervisorStore.data?.items?.length"
          :loading="supervisorByCategorySupervisorStore?.isLoading"
        >
          <template #body>
            <template
              v-for="(data, index) in supervisorByCategorySupervisorStore?.data
                ?.items"
              :key="index"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in supervisorProductCategoryHeaders"
                  :key="key"
                  :is-checked="key.checked"
                  :class="key?.borderX && 'border-r-1'"
                >
                  <div v-if="key.key === 'supervisor'">
                    {{ data["supervisor"]?.name }}
                  </div>
                  <div v-else-if="key?.id" class="text-end">
                    {{ getProductCategoryValue(key.id, data?.list) }}
                  </div>
                  <div
                    v-else-if="typeof data[key.key] === 'number'"
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
          <template #footer>
            <c-tr
              v-if="supervisorByCategorySupervisorStore.data?.items?.length"
              class="bg-neutral-50"
            >
              <c-td-no-edit
                v-for="key in supervisorProductCategoryHeaders"
                :key="key.name"
                :is-checked="key.checked"
                :class="key.borderX && 'border-r-1'"
              >
                <div v-if="key?.id" class="fw-6 fs-14 text-end">
                  {{
                    getProductCategoryValue(
                      key?.id,
                      supervisorByCategorySupervisorStore.dataTotal?.list,
                    )
                  }}
                </div>
                <div
                  v-else-if="
                    typeof supervisorByCategorySupervisorStore.dataTotal[
                      key.key
                    ] === 'number'
                  "
                  class="fw-6 fs-14 text-end"
                >
                  {{
                    getFormattedAmount(
                      supervisorByCategorySupervisorStore?.dataTotal?.[key.key],
                    )
                  }}
                </div>
                <div v-else-if="key.key === 'supervisor'">
                  {{ t("column.total") }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div
        v-if="supervisorByCategorySupervisorStore?.data?.items?.length > 0"
        class="table-content-footer"
      >
        <curren-page-btn
          :current-size="params?.page_size"
          :page-number="supervisorByCategorySupervisorStore?.data?.page_number"
          :total-count="supervisorByCategorySupervisorStore?.data?.total_count"
        />
        <page-index
          :available-pages="
            supervisorByCategorySupervisorStore?.data?.total_pages
          "
          :current-page="supervisorByCategorySupervisorStore?.data?.page_number"
          @setPage="setPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getFormattedAmount } from "~/utils/filter";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import { defaultDropdownParams } from "~/variable/params";
import type { Template } from "~/interfaces/ui/template";
import { dashboardPageSizeConst } from "~/variable/column-constants";
// store
const supervisorByCategorySupervisorStore =
  useSupervisorByCategorySupervisorStore("main");

//props
const props = defineProps({
  params: Object,
  productCategory: Array,
  result_value_type: Number,
});

// emit

const emit = defineEmits(["getTableLoading"]);
// State
const isDataFetching = ref(false);
const { t } = useI18n();
const productCategoryParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});
let params = reactive({
  page: 1,
  page_size: getPageSizeByKey(dashboardPageSizeConst) || 10,
  search: null,
  order_by: {
    field: "supervisor",
    is_asc: true,
  },
  result_value_type: props.result_value_type,
});
// methods

const refresh = () => {
  getData();
};

const onChangeTableHeaders = (newValue: Template[]) => {
  supervisorByCategorySupervisorStore.headers = newValue;
};

const supervisorProductCategoryHeaders = computed(() => {
  const { productCategory, headers } = supervisorByCategorySupervisorStore;

  if (productCategory?.items?.length) {
    return [
      ...(headers?.slice(0, 1) || []), // Keep the first header, if exists
      checkTotal.value, // Add the checkTotal value
      ...productCategory?.items.map((item, index) => ({
        ...item,
        checked: true,
        key: item.id,
        right: true,
        is_sortable: false,
        borderX: index + 1 !== productCategory?.items.length, // Add border unless it's the last item
      })),
    ];
  }
  return headers; // Return headers if no items exist
});

const checkTotal = computed(() => {
  const checkConst = supervisorByCategorySupervisorStore.resultValueTypes?.find(
    (item) => item.id === props.result_value_type,
  )?.name;
  let a = {
    name: checkConst,
    checked: true,
    key: returnTotalKey(),
    borderX: true,
    is_sortable: false,
    right: true,
    infoTooltip: t("labels.total_number_orders_excluded_by_status"),
  };
  return a;
});

onMounted(async () => {
  if (props.productCategory) {
    supervisorByCategorySupervisorStore.productCategory = props.productCategory;
  } else {
    supervisorByCategorySupervisorStore.productCategory =
      await supervisorByCategorySupervisorStore.getProductCategories(
        productCategoryParams.value,
      );
  }
  await supervisorByCategorySupervisorStore.getResultValueTypes();
});

watch(
  () => props.result_value_type,
  (newValue) => {
    if (newValue !== undefined) {
      params.result_value_type = newValue;
    }
  },
);

const getProductCategoryValue = (categoryId: string, list: any) => {
  const checkValue = list?.find((item) => item.key.id === categoryId)?.value;
  return getFormattedAmount(checkValue);
};

const returnTotalKey = () => {
  switch (props.result_value_type) {
    case 1:
      return "total_acb";
    case 2:
      return "total_product_volume";
    case 3:
      return "total_cost";
    case 4:
      return "total_product_amount";
  }
};

const getData = async () => {
  await supervisorByCategorySupervisorStore.refresh(commonParams.value);
};

const setPage = (page: number) => {
  params.page = page;
};

const setPageSize = (pageSize: number) => {
  setPageSizeByKey(dashboardPageSizeConst, pageSize);
  params.page_size = pageSize;
  params.page = 1;
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

watch(params, async () => {
  await supervisorByCategorySupervisorStore._loadData(commonParams.value);
});

onMounted(async () => {
  if (!isDataFetching.value) {
    isDataFetching.value = true;
    try {
      if (!supervisorByCategorySupervisorStore.data?.items?.length) {
        await getData();
      }
    } finally {
      isDataFetching.value = false;
    }
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

watch(
  () => supervisorByCategorySupervisorStore.isLoading,
  async (newParams, oldParams) => {
    emit("getTableLoading", supervisorByCategorySupervisorStore.isLoading);
  },
);

const commonParams = computed(() => {
  return { ...props.params, ...params };
});
<\/script>
`;export{e as default};
