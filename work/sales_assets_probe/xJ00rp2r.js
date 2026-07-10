const n=`<template>
  <div class="flex flex-col gap-4">
    <ClientsAboutClientsFilterCard @clear-fetched-tabs="clearFetchedTabs" />
    <div class="flex gap-4 flex-wrap">
      <div
        class="px-4 py-3 bg-rg border-grey flex justify-center item-center rounded-large"
      >
        <div class="flex items-center gap-1">
          <div class="text-[#A8AEA6]">{{ t("orders.delivered") }}:</div>
          <div class="text-[20px] font-[600]">
            {{ getFormattedAmount(props.clientOrderCount) }}
          </div>
        </div>
      </div>
      <div
        class="px-4 py-3 rounded-large bg-rg1 border-grey flex justify-center item-center"
      >
        <div class="flex items-center gap-1">
          <div class="text-[#A8AEA6]">{{ t("clients.sales_amount") }}:</div>
          <div class="text-[20px] font-[600]">
            {{ getFormattedAmount(props.clientSalesAmount?.amount) }}
            {{ props.clientSalesAmount?.base_currency?.name }}
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="clientsOrdersStore.clientProduct"
      class="grid grid-cols-2 items-center gap-5 max-[767px]:grid-cols-1"
    >
      <div v-for="product in formattedData" :key="product">
        <div class="my-6">
          <div class="flex items-center justify-between">
            <div class="flex gap-3 items-center">
              <div class="fs-14 font-semibold">
                {{ product?.product_name }}
              </div>
              <div>{{ getFormattedAmount(product?.amount) }} шт</div>
            </div>
            <div>{{ getProductPercentage(product?.percentage) }}%</div>
          </div>
          <div class="mt-2 h-[12px] bg-[#E1E4E4] rounded-lg overflow-hidden">
            <div
              class="rounded-lg h-[12px]"
              :style="\`width:\${product?.percentage}%; background-color: \${product?.background}\`"
            ></div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex items-center justify-center">
      <IconLoading :loading="true" :width="9" :height="9" />
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";

// store
const clientsOrdersStore = useClientsOrdersStore("main");

// emits
const emit = defineEmits(["clearFetchedTabs"]);

// props
const props = defineProps({
  clientOrderCount: Number,
  clientSalesAmount: Number,
});

// state
const { t } = useI18n();
const route = useRoute();
const colorsArr = ref(["#D10505", "#BD7F06", "#057CD1", "#299B9B"]);
const tabNumber = ref(6);

// hooks
onMounted(async () => {
  clientsOrdersStore.params.client_id = route.params.id;
  await clientsOrdersStore.getClientProduct();
});

const formattedData = computed(() => {
  if (clientsOrdersStore.clientProduct) {
    const totalProductCount = clientsOrdersStore.clientProduct?.reduce(
      (a, b) => a + b.amount,
      0,
    );
    const arr = clientsOrdersStore.clientProduct.map((product, index) => ({
      ...product,
      percentage: ((product.amount / totalProductCount) * 100).toFixed(3),
      background: colorsArr.value[index % 4],
    }));
    return arr;
  } else {
    return [];
  }
});

// methods
const getProductPercentage = (percentage) => {
  return getFormattedAmount(Number(percentage)?.toFixed(2));
};

const clearFetchedTabs = async () => {
  emit("clearFetchedTabs", tabNumber.value);
  await clientsOrdersStore.getClientProduct();
};
<\/script>

<style scoped>
.bg-rg {
  background: rgba(22, 117, 6, 0.04);
}

.bg-rg1 {
  background: rgba(59, 7, 99, 0.04);
}
</style>
`;export{n as default};
