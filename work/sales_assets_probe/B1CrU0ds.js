const n=`<template>
  <d-modal
    dataContainerWidth="700px"
    :name="t('column.approve')"
    only-close-dialog
    @closeDialog="closeDialog"
  >
    <div>
      <div
        v-for="bonus in filteredBonuses"
        :key="bonus?.bonus_id"
        class="bonus-card"
      >
        <div class="remainder">
          <div class="key">{{ t("column.bonus_name") }}:</div>
          <div class="value">{{ bonus?.bonus_name }}</div>
        </div>
        <div class="remainder">
          <div class="key">{{ t("orders.unused_bonuses") }} :</div>
          <div class="value">
            {{ getRemainingBonusAmount(bonus?.products, bonus?.amount_limit) }}
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-between items-center">
        <m-btn @click="closeDialog" group="outlined">{{
          t("clients.cancel")
        }}</m-btn>
        <m-btn :loading="loading" @click="onSave">{{
          t("column.approve")
        }}</m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type {
  BonusProductModel,
  OrderBonusesModel,
} from "~/interfaces/api/orders/order-bonuses-model";
// props
const props = defineProps<{
  bonuses: OrderBonusesModel[];
  loading: Boolean;
}>();
// emit
const emit = defineEmits(["closeDialog", "onSave"]);

// states
const { t } = useI18n();
const data = ref(props.bonuses || null);
// methods
const getRemainingBonusAmount = (
  products: BonusProductModel[],
  limit: number,
) => {
  return limit - products.reduce((acc, product) => acc + product.amount, 0);
};

const closeDialog = () => emit("closeDialog");

const onSave = () => emit("onSave");

// hooks

const filteredBonuses = computed(() => {
  return data.value;
});
<\/script>

<style scoped lang="scss">
.content-header {
  .title {
    text-align: center;
    font-size: 20px;
    color: #299b9b;
    font-weight: 600;
    font-family: "Inter", sans-serif;
  }
}

.bonus-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  gap: 0 8px;
  border-bottom: 1px solid #e1e4e4;

  .remainder {
    display: flex;
    align-items: center;
    padding: 4px 0;
    gap: 4px;

    .key {
      font-size: 14px;
      color: #8fa0a0;
      font-weight: 400;
      font-family: "Inter", sans-serif;
    }

    .value {
      font-size: 16px;
      color: #424f4f;
      font-weight: 500;
      font-family: "Inter", sans-serif;
    }
  }
}
.bonus-card:last-child {
  border-bottom: none;
}
</style>
`;export{n as default};
