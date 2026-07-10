const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="suggestionHeader"
          :templates="templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn :headers="templates" :save-key="suggestionHeader" />
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
            <c-tr v-for="data in data?.items" :key="data?.id">
              <c-td-no-edit
                v-for="key in templates"
                :key="key.key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.type === 'number'" class="flex">
                  {{ getFormattedAmount(data[key.key]) }}
                  <span> {{ data?.order_base_currency_code }}</span>
                </div>
                <div v-else-if="key.type === 'array'">
                  <show-more :show-count="1" :data="data[key.key]" />
                </div>
                <div v-else-if="key.key === 'created_by.name'">
                  {{ data?.created_by?.name }}
                  {{ getNestedValue(data, key.key) }}
                </div>
                <link-component
                  v-else-if="key.key === 'client.name'"
                  :to="\`/clients/about-clients/\${data['client'].id}\`"
                  :value="getNestedValue(data, key.key) || ''"
                  :is-linkable="hasAccess2ClientDetail"
                />
                <div v-else-if="key.key?.includes('.name')">
                  {{ getNestedValue(data, key.key) }}
                </div>
                <div v-else-if="key.key === 'created_by.code'">
                  {{ data["created_by"]?.code }}
                  {{ getNestedValue(data, key.key) }}
                </div>
                <div v-else-if="key.type === 'date'" class="text-nowrap">
                  {{ getFormattedDate(data[key.key], "DD.MM.YYYY HH:mm") }}
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
  suggestionHeader,
} from "~/variable/column-constants";
import { OrderEventKeys } from "~/variable/event-key-constants";
import { useSuggestionStore } from "~/stores/orders/suggestion/suggestion.store";
import { useClientsAccess } from "~/composables/access/clients/clients";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { getFormattedAmount } from "~/utils/filter";
import { getFormattedDate } from "~/utils/formatters";
import { getNestedValue } from "~/utils/helpers";

import type { Template } from "~/interfaces/ui/template";
import type { SuggestionListModel } from "~/interfaces/api/orders/suggestion/suggestion-model";
import type { AppResponse } from "~/interfaces/api/response/app-response";
import type { ListParams } from "~/interfaces/api/params/list-parameters";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// Store
const suggestionStore = useSuggestionStore("main");

// State
const { t } = useI18n();
const eventBus = useEventBus();
const { hasAccess2Detail: hasAccess2ClientDetail } = useClientsAccess();

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

const data = ref<AppResponse<SuggestionListModel>>();
const templates = ref<Template[]>(
  getCheckedItemsByKey(suggestionHeader) || [
    {
      name: t("column.created_date"),
      key: "created_date",
      type: "date",
      checked: true,
    },
    {
      name: t("orders.client"),
      key: "client.name",
      type: "object",
      checked: true,
    },
    {
      name: t("column.was_on_point"),
      key: "was_on_point",
      type: "boolean",
      checked: true,
    },
    {
      name: t("settings_sidebar.territory"),
      key: "territory.name",
      type: "object",
      checked: true,
    },
    {
      name: t("column.role_the_sender"),
      key: "created_by_role",
      type: "string",
      checked: true,
    },
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
      name: t("column.trade_direction_sender"),
      key: "creator_trade_direction_names",
      type: "array",
      checked: true,
    },
    {
      name: t("column.receiver_agent_codes"),
      key: "receiver_agent_codes",
      type: "array",
      checked: true,
    },
    {
      name: t("column.recipients_name"),
      key: "receiver_agents",
      type: "array",
      checked: true,
    },
    {
      name: t("column.recipients_trade_direction"),
      key: "trade_direction.name",
      type: "object",
      checked: true,
    },
    {
      name: t("column.order_price"),
      key: "order_cost",
      checked: true,
      type: "number",
    },

    {
      name: t("column.comment"),
      key: "comment",
      checked: true,
    },
  ],
);

// Methods
const onChangeTableHeaders = (param: Template[]) => {
  templates.value = param;
};

const getSuggestionRole = (id: number) => {
  return suggestionStore.roles?.find((role) => role.id === id)?.name;
};

const setPageSize = (pageSize: number) => {
  setPageSizeByKey(settingsPageSizeConst, pageSize);
  params.page_size = pageSize;
  params.page = 1;
};

const setPage = (e: number) => {
  params.page = e;
};

const sortData = (_data: any) => {
  const field = data.value?.items.find(
    (item: any) => item[_data?.field] !== null,
  )?.[_data?.field];
  if (
    field &&
    typeof field === "object" &&
    _data.field !== "invoice_types" &&
    _data.field !== "created_by"
  ) {
    _data.field = _data.field + "_id";
  }

  params.order_by = _data;
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
    t("sidebar.suggestion"),
  );
  isExcelDownloading.value = false;
};

const getData = async () => {
  isLoading.value = true;
  data.value = await suggestionStore.getListData(params);
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
  await suggestionStore.getRoles();
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
