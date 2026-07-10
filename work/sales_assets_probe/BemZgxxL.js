const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="suggestionByDayAndProductHeader"
          :templates="templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="templates"
          :save-key="suggestionByDayAndProductHeader"
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
          :headers="templates"
          :sorted="params.order_by"
          :loading="isLoading"
          :is-empty="!data?.items.length"
          @sort="sortData"
        >
          <template #body>
            <c-tr v-for="data in data?.items" :key="data?.creator?.id">
              <c-td-no-edit
                v-for="key in templates"
                :key="key.key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.key === 'creator.name'">
                  {{ getNestedValue(data, key.key) }}
                </div>
                <div v-else-if="key.key === 'creator.code'">
                  {{ getNestedValue(data, key.key) }}
                </div>
                <div v-else-if="key.key === 'agent.code'">
                  {{ getNestedValue(data, key.key) }}
                </div>
                <div v-else-if="key.key === 'agent.name'">
                  {{ getNestedValue(data, key.key) }}
                </div>
                <div v-else-if="key.type === 'date'">
                  {{ getFormattedDate(data.created_date, "DD.MM.YYYY HH:mm") }}
                </div>
                <div v-else-if="key.key === 'product.code'">
                  {{ getNestedValue(data, key.key) }}
                </div>
                <div v-else-if="key.key === 'product.name'">
                  {{ getNestedValue(data, key.key) }}
                </div>
                <div v-else-if="key.key === 'suggestion_count'">
                  {{ data.suggestion_count }}
                </div>
                <div v-else-if="key.key === 'ordered_count'">
                  {{ data.ordered_count }}
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
  suggestionByDayAndProductHeader,
} from "~/variable/column-constants";
import { OrderEventKeys } from "~/variable/event-key-constants";
import { useSuggestionStore } from "~/stores/orders/suggestion/suggestion.store";
import { useEventBus } from "~/composables/EventBus/eventBus";

import type { Template } from "~/interfaces/ui/template";
import type { SuggestionByDayAndProduct } from "~/interfaces/api/orders/suggestion/suggestion-model";
import type { ListParams } from "~/interfaces/api/params/list-parameters";
import type { AppResponse } from "~/interfaces/api/response/app-response";

import { getFormattedDate } from "~/utils/formatters";
import { getNestedValue } from "~/utils/helpers";

// Store
const suggestionStore = useSuggestionStore("main");

// props
const props = defineProps<{
  isActive: boolean;
}>();

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

const data = ref<AppResponse<SuggestionByDayAndProduct>>();
const templates = ref<Template[]>(
  getCheckedItemsByKey(suggestionByDayAndProductHeader) || [
    {
      name: t("column.sender_name"),
      key: "creator.name",
      type: "object",
      checked: true,
    },
    {
      name: t("column.sender_code"),
      key: "creator.code",
      type: "object",
      checked: true,
    },
    {
      name: t("column.receiver_name"),
      key: "agent.name",
      type: "object",
      checked: true,
    },
    {
      name: t("column.receiver_code"),
      key: "agent.code",
      type: "object",
      checked: true,
    },
    {
      name: t("column.created_date"),
      key: "created_date",
      type: "date",
      checked: true,
    },
    {
      name: t("column.product"),
      key: "product.name",
      type: "object",
      checked: true,
    },
    {
      name: t("column.product_code"),
      key: "product.code",
      type: "object",
      checked: true,
    },
    {
      name: t("column.suggestion_count"),
      key: "suggestion_count",
      checked: true,
      type: "number",
    },
    {
      name: t("column.order_count"),
      key: "ordered_count",
      checked: true,
      type: "number",
    },
  ],
);

// Methods
const onChangeTableHeaders = (param: Template[]) => {
  templates.value = param;
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
    \`\${t("sidebar.suggestion")} - \${t("by_day_and_product")}\`,
  );
  isExcelDownloading.value = false;
};

const getData = async () => {
  isLoading.value = true;
  data.value = await suggestionStore.getByDayAndProductData(params);
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
  getData();
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
