const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="suggestionByCreatorHeader"
          :templates="templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="templates"
          :save-key="suggestionByCreatorHeader"
        />
        <page-size-btn
          :current-size="params.page_size"
          @setPageSize="setPageSize"
        />
        <search-input @change="onSearch" :value="params.search || ''" />
        <excel-btn @click="onDownloadExcelFile" :loading="isExcelDownloading" />
        <RefreshBtn @click="getData" :loading="isLoading" />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="headers"
          :sorted="params.order_by"
          :loading="isLoading"
          :is-empty="!data?.items.length"
          @sort="sortData"
        >
          <template #body>
            <c-tr v-for="data in data?.items" :key="data?.created_by?.id">
              <c-td-no-edit
                v-for="key in headers"
                :key="key.key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.type === 'number'" class="text-end">
                  {{ getFormattedAmount(data[key.key]) }}
                </div>
                <div v-else-if="key.type === 'products'" class="text-end">
                  <div v-for="product in data.list" :key="product.key.id">
                    <div v-if="key.key === product.key.id">
                      {{ product.value }}
                    </div>
                  </div>
                </div>
                <div v-else-if="key.type === 'array'">
                  <show-more :show-count="1" :data="data[key.key]" />
                </div>
                <div v-else-if="key.key === 'created_by.name'">
                  {{ getNestedValue(data, key.key) }}
                </div>
                <div v-else-if="key.key === 'created_by.code'">
                  {{ getNestedValue(data, key.key) }}
                </div>
                <div v-else-if="key.type === 'created_by_role'">
                  {{ getSuggestionRole(data.created_by_role) }}
                </div>
                <div v-else-if="key.type === 'boolean'">
                  {{ data[key.key] ? t("filters.yes") : t("filters.no") }}
                </div>
                <div v-else>
                  {{ data[key.key] }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="params.page_size"
          :total-count="data?.total_count"
          :page-number="data?.page_number"
        />
        <page-index
          :available-pages="data?.total_pages"
          :current-page="data?.page_number"
          @setPage="setPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import {
  ordersPageSizeConst,
  settingsPageSizeConst,
  suggestionByCreatorHeader,
} from "~/variable/column-constants";
import { OrderEventKeys } from "~/variable/event-key-constants";

import { getFormattedAmount } from "~/utils/filter";
import { getNestedValue } from "~/utils/helpers";
import { useSuggestionStore } from "~/stores/orders/suggestion/suggestion.store";
import { useEventBus } from "~/composables/EventBus/eventBus";

import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { ProductsModel } from "~/interfaces/api/settings/products-model";
import type { Template } from "~/interfaces/ui/template";
import type { SuggestionByCreatorListModel } from "~/interfaces/api/orders/suggestion/suggestion-model";
import type { AppResponse } from "~/interfaces/api/response/app-response";
import type { ListParams } from "~/interfaces/api/params/list-parameters";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// Store
const suggestionStore = useSuggestionStore("main");

// State
const eventBus = useEventBus();
const { t } = useI18n();

const updateListEventKey = OrderEventKeys.SUGGESTION_TABLE_UPDATE;
const isExcelDownloading = ref(false);
const isLoading = ref(false);
const isRefreshData = ref(false);

const params = reactive<Omit<ListParams, "filter">>({
  page: 1,
  page_size: getPageSizeByKey(ordersPageSizeConst) || 10,
  search: null,
  order_by: null,
});

const products = ref<DropdownItemsModelByType<ProductsModel>>();
const data = ref<AppResponse<SuggestionByCreatorListModel>>();
const templates = ref<Template[]>(
  getCheckedItemsByKey(suggestionByCreatorHeader) || [
    {
      name: t("column.sender_code"),
      key: "created_by.code",
      type: "object",
      checked: true,
    },
    {
      name: t("column.sender_name"),
      key: "created_by.name",
      type: "object",
      checked: true,
    },
    {
      name: t("column.role_the_sender"),
      key: "created_by_role",
      type: "created_by_role",
      checked: true,
    },
    {
      name: t("column.order_price"),
      key: "order_cost",
      checked: true,
      type: "number",
    },
    {
      name: t("column.order_count"),
      key: "order_count",
      checked: true,
      type: "number",
    },
  ],
);

const headers = computed(() => {
  const productIds = Object.keys(
    data.value?.items.reduce(
      (acc, item) => {
        if (item.list) {
          item.list.forEach((product) => {
            if (product.key && product.value) {
              acc[product.key.id] = product.value;
            }
          });
        }
        return acc;
      },
      {} as Record<number, string>,
    ) || {},
  );

  return [
    ...templates.value,
    ...(products.value?.items
      .filter((pr) => productIds.includes(pr.id))
      .map((product) => ({
        key: product.id,
        name: product.name,
        type: "products",
        checked: true,
        is_sortable: false,
      })) || []),
  ];
});

// Methods
const onChangeTableHeaders = (param: Template[]) => {
  templates.value = param;
};

const getSuggestionRole = (id: number) => {
  return suggestionStore.roles?.find((role) => role.id === id)?.name;
};

const getProducts = async () => {
  products.value = await suggestionStore.getProducts();
};

const setPageSize = (pageSize: number) => {
  setPageSizeByKey(settingsPageSizeConst, pageSize);
  params.page_size = pageSize;
  params.page = 1;
};

const setPage = (e: number) => {
  params.page = e;
};

const sortData = (data: any) => {
  params.order_by = data;
};

const onSearch = (val: string) => {
  params.page = 1;
  params.search = val;
};

const onDownloadExcelFile = async () => {
  isExcelDownloading.value = true;
  await suggestionStore.onDownloadExcelFile(
    params,
    templates.value,
    \`\${t("sidebar.suggestion")} - \${t("by_creator")}\`,
  );
  isExcelDownloading.value = false;
};

const getData = async () => {
  isLoading.value = true;
  data.value = await suggestionStore.getByCreatorData(params);
  isLoading.value = false;
};
// hooks
eventBus.on(updateListEventKey, async () => {
  if (props.isActive) {
    getData();
    return;
  }
  isRefreshData.value = true;
});

onMounted(async () => {
  await Promise.all([getData(), getProducts(), suggestionStore.getRoles()]);
});

watch(params, () => {
  getData();
});

watch(
  () => props.isActive,
  (newVal) => {
    if (newVal && isRefreshData.value) {
      isRefreshData.value = false;
      getData();
    }
  },
);
<\/script>
`;export{e as default};
