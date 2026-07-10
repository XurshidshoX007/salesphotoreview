const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :templates="salesByProductReportStore.templates"
        :save-key="reportSalesByProductHeader"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn :headers="salesByProductReportStore.templates" />
      <search-input @change="salesByProductReportStore.search" />
      <excel-btn
        @click="salesByProductReportStore.onDownloadSalesByProductExcelOfTable"
        :loading="
          salesByProductReportStore.isSalesByProductExcelFileDownloading
        "
      />
      <RefreshBtn
        @click="refresh"
        :loading="salesByProductReportStore.isDataTableLoading"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="salesByProductReportStore.templates"
        :loading="salesByProductReportStore.isDataTableLoading"
        @sort="
          salesByProductReportStore.sortData(
            $event,
            filtersStore.currency?.items,
          )
        "
        :sorted="salesByProductReportStore.orderByParams"
        :is-empty="
          !salesByProductReportStore.productCategoryReportData?.categories
            ?.length
        "
      >
        <template #body>
          <template
            v-for="(data, index) in salesByProductReportStore
              ?.productCategoryReportData?.categories"
            :key="data.id"
          >
            <c-tr
              :class="
                showProduct.isActive &&
                showProduct.index === index + 1 &&
                ' bg-[#FAFDFD]'
              "
            >
              <c-td-no-edit
                class="relative"
                v-for="key in salesByProductReportStore.templates"
                :key="key"
                :type="key.type"
                :class="[
                  key.borderX && 'border-r-1',
                  data.count &&
                    key.key === 'category' &&
                    'cursor-pointer min-w-[250px]',
                ]"
                :is-checked="key.checked"
                @click="openProducts(data, key.key, data?.show_active || false)"
              >
                <div v-if="key.key === 'category'">
                  <div
                    v-if="data?.count"
                    class="text-primary-600 hover:underline flex items-center gap-x-2"
                  >
                    <IconArrowBottom
                      color="#299B9B"
                      :class="[
                        (data?.show_active && 'rotate-180 transition-all') ||
                          'rotate-0 transition-all',
                      ]"
                    />
                    {{ data[key.key]?.name }}
                    <IconLoading
                      :loading="data.loading"
                      color="#fff"
                      :width="4"
                      :height="4"
                    />
                  </div>
                  <div v-else class="text-[#000]">
                    {{ data[key.key]?.name }}
                  </div>
                </div>
                <div v-else-if="key.key === 'code'">
                  {{ data["category"]?.code }}
                </div>
                <div v-else-if="key.key === 'no'">
                  {{ index + 1 }}
                </div>
                <div v-else-if="key.key === 'ACB'">
                  {{ getFormattedAmount(data["acb"]) }}
                </div>
                <div v-else-if="key.id">
                  {{ checkCurrencyValue(key?.id, data?.list) }}
                </div>
                <div v-else-if="key.type === 'number'">
                  {{ getFormattedAmount(data[key.key]) }}
                </div>
              </c-td-no-edit>
            </c-tr>
            <template v-if="data?.show_active">
              <c-tr
                v-for="(product, chIndex) in data?.product_data"
                :key="'children' + index + chIndex"
                class="fw-4 fs-14 border-b-1 bg-[#FAFDFD]"
                :class="
                  (product?.product?.is_active && 'text-[#000]') ||
                  'text-[#D10505]'
                "
              >
                <c-td-no-edit
                  v-for="key in salesByProductReportStore.templates"
                  :key="key"
                  :class="key.borderX ? 'border-r-1' : ''"
                  :type="key.type"
                >
                  <div v-if="key.key === 'category'" class="pl-6">
                    {{ product["product"]?.name }}
                  </div>
                  <div v-else-if="key.key === 'no'">
                    {{ index + 1 }}.{{ chIndex + 1 }}
                  </div>
                  <div v-else-if="key.key === 'code'">
                    {{ product["product"]?.code }}
                  </div>
                  <div v-else-if="key.key === 'sub_code'">
                    {{ product["product"]?.sub_code }}
                  </div>
                  <div v-else-if="typeof data[key.key] === 'number'">
                    {{ getFormattedAmount(product[key.key]) }}
                  </div>
                  <div v-else-if="key.key === 'ACB'">
                    {{ getFormattedAmount(product["acb"]) }}
                  </div>
                  <div v-else-if="key.type === 'number'">
                    {{ checkCurrencyValue(key?.id, product?.list) }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </template>
        </template>
        <template
          #footer
          v-if="
            salesByProductReportStore.productCategoryReportData?.categories
              ?.length > 0
          "
        >
          <c-tr class="bg-neutral-50">
            <c-td-no-edit
              v-for="(key, index) in salesByProductReportStore.templates"
              :key="key.key"
              :is-checked="key.checked"
              :class="key.borderX && 'border-r-1 '"
            >
              <div v-if="index === 0">Итого</div>
              <div
                v-else-if="
                  typeof salesByProductReportStore.productCategoryReportData
                    ?.total[key.key] === 'number'
                "
                class="text-end whitespace-nowrap"
              >
                {{
                  getFormattedAmount(
                    salesByProductReportStore.productCategoryReportData
                      ?.total?.[key.key],
                  )
                }}
              </div>
              <div v-else-if="key.id" class="text-end">
                {{
                  checkCurrencyValue(
                    key.id,
                    salesByProductReportStore.productCategoryReportData?.total
                      .list,
                  )
                }}
              </div>
              <div v-else>
                {{
                  salesByProductReportStore.productCategoryReportData?.total?.[
                    key.key
                  ]
                }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
  </div>
</template>

<script setup>
// Stores
import { getFormattedAmount } from "../../../utils/filter";
import { useI18n } from "vue-i18n";
import { reportSalesByProductHeader } from "~/variable/column-constants";

const salesByProductReportStore = useSalesByProductsStore("main");
const filtersStore = useFiltersStore("report-sales-by-product");
const { t } = useI18n();
const props = defineProps({
  isActive: {
    type: Boolean,
    required: true,
  },
});

const showProduct = ref({
  isActive: false,
  index: 0,
});

const onChangeTableHeaders = (value) => {
  salesByProductReportStore.templates = value;
};

const checkCurrencyValue = (id, list) => {
  const checkCurrency = list?.find((item) => item.key.id === id)?.value;
  return getFormattedAmount(checkCurrency);
};

const openProducts = async (data, key, show_active) => {
  if (key === "category" && data?.count) {
    getDetailLoading(data.category.id);
    const productData =
      (data?.product_data?.length > 0 && data?.product_data) ||
      (await salesByProductReportStore.getSalesByProductReport(
        data.category.id,
      ));

    salesByProductReportStore.productCategoryReportData.categories =
      salesByProductReportStore.productCategoryReportData?.categories?.map(
        (item) => {
          if (item.category.id === data.category.id) {
            return {
              ...item,
              show_active: !show_active,
              product_data: productData,
              loading: false,
            };
          }
          return item;
        },
      );
  }
};

const getDetailLoading = (id) => {
  salesByProductReportStore.productCategoryReportData.categories =
    salesByProductReportStore.productCategoryReportData?.categories?.map(
      (item) => {
        if (item.category.id === id) {
          return {
            ...item,
            loading: true,
          };
        }
        return item;
      },
    );
};

const refresh = () => {
  salesByProductReportStore.refresh();
};

onMounted(async () => {
  await filtersStore.getCurrencies();
  salesByProductReportStore.templates = [
    ...salesByProductReportStore.templates,
    ...(filtersStore.currency?.items || []).map((item) => ({
      ...item,
      name: item.name,
      checked: true,
      key: item.id,
      type: "number",
      borderX: true,
    })),
    {
      name: t("column.total_sum"),
      checked: true,
      key: "total_cost",
      type: "number",
      is_sortable: false,
    },
  ];
});
<\/script>
`;export{e as default};
