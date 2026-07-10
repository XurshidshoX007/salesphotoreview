const e=`<template>
  <d-modal
    :name="t('cash.state_of_cash_by_expeditor')"
    data-container-width="89%"
    @close-dialog="closeDialog"
  >
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="CashboxClosingDateExpeditorListHeader"
          :templates="cashboxesStore.templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="headers"
          :save-key="CashboxClosingDateExpeditorListHeader"
        />
        <page-size-btn
          :current-size="params.page_size"
          :total-count="data?.total_count"
          :page-number="data?.page_number"
          @setPageSize="setPageSize"
        />
        <search-input @change="searchData" :value="params.search" />
        <excel-btn
          :loading="isExcelFileDownloading"
          @click="downloadExcelFile"
        />
        <RefreshBtn @click="refreshData" :loading="isLoading" />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="headers"
          :is-empty="!data?.items?.length"
          :loading="isLoading"
          :sorted="params.order_by"
          @sort="sortData"
        >
          <template #body>
            <template v-for="item in data?.items" :key="item.id">
              <c-tr>
                <c-td-no-edit
                  v-for="key in headers"
                  :is-checked="key.checked"
                  :key="key.key"
                  :type="key.type"
                >
                  <div v-if="key.type === 'object'">
                    {{ item[key.key]?.name }}
                  </div>
                  <div v-else-if="key.type === 'boolean'">
                    {{ item[key.key] ? t("filters.yes") : t("filters.no") }}
                  </div>
                  <div v-else-if="key.type === 'number'">
                    {{ getFormattedAmount(item[key.key]) }}
                  </div>
                  <div v-else-if="key.type === 'array'">
                    <show-more :show-count="2" :data="item[key.key]" />
                  </div>
                  <div v-else>
                    {{ item[key.key] }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
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
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { AppResponse } from "~/interfaces/api/response/app-response";
import type { ExpeditorStateListModel } from "~/interfaces/api/cashboxes/cashboxes-model";
import type { ListParams } from "~/interfaces/api/params/list-parameters";
import type { Template } from "~/interfaces/ui/template";
import { CashboxClosingDateExpeditorListHeader } from "~/variable/column-constants";
import { getFormattedAmount } from "~/utils/filter";

// porps
const props = defineProps<{
  id: string;
  date: string;
}>();

// emits
const emit = defineEmits<{
  (e: "close-dialog"): void;
}>();

// store
const cashboxesStore = useCashboxesStore("main");

// state
const { t } = useI18n();
const data = ref<AppResponse<ExpeditorStateListModel>>();
const isLoading = ref(false);
const isExcelFileDownloading = ref(false);

const params = reactive<
  Omit<ListParams, "date"> & { date: string; cash_box_id: string }
>({
  page: 1,
  page_size: 10,
  search: "",
  order_by: {
    field: "expected_payment_amount",
    is_asc: true,
  },
  filter: [],
  date: props.date,
  cash_box_id: props.id,
});

const headers = ref<Template[]>(
  getCheckedItemsByKey(CashboxClosingDateExpeditorListHeader) || [
    {
      name: t("cash.problematic_order_visual_ids"),
      key: "problematic_order_visual_id_arr",
      type: "array",
      checked: true,
    },
    {
      name: t("cash.expected_payment_amount"),
      key: "expected_payment_amount",
      type: "number",
      checked: true,
    },
    {
      name: t("cash.all_payment_amount"),
      key: "all_payment_amount",
      type: "number",
      checked: true,
    },
    {
      name: t("cash.approved_payment_amount"),
      key: "approved_payment_amount",
      type: "number",
      checked: true,
    },
    {
      name: t("cash.is_correct"),
      key: "is_correct",
      type: "boolean",
      checked: true,
    },
    {
      name: t("column.currency"),
      key: "base_currency",
      type: "object",
      checked: true,
    },
    {
      name: t("filters.expeditor"),
      key: "expeditor",
      type: "object",
      checked: true,
    },
  ],
);

// watch
watch(params, async () => await getData());

onMounted(async () => {
  await getData();
});

// methods
const closeDialog = () => {
  emit("close-dialog");
};

const onChangeTableHeaders = (param: Template[]) => {
  headers.value = param;
};

const setPageSize = (pageSize: number) => {
  params.page_size = pageSize;
};

const setPage = (page: number) => {
  params.page = page;
};

const searchData = (search: string) => {
  params.search = search;
};

const sortData = (sort: { field: string; is_asc: boolean }) => {
  params.order_by = sort;
};

const getData = async () => {
  isLoading.value = true;
  data.value = await cashboxesStore.fetchClosingDateExpeditorList(params);
  isLoading.value = false;
};

const refreshData = async () => {
  await getData();
};

const downloadExcelFile = async () => {
  await cashboxesStore.downloadExpeditorListExcel(
    params,
    headers.value,
    (val: boolean) => {
      isExcelFileDownloading.value = val;
    },
  );
};
<\/script>
`;export{e as default};
