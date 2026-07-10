const e=`<template>
  <div class="table-content-container general-table">
    <div class="table-content-header">
      <table-sort-columns
        :templates="headers"
        :save-key="orderGeneralTotals"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn :headers="headers" :save-key="orderGeneralTotals" />
      <excel-btn
        :loading="isExcelFileDownloading"
        @click="onDownloadExcelFile"
      />
      <RefreshBtn @click="refresh" :loading="isLoading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="headers"
        :loading="isLoading"
        :is-empty="totals?.list?.length === 0"
        :sorted="orderByParams"
        @sort="orderBy"
      >
        <template #body>
          <template v-for="data in totals?.list" :key="data.id">
            <c-tr>
              <c-td-no-edit
                v-for="(key, ind) in headers"
                :is-checked="key.checked"
                :header-key="key.key"
                :key="ind"
                :type="key.type"
              >
                <div v-if="key.type === 'object'">
                  {{ getNestedValue(data, key.key) }}
                </div>
                <div v-else-if="key.type === 'number'">
                  {{ getFormattedAmount(getNestedValue(data, key.key)) }}
                </div>
                <div v-else>
                  {{ getNestedValue(data, key.key) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </template>
        <template #footer v-if="keysOfTotals.length > 0">
          <c-tr class="border-b-0 bg-neutral-50">
            <c-td-no-edit
              v-for="(key, index) in headers"
              :key="key.key"
              :is-checked="key.checked"
            >
              <div v-show="index === 0" class="fw-6 whitespace-nowrap">
                {{ t("column.total") }}
              </div>
              <div
                v-if="
                  key.checked &&
                  getNestedValue(totals?.total, key.key) !== undefined
                "
                class="text-end fw-6 whitespace-nowrap"
              >
                {{ getFormattedAmount(getNestedValue(totals?.total, key.key)) }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getFormattedAmount } from "~/utils/filter";
import { orderGeneralTotals } from "~/variable/column-constants";
import {
  getCheckedItemsByKey,
  setCheckedItemsToLocalByKey,
} from "~/utils/local-storage";
import { getNestedValue } from "~/utils/helpers";
import type { Template } from "~/interfaces/ui/template";
import type { GeneralTotalsByOrdersModel } from "~/interfaces/api/orders/general-totals-by-orders-model";
import type { GenericObject } from "~/interfaces/ui";
import type { OrderByParams } from "~/interfaces/api/params/list-parameters";

// store
const orderStore = useOrdersStore("main");

// states
const { t } = useI18n();

const totals = ref<GeneralTotalsByOrdersModel>();
const isLoading = ref<boolean>(false);
const isExcelFileDownloading = ref<boolean>(false);

const orderByParams = ref<OrderByParams | null>({
  field: "id",
  is_asc: false,
});

const headers = ref<Template[]>(
  getCheckedItemsByKey(orderGeneralTotals) || [
    {
      name: t("column.code"),
      key: "product.code",
      type: "object",
      checked: true,
    },
    {
      name: t("column.category"),
      key: "category.name",
      type: "object",
      checked: true,
    },
    {
      name: t("settings_sidebar.products"),
      key: "product.name",
      type: "object",
      checked: true,
    },
    {
      name: t("column.order"),
      key: "request_count",
      checked: true,
      type: "number",
    },
    {
      name: t("column.order_price"),
      key: "request_cost",
      checked: true,
      type: "number",
    },
    {
      name: t("orders.return"),
      key: "refund_count",
      checked: true,
      type: "number",
    },
    {
      name: t("column.return_summa"),
      key: "refund_cost",
      checked: true,
      type: "number",
    },
    {
      name: t("column.exchange_of_shipment"),
      key: "exchange_request_count",
      checked: true,
      type: "number",
    },
    {
      name: t("column.amount_exchange_sending"),
      key: "exchange_request_cost",
      checked: false,
      type: "number",
    },
    {
      name: t("orders.exchange_return"),
      key: "exchange_refund_count",
      checked: true,
      type: "number",
    },
    {
      name: t("column.amount_exchange_return"),
      key: "exchange_refund_cost",
      checked: false,
      type: "number",
    },
    {
      name: t("column.request_bonus_count"),
      key: "request_bonus_count",
      checked: true,
      type: "number",
    },
    {
      name: t("column.refund_bonus_count"),
      key: "refund_bonus_count",
      checked: true,
      type: "number",
    },
  ]
);

const keysOfTotals = computed(() => {
  return Object.keys(totals.value?.total || {});
});

// methods
const onChangeTableHeaders = (newHeaders: Template[]) => {
  headers.value = newHeaders;
};

const orderBy = async (value: OrderByParams | null) => {
  orderByParams.value = value;
  if (!value || !value.field) return;

  const { field, is_asc } = value;

  if (totals.value)
    totals.value.list = [...(totals.value?.list ?? [])].sort((a, b) => {
      const aValue = getDataValue(a, field);
      const bValue = getDataValue(b, field);

      if (aValue == null || bValue == null) {
        return aValue == null ? -1 : 1;
      }

      if (
        typeof aValue === "object" &&
        typeof bValue === "object" &&
        "name" in aValue &&
        "name" in bValue
      ) {
        return is_asc
          ? String(aValue.name).localeCompare(String(bValue.name))
          : String(bValue.name).localeCompare(String(aValue.name));
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return is_asc
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return is_asc
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    });
};

const getTotals = async () => {
  isLoading.value = true;
  totals.value = await orderStore.getGeneralTotalsByOrders();
  isLoading.value = false;
};

const transformExcelData = (data: GenericObject[], headers: Template[]) => {
  const result: GenericObject[] = [];
  for (const item of data) {
    const row: GenericObject = {
      "product.code": item.product.code,
      "product.name": item.product.name,
      "category.name": item.category.name,
    };
    for (const hh of headers) {
      const key = hh.key.split(".").at(-1) || "";
      if (!["product.code", "product.name", "category.name"].includes(key)) {
        row[key] = item[key];
      }
    }

    result.push(row);
  }
  return result;
};

const onDownloadExcelFile = async () => {
  const filteredHeaders = headers.value.filter((item) => item.checked);
  const header = filteredHeaders.reduce(
    (acc, item) => {
      acc[item.key] = item.name;
      return acc;
    },
    {} as Record<string, string>
  );
  const excelFooter =
    totals.value?.total &&
    Object.fromEntries(
      filteredHeaders.map(({ key }) => [
        key,
        key === "product.code"
          ? t("column.total")
          : totals.value &&
              typeof getDataValue(totals.value.total, key) === "number"
            ? getDataValue(totals.value.total, key)
            : "",
      ])
    );
  const excelData = transformExcelData(
    totals.value?.list || [],
    filteredHeaders
  );
  excelData.unshift(header);
  if (excelFooter) excelData.push(excelFooter);
  downloadLocalExcelFile({
    headers: filteredHeaders,
    data: excelData,
    title: "Итоги по заказом",
  });
};

const refresh = async () => await getTotals();

// hooks
onMounted(async () => await getTotals());

// for checked/unchecked changes
watch(headers.value, () => {
  setCheckedItemsToLocalByKey(orderGeneralTotals, headers.value);
});

// for order changes
watch(
  () => headers.value,
  () => {
    setCheckedItemsToLocalByKey(orderGeneralTotals, headers.value);
  }
);
<\/script>

<style scoped>
.table-content-body {
  padding-bottom: 0;
  overflow: hidden;
}

.general-table {
  overflow: hidden;
}
</style>
`;export{e as default};
