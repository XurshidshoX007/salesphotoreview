const n=`<template>
  <form @submit.prevent="onApply">
    <d-modal
      :name="t('orders.add_bonus')"
      dataContainerWidth="850px"
      @closeDialog="closeDialog"
    >
      <div>
        <flex-col v-if="isManual" class="gap-3">
          <rounded-white-container
            v-for="(bonus, idx) in bonuses"
            :key="bonus.bonus_id || bonus"
            without-padding
            class="w-full py-2 flex items-center justify-between"
          >
            <div>
              <div class="font-semibold text-lg">{{ bonus?.bonus_name }}</div>
              <div class="text-gray-2">
                {{ t("column.quantity") }}: {{ bonus?.amount_limit }}
              </div>
            </div>
            <Checkbox
              class="scale-150"
              :checked="data[idx]?.bonus_id === bonus?.bonus_id"
              @change="onSelectManualBonus(bonus?.bonus_id, $event)"
            />
          </rounded-white-container>
        </flex-col>
        <flex-col class="gap-3 relative">
          <div class="grid gap-4">
            <flex-col class="page-gap">
              <div
                v-for="(bonus, bonusIdx) in filteredBonuses"
                :key="bonus.bonus_id"
              >
                <div @click="onOpenBonusTable(bonusIdx)">
                  <ToggleDataViewBtn v-if="data?.length" noPadding>
                    <template #header>
                      <div
                        class="flex justify-between items-center w-full flex-wrap gap-3"
                      >
                        <div class="flex items-center gap-1">
                          <div class="font-semibold whitespace-nowrap">
                            {{ t("column.bonus_name") }}:
                          </div>
                          <span class="text-primary-600 cursor-pointer">{{
                            bonus?.bonus_name
                          }}</span>
                        </div>
                        <div class="font-semibold">
                          {{ t("orders.accrued_per_bonuses") }}:
                          <span class="text-primary-600"
                            >{{ bonus?.amount_limit }}
                          </span>
                        </div>
                      </div>
                    </template>
                    <template #body>
                      <transition name="toggle-accordion">
                        <div class="border rounded-lg overflow-auto">
                          <data-table
                            :headers="templates"
                            @sort="incomeStore.sortData"
                            :sorted="incomeStore.params.order_by"
                            withInformationAboveHeader
                            class="relative rounded-lg bg-white"
                          >
                            <template #body>
                              <c-tr
                                v-for="(product, index) in bonus.products"
                                :trBg="false"
                                :key="product.product_id"
                              >
                                <c-td-no-edit
                                  v-for="key in templates"
                                  :key="key.key"
                                  custom-padding
                                  class="px-2 py-1"
                                >
                                  <div
                                    class="flex justify-end"
                                    v-if="key?.key === 'amount'"
                                  >
                                    <d-input
                                      type="number"
                                      :title="
                                        getCountInputTitle(
                                          bonus.must_give_same_products_as_ordered,
                                          product?.max_allowed_amount
                                        )
                                      "
                                      min="0"
                                      :max="
                                        getMaxAmount(
                                          bonus.products,
                                          bonus.amount_limit,
                                          index,
                                          bonus.must_give_same_products_as_ordered,
                                          bonus.bonus_id,
                                          product.product_id
                                        )
                                      "
                                      :value="product.amount"
                                      @change="product.amount = $event"
                                    />
                                  </div>
                                  <div
                                    v-else-if="
                                      key.key === 'amount_in_warehouse'
                                    "
                                    class="text-end"
                                  >
                                    {{ getFormattedAmount(product[key.key]) }}
                                  </div>
                                  <div v-else class="py-2">
                                    <div>
                                      {{ product[key.key] }}
                                    </div>
                                  </div>
                                </c-td-no-edit>
                              </c-tr>
                            </template>
                            <template #footer>
                              <c-tr class="bg-lotion border-b-0">
                                <c-td-no-edit v-for="key in templates">
                                  <div
                                    v-if="key.key === 'product_name'"
                                    class="text-start fs-14 font-semibold"
                                  >
                                    {{ t("orders.unused_bonuses") }}
                                  </div>
                                  <div
                                    v-else-if="key.key === 'amount'"
                                    class="text-end fs-14 font-semibold px-4"
                                  >
                                    <div
                                      class="font-semibold"
                                      :class="
                                        getRemainingBonusAmount(
                                          bonus.products,
                                          bonus?.amount_limit
                                        ) === 0
                                          ? 'text-black'
                                          : 'text-red-3'
                                      "
                                    >
                                      {{
                                        getRemainingBonusAmount(
                                          bonus.products,
                                          bonus?.amount_limit
                                        )
                                      }}
                                    </div>
                                  </div>
                                </c-td-no-edit>
                              </c-tr>
                            </template>
                          </data-table>
                        </div>
                      </transition>
                    </template>
                  </ToggleDataViewBtn>
                </div>
              </div>
            </flex-col>
          </div>
        </flex-col>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <m-btn
            :loading="isSaveLoading"
            :disabled="isDisabledBonus"
            type="submit"
            >{{ t("apply") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import type {
  BonusProductModel,
  OrderBonusesModel,
} from "~/interfaces/api/orders/order-bonuses-model";
import { useI18n } from "vue-i18n";

// store
const incomeStore = useIncomesStore("true");

// props
const props = defineProps<{
  bonuses: OrderBonusesModel[];
  isManual?: Boolean;
  isSaveLoading: Boolean;
}>();

// emits
const emit = defineEmits(["onApplyBonus", "closeDialog"]);

// states
const { t } = useI18n();
const data = ref(props.bonuses || null);
const closedTables = ref<number[]>([]);
const amountLimit = ref<number>(0);

const orderBonuses = ref(JSON.parse(JSON.stringify(props.bonuses)));

const templates = ref<Template[]>([
  {
    name: t("column.bonus_products"),
    checked: true,
    key: "product_name",
    is_sortable: false,
  },
  {
    name: t("column.to_warehouse"),
    checked: true,
    key: "amount_in_warehouse",
    is_sortable: false,
    right: true,
  },
  {
    name: t("column.quantity"),
    checked: true,
    key: "amount",
    is_sortable: false,
    right: true,
  },
]);

// hooks
watchEffect(() => {
  if (props.bonuses) {
    data.value = props.bonuses;
  }
});

const filteredBonuses = computed(() => {
  return data.value;
});

const filteredPostData = computed(() => {
  return data.value.flatMap((bonus) =>
    bonus.products
      .map(
        (product) =>
          product.amount > 0 && {
            bonus_id: bonus.bonus_id,
            count: product.amount,
            product_id: product.product_id,
            price: 0,
          }
      )
      .filter(Boolean)
  );
});

const isUnusedBonus = computed(() => {
  return !filteredBonuses.value.some((item) => {
    const bonusCount =
      item.amount_limit -
      item.products.reduce((acc, product) => acc + product.amount, 0);
    return bonusCount > 0;
  });
});

const isDisabledBonus = computed(() => {
  return !filteredBonuses.value?.every((item) => {
    if (item.must_give_same_products_as_ordered) {
      const checkProductsByBonusId = orderBonuses.value?.find(
        (chItem) => chItem.bonus_id === item.bonus_id
      )?.products;

      return item.products?.every((product) => {
        const checkProduct = checkProductsByBonusId?.find(
          (nItem) => nItem.product_id === product.product_id
        );
        return checkProduct?.max_allowed_amount >= product.amount;
      });
    }

    const totalProductAmount = item.products.reduce(
      (acc, product) => acc + product.amount,
      0
    );
    const bonusCount = item.amount_limit - totalProductAmount;
    return bonusCount >= 0;
  });
});

// methods
const onApply = async () => {
  emit("onApplyBonus", filteredPostData.value, isUnusedBonus.value);
};

const getMaxAmount = (
  products: BonusProductModel[],
  limit: number,
  currentIndex: number,
  must_give_same_products_as_ordered: boolean,
  bonus_id: string,
  product_id: string
) => {
  if (must_give_same_products_as_ordered) {
    const checkProductsByBonusId = orderBonuses.value?.find(
      (item) => item.bonus_id === bonus_id
    )?.products;
    const checkProduct = checkProductsByBonusId?.find(
      (item) => item.product_id === product_id
    );
    if (checkProduct?.max_allowed_amount > checkProduct?.amount_in_warehouse) {
      return checkProduct?.amount_in_warehouse;
    }
    return checkProduct?.max_allowed_amount;
  } else {
    let currentTotalAmount = 0;
    let amountInWarehouse = products[currentIndex]?.amount_in_warehouse || 0;

    for (let i = 0; i < products.length; i++) {
      const amount = parseFloat(products[i]?.amount);
      currentTotalAmount += i === currentIndex ? 0 : amount || 0;
    }

    const remainingAmount = limit - currentTotalAmount;

    if (remainingAmount > amountInWarehouse) {
      return amountInWarehouse;
    }

    if (Math.min(remainingAmount, amountInWarehouse) < 0) return 0;

    amountLimit.value = Math.min(remainingAmount, amountInWarehouse);
    return Math.min(remainingAmount, amountInWarehouse);
  }
};

const getRemainingBonusAmount = (
  products: BonusProductModel[],
  limit: number
) => {
  return limit - products.reduce((acc, product) => acc + product.amount, 0);
};

const onOpenBonusTable = (tableIdx: number) => {
  if (isTableOpen(tableIdx)) closedTables.value.push(tableIdx);
  else
    closedTables.value = closedTables.value.filter((idx) => idx !== tableIdx);
};

const isTableOpen = (tableIdx: number) => {
  return !closedTables.value.includes(tableIdx);
};

const onSelectManualBonus = (bonusId: string, isBonusChecked: boolean) => {
  if (!isBonusChecked) {
    data.value = data.value.filter((bonus) => bonus?.bonus_id !== bonusId);
  } else {
    const bonus = props.bonuses.find((bonus) => bonus?.bonus_id === bonusId);
    data.value.push(bonus);
  }
};

const getCountInputTitle = (
  must_give_same_products_as_ordered: boolean,
  max_allowed_amount: number | null
) => {
  if (must_give_same_products_as_ordered && max_allowed_amount) {
    return \`\${t("column.max_bonus")}: \${getFormattedAmount(
      max_allowed_amount
    )}\`;
  }
  return "";
};

const closeDialog = () => emit("closeDialog");
<\/script>
`;export{n as default};
