const n=`<template>
  <div class="card-content-container">
    <div
      class="card-content"
      :class="{ 'opacity-30': isLoading }"
      :style="cardStyle"
    >
      <div v-show="isLoading" class="card-loading">
        <icon-loading :loading="true" :width="14" :height="14" />
      </div>
      <div v-for="item in totalBalances" :key="item?.name" class="card-balance">
        <div
          :style="{
            backgroundColor: item?.total_balance < 0 ? '#D81313' : '#11823B',
          }"
          class="card-balance-header"
        ></div>
        <div class="card-balance-body">
          <div class="text-center">
            <div
              class="fs-14"
              :class="!item?.is_summary ? 'text-[#94A791]' : 'text-black fw-6'"
            >
              {{ !item?.is_summary ? item?.currency?.name : "Общий" }}
            </div>
            <div v-if="item?.total_balance === null" class="fw-6 text-lg">
              {{ t("column.unknown") }}
            </div>
            <div
              v-else
              :style="{
                color: item?.total_balance < 0 ? '#D81313' : '#11823B',
              }"
              class="fw-6 mt-1 text-lg"
            >
              {{ getFormattedAmount(item?.total_balance) }}
              <span v-if="item?.currency?.code">{{ item.currency.code }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getFormattedAmount } from "~/utils/filter";
import type { BalancesModel } from "~/interfaces/api/users/consignation/balances-model";
import { useI18n } from "vue-i18n";

// state
const { t } = useI18n();
const isCheckCardWidth = ref<number | null>(null);
// props
const props = defineProps<{
  totalBalances: BalancesModel;
  isLoading?: boolean;
}>();

// hooks

const cardStyle = computed(() => {
  return \`grid-template-columns:repeat(auto-fill, minmax(\${isCheckCardWidth.value > 20 ? isCheckCardWidth.value * 10 + 160 : 260}px, 1fr))\`;
});

watch(
  () => props.totalBalances,
  (newBalances) => {
    if (props.totalBalances?.length > 0) {
      const maxBalanceLength = newBalances.reduce((max, item) => {
        const balanceLength = item.total_balance.toString().length;
        return Math.max(max, balanceLength);
      }, 0);
      isCheckCardWidth.value = maxBalanceLength;
    }
  },
  { immediate: true, deep: true }
);
<\/script>

<style lang="scss" scoped>
.card-content-container {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .card-content {
    display: grid;
    //grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); /* Ensures a minimum width of 260px */
    grid-gap: 20px;
    align-items: end;
    position: relative;
    overflow-wrap: break-word;

    .card-loading {
      position: absolute;
      top: 50%;
      left: 50%;
    }

    .card-balance {
      min-width: 200px;
      height: 126px;
      border-radius: 8px;
      background-color: white;

      .card-balance-header {
        height: 10px;
        width: 100%;
        border-radius: 8px 8px 0 0;
      }

      .card-balance-body {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        margin-top: -10px;
        padding: 10px;
      }
    }
  }
}
</style>
`;export{n as default};
