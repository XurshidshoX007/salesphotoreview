const e=`<template>
  <d-modal
    dataContainerWidth="1140px"
    :name="t('users.limits')"
    only-close-dialog
    @closeDialog="closeDialog"
  >
    <div>
      <div
        v-if="!openLimitForAgentCreate"
        class="flex justify-between gap-5 w-full"
      >
        <div class="text-base font-normal flex gap-x-2">
          <span class="text-gray-3 text-4 fw-6 text-base font-normal"
            >{{ t("users.agents.agent") }}:
          </span>
          <span class="text-sm text-[#299B9B]"
            ><show-more :data="agentsName" :show-count="15"
          /></span>
        </div>
      </div>
      <div class="grid grid-cols-2 page-gap w-full mt-4">
        <div class="product-category-box">
          <div class="box-top">
            <div class="title">
              {{ t("settings_sidebar.price_type") }}
            </div>
            <Checkbox
              :id="\`22\`"
              :title="t('filters.choose_all')"
              @change="onCheckPriceType($event, '', 'all')"
              :indeterminate="
                methodData.price_types.length > 0 &&
                priceTypes?.items?.length > methodData.price_types.length
              "
              :checked="
                priceTypes?.items?.length === methodData.price_types.length
              "
            />
          </div>

          <div class="box-bottom">
            <div class="content-by-category">
              <div class="bottom-header">
                <search-input-border-none
                  class="bg-white"
                  :disabled="isLoading"
                  @updated="searchPriceTypes($event)"
                />
              </div>
              <div class="box-body">
                <SkeletonRows
                  v-if="isLoading"
                  class="mt-13"
                  height="20px"
                  :rows="9"
                  :max-row-width="250"
                />
                <div v-else class="item">
                  <div
                    v-for="item in priceTypes?.items"
                    :key="item?.id"
                    class="child-item"
                  >
                    <div class="flex check">
                      <Checkbox
                        :id="item?.id"
                        :checked="isPriceTypeChecked(item?.id, null)"
                        :disabled="item.hand_edit"
                        :title="item?.name"
                        @change="onCheckPriceType(null, item?.id, null)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <SharedProductsByCategorySelection
          type="productCategories"
          :categories="productCategories?.items"
          :products="products"
          :selectedProducts="methodData.products"
          :isLoading="isLoading"
          @onSearch="onSearchProductCategory"
          @onAllSelect="onAllSelect"
          @onSelect="selectProduct"
          @selectAllCheckboxFunction="selectAllCheckboxFunction"
        />
      </div>
    </div>
    <template v-if="allowToUpdate" #footer>
      <div class="flex justify-end">
        <m-btn
          :loading="isBtnLoading || agentStore.isDataModalLoading"
          @click="onSave"
          >{{ t("save") }}
        </m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import type { PriceTypesModels } from "~/interfaces/api/settings/price-types-models";
import type { ProductCategoryModel } from "~/interfaces/api/settings/product-category-model";
import type { ProductsModel } from "~/interfaces/api/settings/products-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import {
  defaultDropdownParams,
  productCategoryDropdownParams,
} from "~/variable/params";
import { PriceType as PriceTypeConstants } from "~/variable/static-constants";
import { useI18n } from "vue-i18n";

// store
const agentStore = useAgentsStore("true");

// props
const props = defineProps<{
  agentInfo: Record<"id" | "isWithoutLimit", string | boolean>;
  allowToUpdate: boolean;
  openLimitForAgentCreate?: boolean;
  agentLimitDataForAgentCreate: {
    product_id_arr: Array<{ product_id: string }>;
    price_type_id_arr: Array<{ price_type_id: string }>;
  };
}>();

// emits
const emit = defineEmits(["closeDialog", "setAgentLimitData"]);

// state
const { t } = useI18n();
const products = ref<DropdownItemsModelByType<ProductsModel>>();
const productCategories = ref<DropdownItemsModelByType<ProductCategoryModel>>();
const priceTypes = ref<DropdownItemsModelByType<PriceTypesModels>>();
const isLoading = ref<boolean>(false);
const isBtnLoading = ref<boolean>(false);

const agentLimits = ref();

const methodData = ref({
  agent_id: props.agentInfo?.id || "",
  products: [] as Array<Record<"product_id", string>>,
  price_types: [] as Array<Record<"price_type_id", string>>,
});

const productsParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});

const productCategoriesParams = ref<defaultDropdownParamsType>({
  ...productCategoryDropdownParams,
});

// hooks
const priceTypesParamsForSale = computed(() => {
  return {
    ...defaultDropdownParams,
    filter: [
      ...defaultDropdownParams.filter,
      {
        field: "type",
        value: [PriceTypeConstants.Sale],
      },
    ],
  };
});

onMounted(async () => {
  isLoading.value = true;
  await Promise.all([getPriceTypes(), getProducts(), getProductCategories()]);
  if (props.agentInfo?.isWithoutLimit) {
    agentLimits.value = await agentStore.getAgentLimitDetail(
      props.agentInfo.id,
    );
    methodData.value.price_types = agentLimits.value.price_types;
    methodData.value.products = agentLimits.value.products;
  }
  isLoading.value = false;
  if (props.openLimitForAgentCreate && !props.agentInfo.id) {
    setDefaultAgentLimits();
  }
  if (
    agentStore.editMultipleDialog?.length === 0 &&
    !props.agentInfo?.isWithoutLimit
  ) {
    agentStore.autoGetAgentIds();
  }
});

const setDefaultAgentLimits = () => {
  methodData.value.products =
    props.agentLimitDataForAgentCreate.product_id_arr?.map((item) => {
      return { product_id: item };
    });
  methodData.value.price_types =
    props.agentLimitDataForAgentCreate.price_type_id_arr?.map((item) => {
      return { price_type_id: item };
    });
};

const agentsName = computed(() => {
  const multipleDialog = agentStore.editMultipleDialog;

  if (multipleDialog?.length) {
    const fullNames = multipleDialog
      .map((item) => item?.full_name)
      .filter(Boolean);
    return fullNames;
  } else {
    return [
      agentStore.data?.items?.find((item) => item.id === props.agentInfo.id)
        ?.full_name || "",
    ];
  }
});

// methods
const closeDialog = () => emit("closeDialog");

const getPriceTypes = async () => {
  priceTypes.value = await agentStore.getPriceTypes(
    priceTypesParamsForSale.value,
  );
};

const getProducts = async () => {
  products.value = await agentStore.getProducts(productsParams.value);
};

const getProductCategories = async () => {
  productCategories.value = await agentStore.getProductCategories(
    productCategoriesParams.value,
  );
};

const onSearchProductCategory = async (state: string, newVal: string) => {
  productCategories.value.items = productCategories.value?.items.filter(
    (item: ProductCategoryModel) =>
      item.name.toLocaleLowerCase().includes(newVal.toLocaleLowerCase()),
  );
  if (!newVal) {
    await getProductCategories();
  }
};

const onAllSelect = async (
  categoryId: string,
  type: string,
  isChecked: boolean,
) => {
  const filteredProductIds = products.value?.items
    .filter((product) => product?.category?.id === categoryId)
    ?.map((product) => product?.id);

  if (!isChecked) {
    methodData.value.products = methodData.value?.products?.filter(
      (product) => !filteredProductIds?.includes(product.product_id),
    );
  } else {
    methodData.value.products = [
      ...methodData.value?.products,
      ...(filteredProductIds || [])?.map((id) => ({
        product_id: id,
      })),
    ];
  }
};

const selectAllCheckboxFunction = async (type: string, isChecked: boolean) => {
  productCategories?.value?.items?.map((item: any) => {
    onAllSelect(item.id, type, isChecked);
  });
};

const selectProduct = (id: string, type: string, isChecked: boolean) => {
  if (!isChecked) {
    methodData.value.products = methodData.value?.products?.filter(
      (product) => product.product_id !== id,
    );
  } else {
    methodData.value.products.push({ product_id: id });
  }
};

const searchPriceTypes = async (value: string) => {
  priceTypes.value.items = priceTypes.value?.items?.filter((priceType) =>
    priceType.name.includes(value),
  );
  if (!value) {
    await getPriceTypes();
  }
};

const isPriceTypeChecked = (itemId: string) => {
  return methodData.value.price_types
    .map((item: Record<"price_type_id", string>) => item.price_type_id)
    .includes(itemId);
};

const onCheckPriceType = async (event: any, itemId: string, status: string) => {
  if (status === "all") {
    let arr_idd = ref([]);
    if (!event) {
      priceTypes?.value?.items?.map((item) => {
        isPriceTypeChecked(item.id);
      });
      methodData.value.price_types = [];
    } else {
      priceTypes?.value?.items?.map((item) => {
        if (!item.hand_edit) {
          arr_idd.value.push({ price_type_id: item.id });
        }
      });
      methodData.value.price_types = arr_idd.value;
    }
  } else {
    const isChecked = methodData.value.price_types.find(
      (price) => price.price_type_id === itemId,
    );
    if (!!isChecked) {
      methodData.value.price_types = methodData.value.price_types.filter(
        (price) => price.price_type_id !== itemId,
      );
    } else {
      methodData.value.price_types = [
        ...methodData.value.price_types,
        { price_type_id: itemId },
      ];
    }
  }
};

const onSave = async () => {
  if (props.openLimitForAgentCreate) {
    const updatePackage = {
      product_id_arr: methodData.value?.products?.map((item) => {
        return item.product_id;
      }),
      price_type_id_arr: methodData.value.price_types?.map((item) => {
        return item.price_type_id;
      }),
    };

    emit("closeDialog");
    emit("setAgentLimitData", updatePackage);
  } else {
    isBtnLoading.value = true;
    const { editMultipleDialog, updateMultiple, update } = agentStore;
    let res = null;
    if (editMultipleDialog.length > 0) {
      const agentID = editMultipleDialog.map((item) => item.id);
      const updatePackage = {
        agent_ids: agentID,
        products: methodData.value?.products,
        price_types: methodData.value.price_types,
      };
      res = await updateMultiple(updatePackage);
    } else {
      res = await update(methodData.value);
    }
    isBtnLoading.value = false;
    res !== "error" && emit("closeDialog");
  }
};
<\/script>

<style scoped lang="scss">
.product-category-box {
  .box-top {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-weight: 600;
      font-family: "Inter", sans-serif;
      font-size: 18px;
      color: #424f4f;
    }
  }

  .box-bottom {
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid #e1e4e4;
    position: relative;
    background: white;
    width: 100%;
    height: 344px;
    margin-top: 12px;

    .content-by-category {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;

      .bottom-header {
        padding: 4px 0;
        width: 100%;
        border-bottom: 1px solid #e1e4e4;
        flex-shrink: 0;
      }

      .box-body {
        width: 100%;
        flex: 1;
        overflow: hidden;

        .item {
          overflow: auto;
          height: 100%;

          &::-webkit-scrollbar {
            width: 10px;
          }

          &::-webkit-scrollbar-track {
            background: #fafafa;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            margin-top: 10px;
          }

          &::-webkit-scrollbar-thumb {
            border-radius: 10px;
            border: 3px solid transparent;
            background-clip: padding-box;
          }

          .child-item {
            border-bottom: 1px solid #e1e4e4;
            padding: 10px;

            &:last-child {
              border-bottom: none;
            }
          }
          &.last-child {
            border-bottom: none;
          }
        }
      }
    }
  }
}
</style>
`;export{e as default};
