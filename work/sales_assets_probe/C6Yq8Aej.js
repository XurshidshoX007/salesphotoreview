const e=`<template>
  <d-modal
    data-container-width="90%"
    :name="\`\${t('cash.expeditor_debt.expeditor_debt')}: \${expeditorName}\`"
    @close-dialog="closeDialog"
  >
    <double-tab
      :first-tab-name="t('cash.expeditor_debt.by_invoice')"
      :second-tab-name="t('cash.expeditor_debt.by_product')"
      @change="onTabChange"
    >
      <template #first>
        <dashboard-cashbox-expeditor-debt-by-invoice-table
          v-if="isByInvoiceFetched"
          :id="id"
        />
      </template>
      <template #second>
        <dashboard-cashbox-expeditor-debt-by-product-table
          v-if="isByProductFetched"
          :id="id"
        />
      </template>
    </double-tab>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  id: string;
}>();

// emits
const emit = defineEmits<{
  (e: "close-dialog"): void;
}>();

// store
const expeditorDebtStore = useExpeditorDebtStore("main");

// states
const { t } = useI18n();
const fetchedTabs = ref<number[]>([1]);

// hooks
const isByInvoiceFetched = computed(() => fetchedTabs.value.includes(1));
const isByProductFetched = computed(() => fetchedTabs.value.includes(2));
const expeditorName = computed(
  () =>
    expeditorDebtStore.data?.items?.find(
      (item) => item.expeditor.id === props.id,
    )?.expeditor?.name || "",
);

// methods
const closeDialog = () => {
  emit("close-dialog");
};

const onTabChange = (tab: number) => {
  fetchedTabs.value.push(tab);
};
<\/script>
`;export{e as default};
