const e=`<template>
  <form @submit.prevent="onSave" class="relative w-full">
    <d-modal
      :name="\`Создать \${isOrder ? 'заявку' : 'возврат'} (Van Selling)\`"
      :onlyCloseDialog="true"
      :loading="isLoading"
    >
      <flex-col class="gap-5">
        <DInputDatePicker
          :value="selectedDate"
          @change="(newVal) => (selectedDate = newVal)"
          title="Дата заявки"
        />
        <dropdowns-by-filter-states
          :filter-states="filterStates"
          @onOpenDropdown="onOpenDropdown"
          @search="search"
        />
        <flex-col class="gap-2">
          <label class="fs-12" for="comment">Коммент</label>
          <DInput :value="comment" @change="(newVal) => (comment = newVal)" />
        </flex-col>
        <div v-if="isSharedProductsParamsSelected">
          <ProductsTableWithCategoryTabs
            without-total
            :products="addedProducts"
            :productCategories="selectedProductCategoryItems"
            :productsParams="productsParams"
            @updateProducts="updateProducts"
            @onChangeActiveCategoryId="onChangeActiveCategoryId"
          />
        </div>
      </flex-col>
      <template #footer>
        <m-btn
          type="submit"
          class="w-full"
          :loading="isBtnLoading"
          :disabled="isSaveBtnDisabled"
        >
          {{ t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import moment from "moment";
import type { AgentModel } from "~/interfaces/api/users/agent/agent-model";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import type { PriceTypesModels } from "~/interfaces/api/settings/price-types-models";
import type { ProductCategoryModel } from "~/interfaces/api/settings/product-category-model";
import type { SharedProductsModel } from "~/interfaces/api/orders/shared-products-model";
import type { SharedProductsParamsModel } from "~/interfaces/api/orders/shared-products-params-model";
import type { VanSellingModel } from "~/interfaces/api/orders/van-selling-model";
import type { WarehousesModel } from "~/interfaces/api/warehouse/warehouses-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import { defaultDropdownParams } from "~/variable/params";
import { useI18n } from "vue-i18n";

// store
const vanSellingOrdersStore = useVanSellingOrdersStore("main");

// emits
const emit = defineEmits(["closeDialog"]);

// states
const { t } = useI18n();
const route = useRoute();
const selectedDate = ref<string>(moment().format("YYYY-MM-DDTHH:mm"));
const priceTypes = ref<DropdownItemsModelByType<PriceTypesModels>>();
const warehouses = ref<DropdownItemsModelByType<WarehousesModel>>();
const agents = ref<DropdownItemsModelByType<AgentModel>>();
const selectedAgent = ref<string>();
const productCategories = ref<DropdownItemsModelByType<ProductCategoryModel>>();
const selectedCategoryIds = ref<string[]>([]);
const comment = ref<string>();
const addedProducts = ref<Partial<SharedProductsModel>[]>([]);
const details = ref<VanSellingModel>();
const isLoading = ref<boolean>(false);
const isBtnLoading = ref<boolean>(false);

const priceTypesParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});

const productCategoriesParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});

const productsParams = ref<SharedProductsParamsModel>({
  priceTypeId: "",
  warehouseId: "",
  categoryId: "",
});

const filterStates = ref([
  {
    name: "Тип цены",
    key: "priceTypes",
    required: true,
    isSingleSelect: true,
    get data() {
      return priceTypes.value || [];
    },
    get getSelectedData() {
      return productsParams.value.priceTypeId;
    },
    set setSelectedData(value: string) {
      productsParams.value.priceTypeId = value;
    },
  },
  {
    name: "Склад",
    key: "warehouses",
    required: true,
    isSingleSelect: true,
    get data() {
      return warehouses.value || [];
    },
    get getSelectedData() {
      return productsParams.value.warehouseId;
    },
    set setSelectedData(value: string) {
      productsParams.value.warehouseId = value;
    },
  },
  {
    name: "Агенты",
    key: "agents",
    required: true,
    isSingleSelect: true,
    get data() {
      return agents.value || [];
    },
    get getSelectedData() {
      return selectedAgent.value;
    },
    set setSelectedData(value: string) {
      selectedAgent.value = value;
    },
  },
  {
    name: "Продукт категорий",
    key: "product-categories",
    showSelectedNames: true,
    required: true,
    get data() {
      return productCategories.value || [];
    },
    get getSelectedData() {
      return selectedCategoryIds.value;
    },
    set setSelectedData(value: string[]) {
      onSetSelectedCategory(value);
    },
  },
]);

// hooks
const agentsParams = computed((): defaultDropdownParamsType => {
  return {
    ...defaultDropdownParams,
    filter: [
      ...(defaultDropdownParams.filter || []),
      {
        field: "agent_type",
        value: ["VanSelling"],
      },
    ],
  };
});

const warehousesParams = computed((): defaultDropdownParamsType => {
  return {
    ...defaultDropdownParams,
    filter: [
      ...(defaultDropdownParams.filter || []),
      {
        field: "type_id",
        value: ["1"],
      },
    ],
  };
});

const isSharedProductsParamsSelected = computed(() => {
  return (
    productsParams.value.categoryId &&
    productsParams.value.warehouseId &&
    productsParams.value.priceTypeId
  );
});

const selectedProductCategoryItems = computed(() => {
  if (productCategories.value && selectedCategoryIds.value.length) {
    return productCategories.value.items.filter((category) =>
      selectedCategoryIds.value.includes(category.id!)
    );
  }
  return [];
});

const isSaveBtnDisabled = computed(() => {
  return !addedProducts.value.length;
});

const isOrder = computed(() => {
  return route.query.order_type === "1";
});

onMounted(async () => {
  if (vanSellingOrdersStore.editingOrderId) {
    isLoading.value = true;
    await handleValuesOnEdit();
    isLoading.value = false;
  }
});

// methods
const onOpenDropdown = async (state: string, value: unknown) => {
  if (state === "agents" && !agents.value) {
    await getAgents();
    return;
  }
  if (state === "warehouses" && !warehouses.value) {
    await getWarehouses();
    return;
  }
  if (state === "priceTypes" && !priceTypes.value) {
    await getPriceTypes();
    return;
  }
  if (state === "product-categories" && !productCategories.value) {
    await getProductCategories();
    return;
  }
  return;
};

const search = async (state: string, value: string) => {
  if (state === "agents") {
    agentsParams.value.search = value;
    await getAgents();
    return;
  } else if (state === "warehouses") {
    warehousesParams.value.search = value;
    await getWarehouses();
    return;
  } else if (state === "priceTypes") {
    priceTypesParams.value.search = value;
    await getPriceTypes();
    return;
  } else if (state === "productCategories") {
    productCategoriesParams.value.search = value;
    await getProductCategories();
    return;
  } else return;
};

const handleValuesOnEdit = async () => {
  await Promise.all([
    getDetails(),
    getPriceTypes(),
    getWarehouses(),
    getAgents(),
    getProductCategories(),
  ]);
  const {
    order_date,
    agent,
    price_type,
    product_categories,
    warehouse,
    comment: _comment,
  } = details.value!;
  selectedDate.value = order_date;
  selectedAgent.value = agent.id;
  productsParams.value.priceTypeId = price_type.id;
  productsParams.value.warehouseId = warehouse.id;
  comment.value = _comment;
  onSetSelectedCategory(product_categories!.map((item) => item.category.id));
  addedProducts.value = product_categories!.flatMap((item) => item.products);
};

const getDetails = async () => {
  details.value = await vanSellingOrdersStore.getDetailsById(
    vanSellingOrdersStore.editingOrderId!
  );
};

const onSetSelectedCategory = (value: string[]) => {
  selectedCategoryIds.value = value;
  productsParams.value.categoryId = selectedCategoryIds.value[0];
};

const onChangeActiveCategoryId = (categoryId: string) => {
  productsParams.value.categoryId = categoryId;
};

const updateProducts = (products: Partial<SharedProductsModel>[]) => {
  addedProducts.value = products;
};

const getAgents = async () => {
  agents.value = await vanSellingOrdersStore.getAgents(agentsParams.value);
};

const getWarehouses = async () => {
  warehouses.value = await vanSellingOrdersStore.getWarehouses(
    warehousesParams.value
  );
};

const getPriceTypes = async () => {
  priceTypes.value = await vanSellingOrdersStore.getPriceTypes(
    priceTypesParams.value
  );
};

const getProductCategories = async () => {
  productCategories.value = await vanSellingOrdersStore.getProductCategories(
    productCategoriesParams.value
  );
};

const makeProductsPostable = (products: Partial<SharedProductsModel>[]) => {
  return products
    .map((product) => ({
      count: Number(product.count),
      product_id: product.product_id,
      price: product.price,
    }))
    .filter((product) => product.count !== 0);
};

const onSave = async () => {
  isBtnLoading.value = true;
  const data = {
    id: vanSellingOrdersStore.editingOrderId || undefined,
    is_active: true,
    order_date: selectedDate.value,
    agent_id: selectedAgent.value,
    price_type_id: productsParams.value.priceTypeId,
    warehouse_id: productsParams.value.warehouseId,
    comment: comment.value,
    products: makeProductsPostable(addedProducts.value),
  };

  await vanSellingOrdersStore.createOrderRequest(data);
  await vanSellingOrdersStore.refresh();
  isBtnLoading.value = false;
  emit("closeDialog");
};
<\/script>
`;export{e as default};
