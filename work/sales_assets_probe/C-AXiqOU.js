const n=`<template>
  <c-tr>
    <c-td-no-edit class="bg-[#f1fefe]" :colspan="\`\${templatesLength}\`">
      <flex-col class="gap-3 relative">
        <flexible-items-menu
          v-if="isExchange"
          tab-mode
          :active-item-id="activeTabId"
          :items-arr="tabs"
          class="px-6 sticky top-0 left-2.5"
          @onChangeActiveItem="activeTabId = $event"
        />
        <OrdersOrdersOrderProductsForOrderTable
          :product-categories="detailDataByTypeId"
          :loading="isLoading"
          class="order-detail-content"
        />
      </flex-col>
    </c-td-no-edit>
  </c-tr>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ProductCategoriesModel } from "~/interfaces/api/orders/order-detail-model";

// props
const props = defineProps<{
  detailsMap: Map<
    string,
    {
      loading: boolean;
      data: Record<"request" | "return", ProductCategoriesModel[]>;
    }
  >;
  typeId: number;
  id: string;
  templatesLength: number;
  getDetail: (
    id: string,
    typeId?: number,
  ) => Promise<ProductCategoriesModel[] | undefined>;
}>();

// states
const { t } = useI18n();
const activeTabId = ref<number>(1);

const tabs = ref([
  {
    id: 1,
    name: t("orders.exchange_sending"),
  },
  {
    id: 2,
    name: t("orders.exchange_return"),
  },
]);

// hooks
const isExchange = computed(() => props.typeId === 3);

const detailDataByTypeId = computed<ProductCategoriesModel[]>(() => {
  const data = props.detailsMap.get(props.id);
  if (!data) return [];
  return data.data[activeTabId.value === 1 ? "request" : "return"];
});

const isLoading = computed(() => {
  const data = props.detailsMap.get(props.id);
  if (!data) return false;
  return data.loading;
});

// methods
const setDetail = async () => {
  if (!isExchange.value && props.detailsMap.has(props.id)) return;
  if (
    isExchange.value &&
    props.detailsMap.has(props.id) &&
    props.detailsMap.get(props.id)?.data.request &&
    props.detailsMap.get(props.id)?.data.return
  )
    return;

  const currentData = props.detailsMap.get(props.id)?.data || {};
  props.detailsMap.set(props.id, {
    loading: true,
    data: { ...currentData } as Record<
      "request" | "return",
      ProductCategoriesModel[]
    >,
  });

  const detailData = await props.getDetail(
    props.id,
    isExchange.value ? activeTabId.value : undefined,
  );

  props.detailsMap.set(props.id, {
    loading: false,
    data: {
      [activeTabId.value === 1 ? "request" : "return"]: detailData,
      ...currentData,
    } as Record<"request" | "return", ProductCategoriesModel[]>,
  });
};

watch(
  [() => props.id, () => activeTabId.value],
  async () => {
    await setDetail();
  },
  { immediate: true },
);
<\/script>

<style scoped>
.order-detail-content {
  padding: 0 24px;
  width: calc(100vw - 200px);
  position: sticky;
  top: 0;
  left: 10px;
}

@media (max-width: 998px) {
  .order-detail-content {
    width: calc(100vw - 50px);
  }
}
</style>
`;export{n as default};
