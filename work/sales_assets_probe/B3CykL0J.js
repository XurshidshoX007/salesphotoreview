const e=`<template>
  <flex-col class="page-gap">
    <div class="table-content-container">
      <div class="page-content-header p-4">
        <page-title :title="t('reports.by_product_segment')" />
        <FlexibleItemsMenu
          tab-mode
          :items-arr="resultValueTypes"
          :active-item-id="activeTabId"
          :is-btn-loading="ordersByAgentsStore.isReportSegmentLoading"
          @onChangeActiveItem="onChangeActiveTab"
        />
      </div>
      <div class="table-content-header border-t-1">
        <table-sort-columns
          :save-key="reportsCustomerSegmentProductHeader"
          :templates="ordersByAgentsStore.bySegmentProductHeaders"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="ordersByAgentsStore.bySegmentProductHeaders"
          :save-key="reportsCustomerSegmentProductHeader"
        />
        <page-size-btn
          :current-size="pageSize"
          :total-count="ordersByAgentsStore.byGroupProductData?.length"
          :page-number="pageNumber"
          @setPageSize="setPageSize"
        />
        <search-input @change="searchValue = $event" />
        <excel-btn
          @click="
            ordersByAgentsStore.onDownloadBySegmentExcelOfTable(activeTabId)
          "
          :loading="ordersByAgentsStore.isBySegmentExcelFileDownloading"
        />
        <RefreshBtn
          @click="refresh"
          :loading="ordersByAgentsStore.isGroupCategoryLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="ordersByAgentsStore.bySegmentProductHeaders"
          :loading="ordersByAgentsStore.isReportSegmentLoading"
          :isEmpty="isTableEmpty"
        >
          <template #body>
            <template v-for="(data, index) in paginatedData" :key="index">
              <c-tr>
                <c-td-no-edit
                  v-for="key in ordersByAgentsStore.bySegmentProductHeaders"
                  :key="key"
                  :is-checked="key.checked"
                  :type="key.type"
                  class="border-r last-border-r-0"
                >
                  <div v-if="key.key === 'category' && data?.list?.length">
                    <div v-for="item in data?.list" :key="item?.key.id">
                      <div v-if="item.key.id === key.id">
                        {{ getFormattedAmount(item.value) }}
                      </div>
                    </div>
                  </div>
                  <div v-else-if="key.key === 'null'">
                    {{
                      getFormattedAmount(
                        data?.list?.find((a) => a.key.id === null)?.value,
                      )
                    }}
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
      <div v-if="paginatedData?.length" class="table-content-footer">
        <curren-page-btn
          :current-size="pageSize"
          :total-count="ordersByAgentsStore.byGroupProductData?.length"
          :page-number="pageNumber"
          @setPageSize="setPageSize"
        />
        <page-index
          :available-pages="totalPages"
          :current-page="currentPage"
          @setPage="setPage"
        />
      </div>
    </div>
  </flex-col>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { ProductGroupsModel } from "~/interfaces/api/settings/product-groups-model";
import { getFormattedAmount } from "~/utils/filter";
import { defaultDropdownParams } from "~/variable/params";
import { useI18n } from "vue-i18n";
import { reportsCustomerSegmentProductHeader } from "~/variable/column-constants";

// Store
const ordersByAgentsStore = useOrdersByAgentsStore("main");

// State
const { t } = useI18n();
const productSegments = ref<DropdownItemsModelByType<ProductGroupsModel>>();
const activeTabId = ref<number>(
  ordersByAgentsStore.tableForSegmentParams.result_value_type || 3,
);
const pageSize = ref<number>(10);
const pageNumber = ref<number>(1);
const currentPage = ref<number>(1);
const searchValue = ref<string>();

const productSegmentParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});

// hooks
const resultValueTypes = computed(() => {
  return ordersByAgentsStore.resultValueTypes || undefined;
});

const isTableEmpty = computed(
  () => !!!ordersByAgentsStore.bySegmentData?.length,
);

const totalPages = computed(() => {
  const totalItems = ordersByAgentsStore.bySegmentData?.length || 0;
  return Math.ceil(totalItems / pageSize.value);
});

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  if (!searchValue.value) {
    return ordersByAgentsStore.bySegmentData?.slice(start, end) || [];
  } else {
    currentPage.value = 1;
    return (
      ordersByAgentsStore.bySegmentData?.filter((data) => {
        return (
          data.agent_name
            .toLowerCase()
            .includes(searchValue.value!.toLowerCase()) ||
          data.list.some((item) =>
            item.value
              .toString()
              .toLowerCase()
              .includes(searchValue.value!.toLowerCase()),
          )
        );
      }) || []
    );
  }
});

onMounted(async () => {
  await getProductSegments();
  onAddGroupsToHeaders();
});

// methods
const onAddGroupsToHeaders = () => {
  if (productSegments.value?.items?.length) {
    ordersByAgentsStore.bySegmentProductHeaders = [
      ...ordersByAgentsStore.bySegmentProductHeaders?.slice(0, 2),
      ...(productSegments.value?.items || []).map((item) => ({
        ...item,
        name: item.name,
        checked: true,
        key: "category",
        type: "number",
        is_sortable: false,
        borderX: true,
      })),
    ];
  }
};

const onChangeTableHeaders = (newValue: Template[]) => {
  ordersByAgentsStore.bySegmentProductHeaders = newValue;
};

const onChangeActiveTab = async (tabId: number) => {
  await ordersByAgentsStore.getBySegmentData(tabId);
  activeTabId.value = tabId;
};

const setPageSize = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1; // Reset to the first page when changing page size
};

const setPage = (page: number) => {
  currentPage.value = page;
};

const getProductSegments = async () => {
  productSegments.value = await ordersByAgentsStore.getProductSegments(
    productSegmentParams.value,
  );
};

const refresh = () => {
  ordersByAgentsStore.refreshBySegmentProductData();
};
<\/script>
`;export{e as default};
