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
          :loading="supervisorByProductCategoryStore.isExcelFileDownloading"
          @click="
            supervisorByProductCategoryStore.onDownloadSupervisorExcelFile(
              commonParams,
              supervisorProductCategoryHeaders,
            )
          "
        />

        <RefreshBtn
          @click="refresh"
          :loading="supervisorByProductCategoryStore?.isLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="supervisorProductCategoryHeaders"
          @sort="sortData"
          :sorted="params?.order_by"
          :is-empty="!supervisorByProductCategoryStore.data?.items?.length"
          :loading="supervisorByProductCategoryStore?.isLoading"
        >
          <template #body>
            <template
              v-for="(data, index) in (
                supervisorByProductCategoryStore?.data?.items ?? []
              ).filter(Boolean)"
              :key="index"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in supervisorProductCategoryHeaders"
                  :key="key.key"
                  :is-checked="key.checked"
                  :class="key?.borderX && 'border-r-1'"
                >
                  <div v-if="key.key === 'agent'">
                    {{ data?.agent?.name }}
                  </div>
                  <div v-else-if="key?.id" class="text-end">
                    {{ getProductCategoryValue(key.id, data?.list) }}
                  </div>
                  <div
                    v-else-if="typeof data?.[key.key] === 'number'"
                    class="text-end"
                  >
                    {{ getFormattedAmount(data?.[key.key]) }}
                  </div>
                  <div v-else>
                    {{ data?.[key.key] }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </template>
          <template #footer>
            <c-tr
              v-if="supervisorByProductCategoryStore.data?.items?.length"
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
                      supervisorByProductCategoryStore.dataTotal?.list,
                    )
                  }}
                </div>
                <div
                  v-else-if="
                    typeof supervisorByProductCategoryStore.dataTotal?.[
                      key.key
                    ] === 'number'
                  "
                  class="fw-6 fs-14 text-end"
                >
                  {{
                    getFormattedAmount(
                      supervisorByProductCategoryStore.dataTotal?.[key.key],
                    )
                  }}
                </div>
                <div v-else-if="key.key === 'agent'">
                  {{ t("column.total") }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div
        v-if="
          (supervisorByProductCategoryStore?.data?.items ?? []).filter(Boolean)
            .length > 0
        "
        class="table-content-footer"
      >
        <curren-page-btn
          :current-size="params?.page_size"
          :page-number="supervisorByProductCategoryStore?.data?.page_number"
          :total-count="supervisorByProductCategoryStore?.data?.total_count"
        />
        <page-index
          :available-pages="supervisorByProductCategoryStore?.data?.total_pages"
          :current-page="supervisorByProductCategoryStore?.data?.page_number"
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
import { productCategoryDropdownParams } from "~/variable/params";
import { dashboardPageSizeConst } from "~/variable/column-constants";
// store
const supervisorByProductCategoryStore =
  useSupervisorByProductCategoryStore("main");
//props
const props = defineProps({
  params: Object,
  isActive: Boolean,
  resultValueType: Number,
});
// emit

const emit = defineEmits(["getTableLoading"]);

// State
const { t } = useI18n();
const productCategoryParams = ref<defaultDropdownParamsType>({
  ...productCategoryDropdownParams,
});
const isDataFetching = ref(false);
let params = reactive({
  page: 1,
  page_size: getPageSizeByKey(dashboardPageSizeConst) || 10,
  search: null,
  order_by: {
    field: "agent",
    is_asc: true,
  },
  result_value_type: supervisorByProductCategoryStore.result_value_type,
});
// methods

const refresh = () => {
  getData();
};
const onChangeTableHeaders = (newValue) => {
  supervisorByProductCategoryStore.headers = newValue;
};

const supervisorProductCategoryHeaders = computed(() => {
  const { productCategories, headers } = supervisorByProductCategoryStore;

  if (productCategories?.items?.length) {
    // Create a new headers array, avoiding mutation
    const newHeaders = [
      ...(headers?.slice(0, 1) || []), // Keep the first header, if exists
      additionalColumn.value, // Add the checkTotal value
      ...productCategories?.items.map((item, index) => ({
        ...item,
        checked: true,
        key: item.id,
        is_sortable: false,
        right: true,
        borderX: index + 1 !== productCategories?.items.length, // Add border unless it's the last item
      })),
    ];

    return newHeaders; // Return the newly generated headers
  }

  return headers || []; // Return existing headers, or an empty array if no headers are found
});

const additionalColumn = computed(() => {
  const checkConstFilterName =
    supervisorByProductCategoryStore.resultValueTypes?.find(
      (item) => item.id === supervisorByProductCategoryStore.result_value_type,
    )?.name;
  let a = {
    name: checkConstFilterName,
    checked: true,
    key: returnTotalColumnKey(),
    borderX: true,
    is_sortable: false,
    right: true,
  };
  return a;
});

onMounted(async () => {
  supervisorByProductCategoryStore.productCategories =
    await supervisorByProductCategoryStore.getProductCategories(
      productCategoryParams.value,
    );
});

const getProductCategoryValue = (categoryId: string, list: any) => {
  const checkValue = list?.find((item) => item.key.id === categoryId)?.value;
  return getFormattedAmount(checkValue);
};

const returnTotalColumnKey = () => {
  switch (supervisorByProductCategoryStore.result_value_type) {
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
  await supervisorByProductCategoryStore.refresh(
    commonParams.value,
    props.params,
  );
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

watch(params, async () => {
  await supervisorByProductCategoryStore._loadData(commonParams.value);
});

watch(
  () => props.resultValueType,
  (newValue) => {
    if (newValue !== undefined) {
      params.result_value_type = newValue;
    }
  },
);

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

onMounted(async () => {
  if (props.isActive) {
    await getData();
  }
});

watch(
  () => supervisorByProductCategoryStore.isLoading,
  async (newParams, oldParams) => {
    emit("getTableLoading", supervisorByProductCategoryStore.isLoading);
  },
);

const commonParams = computed(() => {
  return { ...props.params, ...params };
});
<\/script>
`;export{e as default};
