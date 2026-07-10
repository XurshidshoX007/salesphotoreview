const e=`<template>
  <DoubleTab
    :first-tab-name="t('orders.result_by_application_type')"
    :second-tab-name="t('orders.product_summary')"
    @change="onTabChange"
  >
    <template #first>
      <OrdersOrdersSeparateTotals v-if="isSeperateTotalsFetched" />
    </template>
    <template #second>
      <OrdersOrdersGeneralTotals v-if="isGeneralTotalsFetched" />
    </template>
  </DoubleTab>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// state
const { t } = useI18n();
const fetchedTabs = ref<number[]>([1]);

// hooks
const isSeperateTotalsFetched = computed(() => fetchedTabs.value.includes(1));

const isGeneralTotalsFetched = computed(() => fetchedTabs.value.includes(2));

// methods
const onTabChange = (tab: number) => {
  fetchedTabs.value.push(tab);
};
<\/script>
`;export{e as default};
