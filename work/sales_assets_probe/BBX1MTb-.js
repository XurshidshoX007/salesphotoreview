const n=`<template>
  <d-modal
    dataContainerWidth="1260px"
    :name="t('users.agents.add_remove_products_to_agent_product_list')"
    only-close-dialog
    :loading="modalLoading"
    @closeDialog="closeDialog"
  >
    <div class="agent-add-remove-limit">
      <div class="page-header flex gap-x-2">
        <span class="text-gray-3 text-4 fw-6 text-base font-normal">
          {{ t("dashboard.agents") }}
        </span>
        <span class="text-sm text-[#299B9B]">
          <show-more :show-count="15" :data="agentsName" />
        </span>
      </div>
      <div class="page-body">
        <div class="limit-cards">
          <div class="title py-3">
            {{ t("settings_sidebar.price_type") }}
          </div>
          <div class="limit-cards-content">
            <div
              class="rounded-large border-grey w-[46%]"
              :class="cardPriceFilterData(false)?.length > 14 && 'pr-1'"
            >
              <div
                class="add-remove-card"
                :class="cardPriceFilterData(false)?.length > 14 && 'pr-1'"
              >
                <div
                  v-for="item in cardPriceFilterData(false)"
                  :key="item.id"
                  class="section"
                  :class="
                    cardPriceFilterData(false)?.length > 14 && 'border-r-1'
                  "
                  @click="changePriceCardActive(item.id)"
                >
                  {{ item?.name }}
                </div>
              </div>
            </div>
            <icon-two-arrows-icon />
            <div
              class="rounded-large border-grey w-[46%]"
              :class="cardPriceFilterData(true)?.length > 7 && 'pr-1'"
            >
              <div
                class="add-remove-card"
                :class="cardPriceFilterData(true)?.length > 7 && 'pr-1'"
              >
                <div
                  v-for="item in cardPriceFilterData(true)"
                  :key="item.id"
                  class="section"
                  :class="cardPriceFilterData(true)?.length > 7 && 'border-r-1'"
                  @click="changePriceCardActive(item.id)"
                >
                  {{ item?.name }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="limit-cards">
          <div class="flex items-center justify-between pb-2">
            <div class="title">
              {{ t("settings_sidebar.products") }}
            </div>
            <div class="w-60">
              <DropdownsByFilterStates
                ref="DropdownComponent"
                :filterStates="filterStates"
                @onOpenDropdown="filtersStore.onOpenDropdown"
                @search="filtersStore.onSearchDropdown"
              />
            </div>
          </div>
          <div class="limit-cards-content">
            <div
              class="rounded-large border-grey w-[46%]"
              :class="cardProductFilterData(false) && 'pr-1'"
            >
              <div
                class="add-remove-card"
                :class="cardProductFilterData(false) && 'pr-1'"
              >
                <div
                  v-for="item in productCategoryWithProducts"
                  :key="item.id"
                  v-show="cardProductCategoriesFilterData(item.id, false)"
                  class="section-products"
                  :class="cardProductFilterData(false) && 'border-r-1'"
                >
                  <div
                    class="category"
                    @click="changeProductCategoryCardActive(item.id, true)"
                  >
                    {{ item?.name }}
                  </div>
                  <div
                    v-for="product in item.products"
                    :key="product.id"
                    v-show="!product.card_active"
                    class="section"
                    @click="changeProductCardActive(product.id)"
                  >
                    {{ product.name }}
                  </div>
                </div>
              </div>
            </div>
            <icon-two-arrows-icon />
            <div
              class="rounded-large border-grey w-[46%]"
              :class="cardProductFilterData(true) && 'pr-1'"
            >
              <div
                class="add-remove-card"
                :class="cardProductFilterData(true) && 'pr-1'"
              >
                <div
                  v-for="item in productCategoryWithProducts"
                  :key="item.id"
                  v-show="cardProductCategoriesFilterData(item.id, true)"
                  class="section-products"
                  :class="cardProductFilterData(true) && 'border-r-1'"
                >
                  <div
                    class="category"
                    @click="changeProductCategoryCardActive(item.id, false)"
                  >
                    {{ item?.name }}
                  </div>
                  <div
                    v-for="product in item.products"
                    :key="product.id"
                    v-show="product.card_active"
                    class="section"
                    @click="changeProductCardActive(product.id)"
                  >
                    {{ product.name }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template v-if="allowToUpdate" #footer>
      <div class="flex justify-end gap-x-4">
        <m-btn
          :loading="agentStore.isAgentLimitAttachLoading"
          @click="addRemoveAgentLimit('attach')"
        >
          {{ t("users.agents.add_products_agent_list") }}
        </m-btn>
        <m-btn
          group="delete"
          :loading="agentStore.isAgentLimitUnAttachLoading"
          @click="addRemoveAgentLimit('unattach')"
        >
          {{ t("users.agents.remove_products_from_agent_list") }}
        </m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import { defaultDropdownParams } from "~/variable/params";
import { useNotification } from "@kyvg/vue3-notification";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import type { DropdownsByFilterStates } from "#components";
// store
const agentStore = useAgentsStore("true");
const filtersStore = useFiltersStore("/users/agent/agent-multiple-limit");
// props
const props = defineProps<{
  allowToUpdate: boolean;
}>();
// emits

const emit = defineEmits(["closeDialog"]);

// state
const { t } = useI18n();
const priceTypeParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});
const productCategoryParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});
const DropdownComponent = ref<typeof DropdownsByFilterStates>(null);

const productsParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});

const priceType = ref();
const productCategory = ref();
const products = ref();
const modalLoading = ref(false);
const filterStates = ref<Array<FilterStateModel<object>>>([
  {
    name: t("column.product_group"),
    key: "product-group",
    get data() {
      return filtersStore.productGroup || [];
    },
    get getSelectedData() {
      return filtersStore.selectedProductGroup;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedProductGroup = value;
      productsParams.value.filter = [
        {
          field: "product_group_id",
          value: value,
        },
      ];
      getProducts();
    },
  },
]);
// methods

const cardPriceFilterData = (card_active: boolean) => {
  return priceType.value.items?.filter(
    (item) => item.card_active === card_active
  );
};

const cardProductCategoriesFilterData = (id: string, card_active: boolean) => {
  return (
    products.value.items?.filter(
      (item) => item.category.id === id && item.card_active === card_active
    )?.length > 0
  );
};

const cardProductFilterData = (card_active: boolean) => {
  return (
    products.value.items?.filter((item) => item.card_active === card_active)
      ?.length > 10
  );
};

const changePriceCardActive = (id: string) => {
  priceType.value.items = priceType.value.items?.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        card_active: !item.card_active,
      };
    }
    return item;
  });
};

const changeProductCategoryCardActive = (id: string, card_active: boolean) => {
  products.value.items = products.value.items?.map((item) => {
    if (item.category.id === id) {
      return {
        ...item,
        card_active: card_active,
      };
    }
    return item;
  });
};

const changeProductCardActive = (id: string) => {
  products.value.items = products.value.items?.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        card_active: !item.card_active,
      };
    }
    return item;
  });
};

const closeDialog = () => {
  emit("closeDialog");
  DropdownComponent.value.onClearFilter();
  filtersStore.selectedProductGroup = [];
};

const addRemoveAgentLimit = async (type: string) => {
  const { notify } = useNotification();
  const checkProducts = products.value.items
    ?.filter((item) => item.card_active)
    ?.map((item) => item.id);

  const checkPriceTypes = priceType.value.items
    ?.filter((item) => item.card_active)
    ?.map((item) => item.id);

  const agentIds = agentStore.editMultipleDialog.map((item) => item?.id);

  if (checkProducts?.length > 0 || checkPriceTypes?.length > 0) {
    const postData = {
      agent_id_arr: agentIds,
      product_id_arr: checkProducts,
      price_type_id_arr: checkPriceTypes,
    };
    if (type === "attach") {
      await agentStore.agentLimitAttach(postData);
    } else {
      await agentStore.agentLimitUnattach(postData);
    }
    closeDialog();
  } else {
    notify({
      title: t("users.agents.you_didnt_make_any_changes"),
      type: "error",
    });
  }
};

const getPriceTypes = async () => {
  priceType.value = await agentStore.getPriceTypes(priceTypeParams.value);
  priceType.value.items = priceType.value.items?.map((item) => {
    return {
      ...item,
      card_active: false,
    };
  });
};

const getProducts = async () => {
  products.value = await agentStore.getProducts(productsParams.value);
  products.value.items = products.value.items?.map((item) => {
    return {
      ...item,
      card_active: false,
    };
  });
};

// hooks

onMounted(async () => {
  modalLoading.value = true;
  if (agentStore.editMultipleDialog?.length === 0) {
    agentStore.autoGetAgentIds();
  }
  try {
    productCategory.value = await agentStore.getProductCategories(
      productCategoryParams.value
    );
    await getProducts();
    await getPriceTypes();
  } catch (e) {
    console.log(e);
  } finally {
    modalLoading.value = false;
  }
});

const productCategoryWithProducts = computed(() => {
  return productCategory.value.items?.map((item) => {
    const filteredProducts = products.value.items?.filter(
      (product) => product.category.id === item.id
    );
    return {
      ...item,
      products: filteredProducts,
    };
  });
});

const agentsName = computed(() => {
  if (agentStore.editMultipleDialog?.length > 0) {
    let fullName = agentStore.editMultipleDialog?.map(
      (item) => item?.full_name
    );
    return fullName;
  } else {
    return [
      agentStore.data?.items?.find((item) => item.id === props.agentInfo.id)
        ?.full_name,
    ];
  }
});
<\/script>

<style scoped lang="scss">
.agent-add-remove-limit {
  .page-body {
    display: flex;
    justify-content: space-between;
    gap: 40px;
    margin-top: 20px;
    align-items: start;

    .limit-cards {
      width: 50%;

      .title {
        font-family: "Inter", sans-serif;
        font-weight: 400;
        font-size: 16px;
        color: #424f4f;
      }

      .limit-cards-content {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .add-remove-card {
          width: 100%;
          height: 450px;
          overflow-y: auto;

          .section {
            padding: 8px 18px;
            color: #424f4f;
            font-size: 14px;
            font-weight: 400;
            font-family: "Inter", sans-serif;
            cursor: pointer;
            border-bottom: 1px solid #e1e4e4;
          }

          .section:hover {
            background: #299b9b0d;
            color: #299b9b;
          }

          .section:last-child {
            border-bottom: none;
          }

          .section-products {
            .category {
              padding: 8px;
              color: #299b9b;
              font-size: 13px;
              font-weight: 600;
              font-family: "Inter", sans-serif;
              cursor: pointer;
            }

            .category:hover {
              background: #299b9b0d;
            }

            .section:last-child {
              border-bottom: none;
            }
          }
        }
      }
    }
  }
}

::-webkit-scrollbar {
  width: 6px;
  border-radius: 28px;
  height: 8px;
}

::-webkit-scrollbar-track {
  height: 8px;
  background: #e1e4e4;
  border-radius: 28px;
}

::-webkit-scrollbar-thumb {
  background: #299b9b;
  border-radius: 28px;
  height: 8px;
}
</style>
`;export{n as default};
