const n=`<template>
  <d-modal
    :name="t('orders.partial_return') + ' ' + visualId"
    dataContainerWidth="1140px"
    only-close-dialog
    @closeDialog="closeDialog"
  >
    <div class="flex flex-col gap-5 relative">
      <div v-show="orderDetail?.approval_information?.is_approved">
        <div class="flex items-center gap-2">
          <div>Подтверждено:</div>
          <div class="text-gray-3 font-semibold">
            {{ orderDetail?.approval_information?.approved_by_user?.name }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div>Дата подтверждении:</div>
          <div class="text-gray-3 font-semibold">
            {{
              getFormattedDate(
                orderDetail?.approval_information?.approved_date,
                "DD.MM.YYYY HH:mm",
              )
            }}
          </div>
        </div>
      </div>

      <Stepper
        v-if="orderDetail?.show_bonus_return_button"
        ref="StepperComponent"
        :totalSteps="2"
        :labels="stepperLabels"
      >
        <template #content-1>
          <div key="productDetail" class="flex flex-col gap-4">
            <FlexibleItemsMenu
              indicator-mode
              with-border
              :loading="isLoading"
              :items-arr="productCategories"
              :active-item-id="activeCategoryId"
              @onChangeActiveItem="activeCategoryId = $event"
            />
            <OrdersOrdersPartialReturnTable
              type="product"
              :headers="headers"
              :products="filteredProducts"
              :is-loading="isLoading"
              :all-inputs-disabled="
                !orderDetail?.show_approve_button &&
                !orderDetail?.show_save_button
              "
              @updateProduct="updateProduct"
            />
          </div>
        </template>
        <template #content-2>
          <div key="bonusDetail" class="flex flex-col gap-4">
            <FlexibleItemsMenu
              indicator-mode
              :invalid-item-ids="invalidBonusIdsWithMinReturn"
              :loading="isLoading || isGetBonusBtnLoading"
              :items-arr="bonuses"
              :active-item-id="activeBonusId"
              @onChangeActiveItem="activeBonusId = $event"
              class="m-2"
            />
            <OrdersOrdersPartialReturnTable
              type="bonus"
              :headers="headers"
              :products="filteredBonusProducts"
              :is-loading="isGetBonusBtnLoading"
              :min-returning-amount="activeBonusMinReturningAmount"
              :all-inputs-disabled="
                !orderDetail?.show_approve_button &&
                !orderDetail?.show_save_button
              "
              @updateProduct="updateBonusProduct"
            />
          </div>
        </template>
      </Stepper>
    </div>
    <template #footer>
      <div class="w-full flex page-gap justify-end items-center">
        <div
          class="flex items-center page-gap transition-all duration-400"
          :class="{
            'opacity-100':
              showBonusDetail && !orderDetail?.show_bonus_return_button,
            'opacity-0':
              !showBonusDetail && orderDetail?.show_bonus_return_button,
          }"
        >
          <m-btn
            v-if="orderDetail?.show_approve_button"
            :loading="isApproveBtnLoading"
            :disabled="isApproveBtnDisabled"
            @click="onApprove"
            >Подтвердить</m-btn
          >
          <m-btn
            v-if="orderDetail?.show_save_and_approve_button"
            :disabled="isSaveAndApproveBtnDisabled"
            @click="showWarnPupup = true"
            >Сохранить и подтвердить</m-btn
          >
          <m-btn
            v-if="orderDetail?.show_save_button"
            :loading="isSaveBtnLoading"
            :disabled="isSaveBtnDisabled"
            @click="onSave"
            >Сохранить</m-btn
          >
        </div>
        <m-btn
          v-if="orderDetail?.show_bonus_return_button"
          :loading="isGetBonusBtnLoading"
          group="blue"
          class="trnasition-all rellative overflow-hidden"
          :disabled="isNextBtnDisabled && !showBonusDetail"
          @click.stop="onToggle"
        >
          <transition :name="transitionName" mode="out-in">
            <div v-if="!showBonusDetail" key="bonusDetail">
              Далее <fa-icon hash="&#xf054;" />
            </div>
            <div v-else key="productDetail">
              <fa-icon hash="&#xf053;" /> Назад
            </div>
          </transition>
        </m-btn>
      </div>
    </template>
    <transition name="modal">
      <div v-if="showWarnPupup">
        <ConfirmationDialog
          modal-name="Предупреждение"
          :is-save-btn-loading="isSaveBtnLoading"
          :is-save-and-approve-btn-loading="isSaveAndApproveBtnLoading"
          page="order-return"
          @onSave="onSave"
          @onSaveAndApprove="onSaveAndApprove"
          @closeDialog="showWarnPupup = false"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="errorMessagge">
        <d-modal :name="t('error')" @closeDialog="errorMessagge = ''">
          <Internal500 :message="errorMessagge" />
        </d-modal>
      </div>
    </transition>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { Template } from "~/interfaces/ui/template";
import type { Stepper } from "#components";
import type {
  OrderPartialReturnBonusModel,
  OrderPartialReturnBonusProductModel,
} from "~/interfaces/api/orders/order-partial-return-bonus-model";
import type {
  orderPartialReturnDetailModel,
  OrderPartialReturnProductModel,
  ProductCategoriesModel,
} from "~/interfaces/api/orders/order-partial-return-detail-model";
import type { ReturningProductModel } from "~/interfaces/api/orders/order-partial-return-model";

// store
const orderStore = useOrdersStore("main");

// child components
const StepperComponent = ref<typeof Stepper | null>(null);

// props
const props = defineProps<{
  orderId: string;
}>();

const emit = defineEmits(["closeDialog"]);

// states
const { t } = useI18n();
const isLoading = ref<boolean>(false);
const isSaveBtnLoading = ref<boolean>(false);
const isApproveBtnLoading = ref<boolean>(false);
const isSaveAndApproveBtnLoading = ref<boolean>();
const isNextBtnDisabled = ref<boolean>();
const isGetBonusBtnLoading = ref<boolean>(false);
const showWarnPupup = ref<boolean>();
const showBonusDetail = ref<boolean>();
const stepperLabels = ref<string[]>([
  "Выбор возвращаемых товаров",
  "Выбор возвращаемых бонусов",
]);
const errorMessagge = ref<string>();

// product-return
const orderDetail = ref<orderPartialReturnDetailModel>();
const activeCategoryId = ref<string>();
const returningProducts = ref<ReturningProductModel[]>([]);

// bonus-return
const bonusDetail = ref<OrderPartialReturnBonusModel[]>();
const activeBonusId = ref<string>();
const returningBonusProducts = ref<ReturningProductModel[]>([]);

const headers = ref<Template[]>([
  {
    name: "Ассортимент",
    key: "product_name" as keyof OrderPartialReturnProductModel,
    background: "1px solid red",
    checked: true,
    is_sortable: false,
  },
  {
    name: "Количество",
    key: "total_count" as keyof OrderPartialReturnProductModel,
    checked: true,
    is_sortable: false,
  },
  {
    name: "Возврат",
    key: "returning_count" as keyof OrderPartialReturnProductModel,
    checked: true,
    is_sortable: false,
    view: "input",
  },
  {
    name: "Доставлен",
    key: "deliviring_count" as keyof OrderPartialReturnProductModel,
    checked: true,
    is_sortable: false,
    view: "input",
  },
  {
    name: "Цена",
    key: "price" as keyof OrderPartialReturnProductModel,
    checked: true,
    is_sortable: false,
    view: "input",
  },
  {
    name: "Сумма",
    key: "total_cost" as keyof OrderPartialReturnProductModel,
    checked: true,
    is_sortable: false,
    view: "input",
  },
]);

// hooks
onMounted(async () => {
  isLoading.value = true;
  await getOrderDetail();
  isLoading.value = false;
});

const transitionName = computed(() => {
  return showBonusDetail.value ? "slide-fade-right" : "slide-fade-left";
});

const visualId = computed(() => {
  return (
    orderStore.data?.items?.find((order) => order.id === props.orderId)
      ?.visual_id || ""
  );
});

const isSaveBtnDisabled = computed(() => {
  if (isNextBtnDisabled.value) {
    return true;
  }
  return (
    invalidBonusIdsWithMinReturn.value.length > 0 ||
    (!isReturnProductsChanged.value && !isReturnBonusProductsChanged.value)
  );
});

const isApproveBtnDisabled = computed(() => {
  return (
    invalidBonusIdsWithMinReturn.value.length > 0 ||
    isReturnProductsChanged.value ||
    isReturnBonusProductsChanged.value
  );
});

const isSaveAndApproveBtnDisabled = computed(() => {
  return isSaveBtnDisabled.value;
});

// product-return
const productCategories = computed(() => {
  if (orderDetail.value) {
    return orderDetail.value?.product_categories.map(
      (productCategory: ProductCategoriesModel) => productCategory.category,
    );
  }
  return [];
});

const products = computed(() => {
  const result = ref<OrderPartialReturnProductModel[]>();

  if (orderDetail.value) {
    result.value = orderDetail.value.product_categories.flatMap(
      (productCategory: ProductCategoriesModel) =>
        productCategory.products.map(
          (product: OrderPartialReturnProductModel) => ({
            ...product,
            category_id: productCategory.category.id,
          }),
        ),
    );
  }
  return result.value;
});

const filteredProducts = computed(() => {
  return products.value?.filter(
    (product) => product.category_id === activeCategoryId.value,
  );
});

const isReturnProductsChanged = computed(() => {
  const productsBeforeChange =
    orderDetail.value?.product_categories.flatMap(
      (category) => category.products,
    ) || [];

  return (
    returningProducts.value?.some((product) => {
      const productBeforeChange = productsBeforeChange.find(
        (productBeforeChange) =>
          productBeforeChange.product_id === product.product_id,
      );
      return productBeforeChange?.returning_count !== product.returning_count;
    }) || false
  );
});

// bonus-return
const bonuses = computed(() => {
  if (bonusDetail.value) {
    return bonusDetail.value?.map(({ name, id, min_returning_amount }) => ({
      name,
      id,
      min_returning_amount,
    }));
  }
  return [];
});

const bonusProducts = computed(() => {
  const result = ref<OrderPartialReturnBonusProductModel[]>();
  if (bonusDetail.value) {
    result.value = bonusDetail.value?.flatMap((bonus) =>
      bonus.products.map((product) => ({ ...product, bonus_id: bonus.id })),
    );
  }
  return result.value;
});

const filteredBonusProducts = computed(() => {
  return bonusProducts.value?.filter(
    (product) => product.bonus_id === activeBonusId.value,
  );
});

const activeBonusMinReturningAmount = computed(() => {
  return bonuses.value.find((bonus) => bonus.id === activeBonusId.value)
    ?.min_returning_amount;
});

const invalidBonusIdsWithMinReturn = computed(() => {
  const invalidBonusIds: string[] = [];
  bonuses.value.forEach((bonus) => {
    const bonusProducts = returningBonusProducts.value?.filter(
      (product) => product.bonus_id === bonus.id,
    );
    const totalReturningAmount = bonusProducts?.reduce(
      (acc, product) => acc + product.returning_count,
      0,
    );
    if (totalReturningAmount < bonus.min_returning_amount) {
      invalidBonusIds.push(bonus.id);
    }
  });

  return invalidBonusIds;
});

const isReturnBonusProductsChanged = computed(() => {
  const productsBeforeChange =
    bonusDetail.value?.flatMap((bonus) =>
      bonus.products.map((product) => ({ ...product, bonus_id: bonus.id })),
    ) || [];

  return (
    returningBonusProducts.value?.some((product) => {
      const productBeforeChange = productsBeforeChange.find(
        (productBeforeChange) => {
          if (productBeforeChange.bonus_id === product.bonus_id) {
            return productBeforeChange.product_id === product.product_id;
          }
        },
      );
      return productBeforeChange?.returning_count !== product.returning_count;
    }) || false
  );
});

// methods
const getOrderDetail = async (): Promise<void> => {
  orderDetail.value = await orderStore.getPartailReturnDetail(props.orderId);
};

const onCalculateTotalSum = (
  deliveringCountAfterReturn: number,
  price: number,
): number => {
  return deliveringCountAfterReturn * price;
};

// product-return
const updateProduct = (
  productId: string,
  returningCount: number,
  deliveringCountAfterReturn: number,
  price: number,
) => {
  let updatingProductIdx: number = products.value!.findIndex(
    (product) => product.product_id === productId,
  );
  if (updatingProductIdx !== -1) {
    products.value![updatingProductIdx] = {
      ...products.value![updatingProductIdx],
      returning_count: returningCount,
      deliviring_count: deliveringCountAfterReturn,
      total_cost: onCalculateTotalSum(deliveringCountAfterReturn, price),
    };
  }
  isNextBtnDisabled.value = typeof returningCount !== "number";
  updateReturningProducts();
};

const updateReturningProducts = () => {
  returningProducts.value = products.value!.map((product) => ({
    deliviring_count: product.deliviring_count,
    product_id: product.product_id,
    returning_count: product.returning_count,
  }));
};

// bonus-return
const updateBonusProduct = (
  productId: string,
  returningCount: number,
  deliveringCountAfterReturn: number,
  price: number,
  bonusId: string,
) => {
  let updatingProductIdx: number = bonusProducts.value!.findIndex((product) => {
    if (product.bonus_id === bonusId) {
      return product.product_id === productId;
    }
  });
  if (updatingProductIdx !== -1) {
    bonusProducts.value![updatingProductIdx] = {
      ...bonusProducts.value![updatingProductIdx],
      returning_count: returningCount,
      deliviring_count: deliveringCountAfterReturn,
      total_cost: onCalculateTotalSum(deliveringCountAfterReturn, price),
    };
  }
  isNextBtnDisabled.value = typeof returningCount !== "number";
  updateReturningBonusProducts();
};

const updateReturningBonusProducts = () => {
  returningBonusProducts.value = bonusProducts.value!.map((product) => ({
    deliviring_count: product.deliviring_count,
    product_id: product.product_id,
    returning_count: product.returning_count,
    bonus_id: product.bonus_id,
  }));
};

const validateReturningProducts = () => {
  !returningProducts.value.length && updateReturningProducts();
};

const closeDialog = () => {
  emit("closeDialog");
};

const checkForResponse = async (response: string | Response | undefined) => {
  if (response !== "error") {
    closeDialog();
    await orderStore.refresh();
  }
};

const checkForMinReturningBonusAmount = () => {
  if (invalidBonusIdsWithMinReturn.value.length) {
    const bonusNames = bonuses.value
      .filter((bonus) => invalidBonusIdsWithMinReturn.value.includes(bonus.id))
      .map((bonus) => bonus.name)
      .join(", ");
    errorMessagge.value = \`Минимальное количество возврата не верно для бонусов: \${bonusNames}\`;
    return false;
  }
  return true;
};

const onToggle = async () => {
  if (!showBonusDetail.value) {
    await getBonuses();
    StepperComponent.value?.nextStep();
  } else {
    StepperComponent.value?.previousStep();
  }
  showBonusDetail.value = !showBonusDetail.value;
};

const onSave = async () => {
  validateReturningProducts();
  if (!checkForMinReturningBonusAmount()) return;

  isSaveBtnLoading.value = true;
  const data = {
    order_id: props.orderId,
    items: [...returningProducts.value, ...returningBonusProducts.value],
  };
  const res = await orderStore.setPartialReturn(data);
  checkForResponse(res);
  isSaveBtnLoading.value = false;
};

const onApprove = async () => {
  validateReturningProducts();
  isApproveBtnLoading.value = true;
  const data = {
    order_id: props.orderId,
    items: [...returningProducts.value, ...returningBonusProducts.value],
  };
  const res = await orderStore.setPartialReturnApprove(data);
  checkForResponse(res);
  isApproveBtnLoading.value = false;
};

const onSaveAndApprove = async () => {
  validateReturningProducts();
  if (!checkForMinReturningBonusAmount()) return;
  isSaveAndApproveBtnLoading.value = true;
  const data = {
    order_id: props.orderId,
    items: [...returningProducts.value, ...returningBonusProducts.value],
  };
  const res = await orderStore.setPartialReturnSaveAndApprove(data);
  checkForResponse(res);
  isSaveAndApproveBtnLoading.value = false;
};

const getBonuses = async () => {
  validateReturningProducts();
  isGetBonusBtnLoading.value = true;
  const payload = {
    order_id: props.orderId,
    items: returningProducts.value,
  };
  const data = await orderStore.getPartailReturnBonusData(payload);
  bonusDetail.value = data;
  isGetBonusBtnLoading.value = false;
};
<\/script>

<style scoped>
.slide-fade-right-enter-active,
.slide-fade-right-leave-active,
.slide-fade-left-enter-active,
.slide-fade-left-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-right-enter,
.slide-fade-left-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-fade-right-leave-active,
.slide-fade-left-enter {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-fade-right-enter-to,
.slide-fade-left-leave,
.slide-fade-left-enter-to,
.slide-fade-right-leave {
  transform: translateX(0);
  opacity: 1;
}
</style>
`;export{n as default};
