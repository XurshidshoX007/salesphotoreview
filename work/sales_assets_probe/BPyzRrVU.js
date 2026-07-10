const e=`<template>
  <DashboardCashboxExpeditorDebtGeneralTable
    type="product"
    :headers="headers"
    :data="data || []"
    :is-loading="isLoading"
  />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ByProductDetailModel } from "~/interfaces/api/cashboxes/expeditor-debt-model";
import type { Template } from "~/interfaces/ui/template";

// props
const props = defineProps<{
  id: string;
}>();

// store
const expeditorDebtStore = useExpeditorDebtStore("main");

// states
const { t } = useI18n();
const data = ref<ByProductDetailModel[]>([]);
const isLoading = ref(false);

const headers = ref<(Template & { showCurrencyCode?: boolean })[]>([
  {
    key: "category",
    name: t("column.category"),
    type: "object",
    checked: true,
  },
  {
    name: t("column.product"),
    key: "product",
    type: "object",
    checked: true,
  },
  {
    name: t("cash.expeditor_debt.product_debt_count"),
    checked: true,
    key: "total_product_debt_count",
    type: "number",
  },
  {
    name: t("column.total_debt"),
    key: "total_debt",
    type: "number",
    checked: true,
    showCurrencyCode: true,
  },
]);

// hooks
onMounted(async () => await getData());

// methods
const getData = async () => {
  isLoading.value = true;
  data.value = (await expeditorDebtStore.getByProductList(props.id)) ?? [];
  isLoading.value = false;
};
<\/script>
`;export{e as default};
