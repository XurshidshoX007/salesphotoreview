const e=`<template>
  <flex-col class="gap-7.5">
    <div class="table-content-container">
      <div class="page-content-header p-4">
        <page-title :title="t('clients.by_product_category')" />
        <FlexibleItemsMenu
          tab-mode
          :items-arr="resultValueTypes"
          :active-item-id="activeTabId"
          :is-btn-loading="ordersByAgentsStore.isByCategoryLoading"
          @onChangeActiveItem="onChangeActiveTab"
        />
      </div>
      <div class="table-content-header border-t-1">
        <table-sort-columns
          :save-key="salesCategoryReportsHeader"
          :templates="ordersByAgentsStore.byCategoryHeaders"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="ordersByAgentsStore.byCategoryHeaders"
          :save-key="salesCategoryReportsHeader"
        />
        <page-size-btn
          :current-size="ordersByAgentsStore.paramsByCategory.page_size"
          :total-count="ordersByAgentsStore.byCategoryData?.total_count"
          :page-number="ordersByAgentsStore.byCategoryData?.page_number"
          @setPageSize="ordersByAgentsStore.setPageSizeByCategory"
        />
        <search-input @change="ordersByAgentsStore.searchByCategory" />
        <excel-btn
          @click="
            ordersByAgentsStore.onDownloadByCategoryExcelOfTable(activeTabId)
          "
          :loading="ordersByAgentsStore.isByCategoryExcelFileDownloading"
        />
        <RefreshBtn
          @click="refreshData"
          :loading="ordersByAgentsStore.isByCategoryLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="ordersByAgentsStore.byCategoryHeaders"
          :loading="ordersByAgentsStore.isByCategoryLoading"
          :isEmpty="!!!ordersByAgentsStore.byCategoryData?.items?.length"
        >
          <template #body>
            <template
              v-for="(data, index) in ordersByAgentsStore.byCategoryData?.items"
              :key="index"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in ordersByAgentsStore.byCategoryHeaders"
                  :key="key"
                  :is-checked="key.checked"
                  :type="key.type"
                  class="border-r last-border-r-0"
                >
                  <div v-if="key?.id && data?.list?.length">
                    <div v-for="item in data?.list" :key="item?.key.id">
                      <div v-if="item.key.id === key.id">
                        {{ getFormattedAmount(item.value) }}
                      </div>
                    </div>
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
              v-if="ordersByAgentsStore.byCategoryData?.items?.length"
              class="b-bottom font-semibold"
            >
              <c-td-no-edit
                v-for="(header, index) in ordersByAgentsStore.byCategoryHeaders"
                :key="header.key"
                :is-checked="header.checked"
                class="border-r last-border-r-0 bg-[#FAFDFD]"
              >
                <div v-show="index === 0" class="px-2 fw-6">
                  {{ t("column.total") }}
                </div>
                <template v-for="total in totals" :key="total.value">
                  <div>
                    <div
                      v-if="total?.key?.id === header.id"
                      class="text-end fw-6"
                    >
                      {{ getFormattedAmount(total?.value) }}
                    </div>
                  </div>
                </template>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="ordersByAgentsStore.paramsByCategory.page_size"
          :total-count="ordersByAgentsStore.byCategoryData?.total_count"
          :page-number="ordersByAgentsStore.byCategoryData?.page_number"
          @setPageSize="setPageSize"
        />
        <page-index
          :available-pages="ordersByAgentsStore.byCategoryData?.total_pages"
          :current-page="ordersByAgentsStore.byCategoryData?.page_number"
          @setPage="setPage"
        />
      </div>
    </div>
  </flex-col>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { getFormattedAmount } from "~/utils/filter";
import type { ProductCategoryModel } from "~/interfaces/api/settings/product-category-model";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import { productCategoryDropdownParams } from "~/variable/params";
import type { ReportsByOrderCategoryTotalsModel } from "~/interfaces/api/reports/orders-by-agents/category-totals-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import { useI18n } from "vue-i18n";
import { salesCategoryReportsHeader } from "~/variable/column-constants";

// Store
const ordersByAgentsStore = useOrdersByAgentsStore("main");

// State
const { t } = useI18n();
const productCategories = ref<DropdownItemsModelByType<ProductCategoryModel>>();
const totals = ref<ReportsByOrderCategoryTotalsModel[]>();
const activeTabId = ref<number>(
  ordersByAgentsStore.commonParams.result_value_type || 3,
);

const productCategoryParams = ref<defaultDropdownParamsType>({
  ...productCategoryDropdownParams,
});

// hooks
const resultValueTypes = computed(() => {
  return ordersByAgentsStore.resultValueTypes || undefined;
});

watch(
  () => ordersByAgentsStore.byCategoryTotals,
  () => {
    totals.value = ordersByAgentsStore.byCategoryTotals;
  },
);

onMounted(async () => {
  await getProductCategories();
  onAddCategoriesToHeaders();
});

// methods
const onAddCategoriesToHeaders = () => {
  if (productCategories.value?.items?.length) {
    ordersByAgentsStore.byCategoryHeaders = [
      ...ordersByAgentsStore.byCategoryHeaders?.slice(0, 2),
      ...(productCategories.value?.items || []).map((item) => ({
        ...item,
        name: item.name,
        checked: true,
        key: item.id,
        id: item.id,
        type: "number",
        is_sortable: false,
        borderX: true,
      })),
    ];
  }
};

const onChangeTableHeaders = (newValue: Template[]) => {
  ordersByAgentsStore.byCategoryHeaders = newValue;
};

const onChangeActiveTab = async (tabId: number) => {
  await ordersByAgentsStore.getByCategoryData(tabId);
  activeTabId.value = tabId;
  await refreshTotals(tabId);
};

const setPageSize = (size: number) => {
  ordersByAgentsStore.paramsByCategory.page_size = size;
  ordersByAgentsStore.paramsByCategory.page = 1;
};

const setPage = (page: number) => {
  ordersByAgentsStore.paramsByCategory.page = page;
};

const getProductCategories = async () => {
  productCategories.value = await ordersByAgentsStore.getProductCategories(
    productCategoryParams.value,
  );
};

const refreshData = () => {
  ordersByAgentsStore.refreshByCategoryData();
};

const refreshTotals = async (newTabId: number) => {
  totals.value = await ordersByAgentsStore.getByCategoryTotals(newTabId);
};
<\/script>
`;export{e as default};
