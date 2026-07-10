const n=`<template>
  <div class="w-full">
    <MultiTab
      variant="underline"
      :classes="
        readOnly && {
          list: 'border-t-0',
        }
      "
      :tabs="productCategoryTabs"
      :active="productsParams.categoryId"
      @update:active="onSelectCategory"
    >
      <template
        v-for="pr in productCategories"
        :key="pr.id"
        #[\`tab-content-prefix-\${pr.id}\`]
      >
        <template v-if="!pr.all_products_belong_to_agent">
          <IconWarning />
        </template>
      </template>
      <template
        v-for="pr in productCategories"
        :key="pr.id"
        #[\`tab-content-suffix-\${pr.id}\`]
      >
        <div
          v-if="pr.total_count"
          class="rounded-full flex items-center justify-center w-6 h-5 bg-primary-50 text-primary-600 text-xs font-semibold"
        >
          {{ pr.total_count > 999 ? "999+" : pr.total_count }}
        </div>
      </template>
    </MultiTab>

    <flex-row v-if="!readOnly" class="items-center gap-3 my-5">
      <search-input
        no-debounce
        :value="searchingValue"
        class="w-75"
        @change="searchingValue = $event"
      />
      <refresh-btn @click="fetchProducts" />
    </flex-row>
    <div class="rounded-lg">
      <div
        v-if="productsParams.categoryId"
        class="rounded-lg bg-white mt-2 relative w-full overflow-hidden border-grey"
      >
        <div class="rounded-lg overflow-auto">
          <data-table
            :sorted="incomeStore.params.order_by"
            :isEmpty="!products?.length"
            :loading="incomeStore.isProductLoading"
            @sort="incomeStore.sortData"
            class="rounded-lg"
            :class="{
              'max-h-125 overflow-auto': scrollableTable,
            }"
          >
            <template #header>
              <c-tr class="bg-neutral-50 border-t-0">
                <c-td-no-edit
                  v-for="key in headers"
                  :key="key.key"
                  :style="{ color: 'unset' }"
                >
                  <div
                    class="flex gap-1 fs-14 fw-4 items-center"
                    :class="{ 'justify-end': key.right }"
                  >
                    <slot
                      v-if="slots[\`header-\${key.key}\`]"
                      :name="\`header-\${key.key}\`"
                      :header="key"
                    />

                    <template v-else-if="key.key === 'discount'">
                      <div class="!flex-none w-50">
                        <DropdownsByFilterStates
                          :filter-states="discountFilterStates"
                          class="!w-full"
                          @on-open-dropdown="fetchDiscounts"
                        />
                      </div>
                    </template>
                    <template v-else>
                      <div class="secondary-gray-text">{{ key.name }}</div>
                    </template>
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>

            <template #body>
              <template
                v-for="(item, index) in products"
                :key="item.product_id"
              >
                <c-tr class="border-b-0">
                  <c-td-no-edit v-for="key in headers" :key="key.key">
                    <slot
                      v-if="slots[\`cell-\${key.key}\`]"
                      :name="\`cell-\${key.key}\`"
                      :item="item"
                      :index="index"
                      :toggle="() => toggleRow(item.product_id)"
                      :is-expanded="isRowExpanded(item.product_id)"
                    />

                    <div v-else-if="key.key === 'price'">
                      <div v-if="isPriceEditAble" class="float-right">
                        <DInput
                          allow-zero
                          min="0"
                          step="any"
                          type="number"
                          :disabled="readOnly"
                          :required="isPriceInputRequired(index)"
                          :value="item.price"
                          class="w-35"
                          @change="onUpdatePrice(item, index, $event)"
                        />
                      </div>
                      <div v-else class="text-end">
                        <div v-if="readOnly">
                          {{
                            getFormattedAmount(
                              getInputValue(
                                item.quantity_in_warehouse,
                                item.price,
                                index,
                                "price",
                              ),
                            )
                          }}
                        </div>
                        <div v-else-if="isPriceNull(item.price)">
                          {{ t("orders.price_not_set") }}
                        </div>
                        <div v-else>
                          {{ getFormattedAmount(item.price) }}
                        </div>
                      </div>
                    </div>
                    <div v-else-if="key.key === 'product_name'">
                      <span
                        v-html="highlightSearchMatch(item['product_name'])"
                      ></span>
                    </div>
                    <div v-else-if="key.key === 'volume'" class="text-end">
                      {{ getFormattedAmount(currentProducts[index].volume) }}
                    </div>
                    <div
                      v-else-if="key.key === 'quantity_in_warehouse'"
                      class="text-end"
                    >
                      {{ getFormattedAmount(item?.quantity_in_warehouse) }}
                    </div>
                    <div v-else-if="key.key === 'total_price'" class="text-end">
                      {{
                        getFormattedAmount(
                          currentProducts[index].count * item.price,
                        )
                      }}
                    </div>
                    <div v-else-if="key?.view === 'input'">
                      <div v-if="readOnly" class="text-end">
                        {{
                          getFormattedAmount(
                            getInputValue(
                              item.quantity_in_warehouse,
                              item.price,
                              index,
                              key.key,
                            ),
                          )
                        }}
                      </div>
                      <div v-else class="float-right">
                        <DInput
                          min="0"
                          type="number"
                          :disabled="readOnly || isPriceNull(item.price)"
                          :max="
                            getMaxAmount(
                              key.key,
                              item.quantity_in_warehouse,
                              item.quantity_in_package,
                              index,
                            )
                          "
                          :value="
                            getInputValue(
                              item.quantity_in_warehouse,
                              item.price,
                              index,
                              key.key,
                            )
                          "
                          @input="onAddValue($event, item, key.key, index)"
                          class="w-35"
                        />
                      </div>
                    </div>
                    <div v-else-if="key.key === 'name'">
                      <div v-if="item?.is_agent_product">
                        <span
                          v-html="highlightSearchMatch(item[key.key])"
                        ></span>
                      </div>
                      <div v-else class="flex items-center justify-between">
                        <span
                          v-html="highlightSearchMatch(item[key.key])"
                        ></span>
                        <icon-warning
                          v-tooltip="t('orders.product_belong_agent')"
                        />
                      </div>
                    </div>
                    <div
                      v-else-if="key.key === 'discount'"
                      class="flex-none w-50"
                    >
                      <DropdownsByFilterStates
                        :filter-states="
                          getRowDiscountFilterStates(item.product_id)
                        "
                        class="w-full"
                        @on-open-dropdown="fetchDiscounts"
                      />
                    </div>
                    <div v-else>{{ item[key.key] }}</div>
                  </c-td-no-edit>
                </c-tr>

                <c-tr
                  v-if="expandable && slots['expand-content']"
                  :class="
                    cn(
                      'border-b-0 hover:!bg-transparent',
                      !isRowExpanded(item.product_id) && 'border-t-0',
                    )
                  "
                >
                  <c-td-no-edit :colspan="headers.length" class="!p-0">
                    <transition-expand
                      :is-open="isRowExpanded(item.product_id)"
                    >
                      <slot name="expand-content" :item="item" :index="index" />
                    </transition-expand>
                  </c-td-no-edit>
                </c-tr>
              </template>
            </template>
            <template #footer v-if="products?.length">
              <c-tr v-show="!withoutTotal" class="bg-neutral-50 border-b-0">
                <c-td-no-edit v-for="(key, index) in headers" :key="key.key">
                  <div v-if="index === 0" class="fw-6">
                    {{ t("column.total") }}
                  </div>
                  <div v-else-if="key.key === 'count'">
                    <div class="fw-6 text-end" :class="!readonly && 'pr-2'">
                      {{ getFormattedAmount(allAmount.count) }}
                    </div>
                  </div>
                  <div
                    v-else-if="key.key === 'volume' && allAmount?.volume"
                    class="text-end"
                  >
                    <div class="fw-6">
                      {{ getFormattedAmount(allAmount?.volume) }}
                    </div>
                  </div>
                  <div v-else-if="key.key === 'discount'" class="text-end w-50">
                    <div class="fw-6">{{ totalDiscount }}%</div>
                  </div>
                  <div v-else-if="index + 1 === headers.length">
                    <div class="fw-6 text-end">
                      {{ getFormattedAmount(allAmount.price) }}
                      {{ baseCurrency }}
                    </div>
                  </div>
                  <div v-else></div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </data-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";
import { variableData } from "~/variable/variable";

// stores
const incomeStore = useIncomesStore("true");
const { errorMessage } = variableData;
const route = useRoute();

// props
const props = defineProps({
  headers: Array,
  productsParams: Object,
  products: Array,
  productCategories: Array,
  readOnly: Boolean,
  isPriceEditAble: Boolean,
  isCreateIncome: Boolean,
  withoutTotal: Boolean,
  baseCurrency: String,
  scrollableTable: Boolean,
  isCreateOrder: Boolean,
  getOrderDiscounts: Function,
  expandable: Boolean,
});

// slots
const slots = useSlots();

// emits
const emit = defineEmits(["updateProducts", "onChangeActiveCategoryId"]);

// states
const { t } = useI18n();
const oldProductsParams = ref({});
const memorizeProductsByCategoryId = ref({});
const discounts = ref();
const searchingValue = ref("");
const selectedGeneralDiscountIds = ref({}); // { [category_id]: string[] }
const productDiscountIds = ref({}); // { [product_id]: string[] }
const expandedRows = ref(new Set());

const hasDiscountColumn = computed(() => {
  return props.headers?.some((header) => header.key === "discount");
});

const discountFilterStates = ref([
  {
    name: t("column.discount"),
    key: "header-discounts",
    get data() {
      return { items: discounts.value };
    },
    get getSelectedData() {
      return (
        selectedGeneralDiscountIds.value[props.productsParams.categoryId] || []
      );
    },
    set setSelectedData(value) {
      onSelectGeneralDiscount(value);
    },
  },
]);

const getRowDiscountFilterStates = (productId) => [
  {
    name: t("column.discount"),
    key: \`row-discounts-\${productId}\`,
    get data() {
      // Filter discounts that include this product_id in their product_ids array
      const filteredDiscounts = discounts.value?.filter((discount) =>
        discount.product_ids?.includes(productId),
      );
      return { items: filteredDiscounts };
    },
    get getSelectedData() {
      return productDiscountIds.value[productId] || [];
    },
    set setSelectedData(value) {
      onSelectRowDiscount(productId, value);
    },
  },
];

// hooks
const productCategoryTabs = computed(() => {
  return props.productCategories.map((category) => ({
    key: category.id,
    title: category.name,
  }));
});

const readonly = computed(() => props.readOnly || false);

const headers = computed(() => props.headers || incomeStore.productsTemplates);

const isOrderEditable = computed(() => props.isCreateOrder && route.query.id);

const products = computed(() => {
  let productsList;

  if (readonly.value) {
    productsList = currentProducts.value.filter((item) => item?.count);
  } else {
    productsList = incomeStore.products;
  }

  // Apply search filter
  if (searchingValue.value?.trim()) {
    const searchLower = searchingValue.value.trim().toLowerCase();
    productsList = productsList?.filter((item) => {
      const productName = (item.name || item.product_name || "").toLowerCase();
      const matchesSearch = productName.includes(searchLower);

      // Find if this product has count/block values in props.products
      const existingProduct = props.products?.find(
        (p) => p.product_id === item.product_id,
      );
      const hasValues =
        existingProduct?.count > 0 || existingProduct?.unit_count > 0;

      // Show if matches search OR has values
      return matchesSearch || hasValues;
    });
  }

  return productsList;
});

const currentProducts = computed(() => {
  if (readonly.value) {
    return (
      props.products.filter(
        (product) => product.category_id === props.productsParams.categoryId,
      ) || []
    );
  }

  return (
    incomeStore.products?.map((incomeProduct) => {
      const existingProduct = props.products.find(
        (propProduct) => propProduct.product_id === incomeProduct.product_id,
      );

      if (existingProduct) {
        return {
          ...existingProduct,
          product_id: incomeProduct.product_id,
          product_name: incomeProduct.product_name,
          unit_count: incomeProduct.quantity_in_package
            ? Math.floor(
                existingProduct.count / incomeProduct.quantity_in_package,
              )
            : null,
          price: incomeProduct.price,
        };
      }

      return {
        count: null,
        unit_count: null,
        product_id: incomeProduct.product_id,
        product_name: incomeProduct.product_name,
      };
    }) || []
  );
});

const filteredProductsByCategoryId = computed(() => {
  if (props.products?.length) {
    return props.products.filter(
      (product) => product.category_id === props.productsParams.categoryId,
    );
  }
  return [];
});

const allAmount = computed(() => {
  let amounts = {
    count: 0,
    price: 0,
    volume: 0,
  };

  if (!props.products[0]?.category_id) {
    addCategoryIdOnEditOrder();
  }

  if (props.products?.length) {
    amounts = filteredProductsByCategoryId.value.reduce(
      (totals, item) => {
        totals.price += item.count * item.price;
        totals.volume += Number(item.volume);
        totals.count += Number(item.count);
        return totals;
      },
      { count: 0, price: 0, volume: 0 },
    );

    amounts.price = amounts.price;
    amounts.volume = amounts.volume;
    amounts.count = amounts.count;
  }

  return amounts;
});

const discountMap = computed(() =>
  Object.fromEntries(discounts.value?.map((d) => [d.id, d.rebate]) || []),
);

const productSumMap = computed(() =>
  props.products.reduce((acc, p) => {
    const id = p.product_id.toString();
    acc[id] = (acc[id] || 0) + p.count * p.price;
    return acc;
  }, {}),
);

const totalDiscount = computed(() => {
  const totalPrice = allAmount.value.price;
  if (!totalPrice) return 0;

  let discountSum = 0;

  if (readonly.value) {
    for (const product of filteredProductsByCategoryId.value) {
      const productSum = product.count * product.price;
      const rebate = product.rebate || 0;
      discountSum += (productSum * rebate) / 100;
    }
  } else {
    for (const product of filteredProductsByCategoryId.value) {
      const discountIds = productDiscountIds.value[product.product_id] || [];
      const productSum = product.count * product.price;

      const percent = discountIds.reduce(
        (s, id) => s + (discountMap.value[id] || 0),
        0,
      );

      discountSum += (productSum * percent) / 100;
    }
  }

  return ((discountSum / totalPrice) * 100).toFixed(2);
});

watch(props.productsParams, async () => {
  if (!readonly.value) {
    await optimallyFetchProducts();
    updateProductsWithNewParams();
  }
});

onMounted(async () => {
  if (!readonly.value) {
    await fetchProducts();
    assignDiscountsToProducts();
    if (Object.keys(productDiscountIds.value).length) {
      await fetchDiscounts();
    }
  }
  // nextTick(() => {
  //   initialCurrentProducts.value = currentProducts.value;
  // });
});

// methods
const getMaxAmount = (type, quantityInWarehouse, quantityInPackage, index) => {
  if (props.readOnly || props.isCreateIncome) return false;
  // if (isOrderEditable.value) {
  //   return initialCurrentProducts.value[index][type];
  // }
  return type === "unit_count"
    ? quantityInWarehouse / quantityInPackage
    : quantityInWarehouse;
};

const isPriceNull = (price) => {
  return price === null;
};

const highlightSearchMatch = (text) => {
  if (!searchingValue.value?.trim() || !text) {
    return text;
  }

  const searchTerm = searchingValue.value.trim();
  const regex = new RegExp(\`(\${escapeRegExp(searchTerm)})\`, "gi");

  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
};

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&");
};

const updateProductsWithNewParams = () => {
  props.products.forEach((product, index) => {
    const updatedProduct = currentProducts.value.find(
      (p) => p.product_id === product.product_id,
    );
    if (updatedProduct) {
      product.price = updatedProduct.price;
      product.unit_count = updatedProduct.unit_count;
      product.count = updatedProduct.count;
    }
  });

  emit("updateProducts", props.products); // Emit the updated products
};

const optimallyFetchProducts = async () => {
  const { priceTypeId, warehouseId, ForDate, categoryId } =
    props.productsParams;

  const shouldRefetchAll =
    oldProductsParams.value.priceTypeId !== priceTypeId ||
    oldProductsParams.value.warehouseId !== warehouseId ||
    oldProductsParams.value.ForDate !== ForDate;

  if (shouldRefetchAll) {
    await fetchProducts();
    memorizeProductsByCategoryId.value = {};
  } else if (!isProductsAlreadyFetched(categoryId)) {
    await fetchProducts();
    updateMemorizedProductsByCategoryId(categoryId);
  } else {
    incomeStore.products = memorizeProductsByCategoryId.value[categoryId];
  }

  try {
    oldProductsParams.value = JSON.parse(JSON.stringify(props.productsParams)); // avoid same reference
  } catch (error) {
    console.log(error);
  }
};

const fetchProducts = async () => {
  let res;
  if (props.isCreateOrder) {
    res = await incomeStore.getSharedDataProductsByAgent(props.productsParams);
  } else {
    res = await incomeStore.getSharedApiProducts(props.productsParams);
  }
  if (res === "error") {
    incomeStore.products = [];
    errorMessage.value = "Ошибка при загрузке продуктов";
  }
};

const fetchDiscounts = async () => {
  if (!discounts.value?.length) {
    discounts.value = await props.getOrderDiscounts();
  }
};

const getProductDiscountIds = (productId) => {
  // Row-level discount takes priority
  if (productDiscountIds.value[productId]?.length) {
    return productDiscountIds.value[productId];
  }
  // Otherwise filter general discounts that are applicable to this product
  const categoryDiscounts =
    selectedGeneralDiscountIds.value[props.productsParams.categoryId] || [];
  return categoryDiscounts.filter((discountId) => {
    const discount = discounts.value?.find((d) => d.id === discountId);
    return discount?.product_ids?.includes(productId);
  });
};

const onSelectGeneralDiscount = (discountIds) => {
  const categoryId = props.productsParams.categoryId;
  const previousGeneralDiscountIds =
    selectedGeneralDiscountIds.value[categoryId] || [];
  selectedGeneralDiscountIds.value = {
    ...selectedGeneralDiscountIds.value,
    [categoryId]: discountIds,
  };

  // Find discounts that were removed from general selection
  const removedDiscountIds = previousGeneralDiscountIds.filter(
    (id) => !discountIds.includes(id),
  );

  // Auto-select/unselect discounts in rows where discount's product_ids includes the row's product_id
  const allProductIds = incomeStore.products?.map((p) => p.product_id) || [];

  allProductIds.forEach((productId) => {
    // Get current row discount selection
    const currentRowDiscounts = productDiscountIds.value[productId] || [];

    // Remove discounts that were unselected from general dropdown
    let updatedRowDiscounts = currentRowDiscounts.filter(
      (id) => !removedDiscountIds.includes(id),
    );

    // Add newly selected discounts that are applicable to this product
    const newApplicableDiscountIds = discountIds.filter((discountId) => {
      const discount = discounts.value?.find((d) => d.id === discountId);
      const isApplicable = discount?.product_ids?.includes(productId);
      const isNotAlreadySelected = !updatedRowDiscounts.includes(discountId);
      return isApplicable && isNotAlreadySelected;
    });

    updatedRowDiscounts = [...updatedRowDiscounts, ...newApplicableDiscountIds];

    // Update row discount selection
    productDiscountIds.value = {
      ...productDiscountIds.value,
      [productId]: updatedRowDiscounts,
    };
  });

  // Update all existing products with the general discount
  updateAllProductsWithDiscounts();
};

const onSelectRowDiscount = (productId, discountIds) => {
  productDiscountIds.value = {
    ...productDiscountIds.value,
    [productId]: discountIds,
  };
  // Update the specific product with the new discount
  updateProductDiscount(productId);
};

const updateAllProductsWithDiscounts = () => {
  if (!hasDiscountColumn.value) return;

  const categoryDiscounts =
    selectedGeneralDiscountIds.value[props.productsParams.categoryId] || [];

  props.products.forEach((product) => {
    // Get discount_ids from row-specific selection or from productDiscountIds (auto-selected from general)
    const rowDiscounts = productDiscountIds.value[product.product_id];
    if (rowDiscounts?.length) {
      product.discount_ids = rowDiscounts;
    } else {
      // Filter general discounts that are applicable to this product
      const applicableDiscountIds = categoryDiscounts.filter((discountId) => {
        const discount = discounts.value?.find((d) => d.id === discountId);
        return discount?.product_ids?.includes(product.product_id);
      });
      product.discount_ids = applicableDiscountIds;
    }
  });
  emit("updateProducts", props.products);
};

const updateProductDiscount = (productId) => {
  if (!hasDiscountColumn.value) return;

  const product = props.products.find((p) => p.product_id === productId);

  if (product) {
    product.discount_ids = getProductDiscountIds(productId);
    emit("updateProducts", props.products);
  }
};

const assignDiscountsToProducts = () => {
  if (!hasDiscountColumn.value) return;

  props.products.forEach((product) => {
    if (!product.discounts) return;
    productDiscountIds.value[product.product_id] =
      product.discounts.map((d) => ("discount" in d ? d.discount.id : d.id)) ||
      [];
    updateProductDiscount(product.product_id);
  });
};

const onAddValue = (event, _item, type, index) => {
  const currentVal = Number(event.target.value.replace(/\\s/g, ""));
  currentProducts.value[index][type] = currentVal;

  const { quantity_in_package, price, volume, product_id } = _item;

  if (!props.products) {
    props.products = [];
  }

  const item = currentProducts.value.find((it) => it.product_id === product_id);
  const datIndex = props.products.findIndex(
    (it) => it.product_id === product_id,
  );

  if (currentVal >= 0) {
    const calculated = {
      unit_count: type === "count" ? quantity_in_package : currentVal,
      count: type === "count" ? currentVal : currentVal * quantity_in_package,
      price,
      volume: currentVal * volume,
      category_id: props.productsParams.categoryId,
    };

    // Add discount_ids if discount column is present (manual discount mode)
    if (hasDiscountColumn.value) {
      calculated.discount_ids = getProductDiscountIds(product_id);
    }

    if (datIndex > -1) {
      props.products[datIndex] = { ...item, ...calculated };
    } else {
      props.products.push({ ...item, ...calculated });
    }
  }
  emit("updateProducts", props.products);
};

const onUpdatePrice = (item, idx, newPrice) => {
  const isProductPriceChanged = props.products.find(
    (product) => product.product_id === item.product_id,
  );
  if (isProductPriceChanged) {
    isProductPriceChanged.price = newPrice;
  }
  item.price = newPrice;
  currentProducts.value[idx].price = newPrice;
  if (props.products.length) {
    emit("updateProducts", props.products);
  }
};

const addCategoryIdOnEditOrder = () => {
  for (let popsProductIdx in props.products) {
    const isProductExistInCurrentCategory = incomeStore.products.find(
      (currentProduct) =>
        currentProduct.product_id === props.products[popsProductIdx].product_id,
    );
    if (
      isProductExistInCurrentCategory &&
      !props.products[popsProductIdx]?.category_id
    ) {
      props.products[popsProductIdx] = {
        ...props.products[popsProductIdx],
        category_id: props.productsParams.categoryId,
      };
    }
  }
  emit("updateProducts", props.products);
};

const onSelectCategory = async (category_id) => {
  emit("onChangeActiveCategoryId", category_id);
};

const isProductsAlreadyFetched = (categoryId) => {
  return !!Object.keys(memorizeProductsByCategoryId.value)?.find(
    (id) => id === categoryId,
  );
};

const updateMemorizedProductsByCategoryId = (categoryId) => {
  memorizeProductsByCategoryId.value = {
    ...memorizeProductsByCategoryId.value,
    [categoryId]: incomeStore.products,
  };
};

const getInputValue = (quantityInWarehouse, price, index, type) => {
  if (
    (quantityInWarehouse <= 0 || (price <= 0 && !props.isPriceEditAble)) &&
    !props.isCreateIncome &&
    !readonly.value &&
    !isOrderEditable.value
  ) {
    return null;
  } else if (isOrderEditable.value) {
    return currentProducts.value[index][type];
  } else {
    return currentProducts.value[index][type];
  }
};

const isPriceInputRequired = (index) => {
  if (
    props.isPriceEditAble &&
    currentProducts.value[index]?.count > 0 &&
    (currentProducts.value[index].price === null ||
      currentProducts.value[index].price < 0)
  ) {
    return true;
  }
  return false;
};

const toggleRow = (productId) => {
  const newSet = new Set(expandedRows.value);
  if (newSet.has(productId)) {
    newSet.delete(productId);
  } else {
    newSet.add(productId);
  }
  expandedRows.value = newSet;
};

const isRowExpanded = (productId) => expandedRows.value.has(productId);
<\/script>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
  margin-top: 0 !important;
  border-radius: 28px;
  margin-right: 10px;
  height: 8px;
}

::-webkit-scrollbar-track {
  height: 8px;
  background: #fff;
  border-radius: 28px;
}

::-webkit-scrollbar-thumb {
  background: #299b9b;
  border-radius: 28px;
  height: 8px;
  margin-top: 0 !important;
}
</style>

<style>
.search-highlight {
  background-color: #ffff00;
  color: #000;
  padding: 0 1px;
  border-radius: 2px;
}
</style>
`;export{n as default};
