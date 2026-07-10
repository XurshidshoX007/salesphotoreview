const n=`<template>
  <div
    :style="{
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    }"
    class="grid page-gap items-start relative"
    :class="clientsBalancesStore.isSubBalanceCardsLoading && 'opacity-50'"
  >
    <div
      v-for="item in balanceCardsWithTotal"
      :key="item.owner.id"
      class="col-span-1 h-full"
    >
      <div
        :key="item?.owner?.id"
        :class="[
          item?.owner?.id === 'total-id'
            ? 'total-balance-card'
            : (isDepositChecked(item?.owner?.id) && 'balance-card-check') ||
              (balanceCards.length > 1 && 'balance-card') ||
              'balance-card disabled',
        ]"
        @click="onCheckDeposit(item?.owner?.id)"
      >
        <flex-col class="card-header">
          <div class="flex items-center justify-between">
            <div>
              <div class="header-content">
                <Checkbox
                  v-if="item?.owner?.id !== 'total-id'"
                  :id="item.id"
                  :title="item?.owner?.name"
                  :checked="isDepositChecked(item?.owner?.id)"
                  @change="onCheckDeposit(item?.owner?.id)"
                  class="cursor-pointer"
                />
                <div v-else class="title">
                  {{ item?.owner?.name }}
                </div>
              </div>
              <div
                class="text-xl font-semibold"
                :class="{ 'pl-8': item?.owner?.id !== 'total-id' }"
              >
                <div :class="priceColorFunction(item?.total_balance?.amount)">
                  {{ getFormattedAmount(item?.total_balance?.amount) }}
                  {{ item?.total_balance?.base_currency?.name }}
                </div>
              </div>
            </div>

            <icon-exclamation
              v-if="item?.owner?.id !== 'total-id' && !item?.is_active"
              :tooltip="t('clients.invalid_bill')"
              :size="30"
            />
          </div>
        </flex-col>
        <div class="py-2">
          <div
            v-for="balance in item.balances"
            :key="balance.currency.id"
            class="flex items-center justify-between py-1 px-3"
          >
            <div class="text-[#8FA0A0] fs-14">
              {{ balance?.currency?.name }}:
            </div>
            <div class="text-[#424F4F] fs-14">
              {{ getFormattedAmount(balance?.amount) }}
              <span class="text-black">{{ balance?.base_currency?.code }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="loading">
      <IconLoading
        :loading="clientsBalancesStore.isSubBalanceCardsLoading"
        :width="16"
        :height="16"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ClientsClientsSubBalancesModel } from "~/interfaces/api/clients-client-sub-balances-model";
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";
// store'

const clientsBalancesStore = useClientsBalancesStore("main");
// props
const props = defineProps<{
  balanceCards: ClientsClientsSubBalancesModel[];
  hideTotalBlock?: boolean;
  checkedSubDepositIds?: Array<any>;
}>();

// emit
const emit = defineEmits(["onChangeDepositIds"]);

// states
const { t } = useI18n();

// hooks
const totalBalanceCard = computed(() => {
  const checkedCards = clientsBalancesStore.checkedDepositIds.length
    ? checkedBalanceCards.value
    : props.balanceCards;

  const totalBalances = calculateTotalBalances(checkedCards);
  const totalAmount = calculateTotalBalanceAmount(checkedCards);

  return createTotalBalanceCard(totalBalances, totalAmount);
});

const balanceCardsWithTotal = computed(() => {
  if (props.balanceCards?.length) {
    if (props.hideTotalBlock) return props.balanceCards;
    return [totalBalanceCard.value, ...props.balanceCards];
  }
  return [];
});

const checkedBalanceCards = computed(() => {
  return props.balanceCards.filter((card) =>
    clientsBalancesStore.checkedDepositIds.includes(card.owner.id),
  );
});

// methods
const priceColorFunction = (price) => {
  if (price > 0) {
    return "text-[#008000]";
  } else if (price === 0) {
    return "text-[#000]";
  } else {
    return "text-[#FF0000]";
  }
};
const onCheckDeposit = (id: string) => {
  if (id === "total-id") return;
  clientsBalancesStore.checkedDepositIds = !isDepositChecked(id)
    ? [...clientsBalancesStore.checkedDepositIds, id]
    : clientsBalancesStore.checkedDepositIds.filter(
        (ownerId) => ownerId !== id,
      );

  emit("onChangeDepositIds", clientsBalancesStore.checkedDepositIds);
};

const isDepositChecked = (id: string) => {
  return clientsBalancesStore.checkedDepositIds.includes(id);
};

const calculateTotalBalances = (
  balanceCards: ClientsClientsSubBalancesModel[],
): ClientsClientsSubBalancesModel => {
  return balanceCards.reduce((acc, card) => {
    card.balances.forEach(({ amount, currency, base_currency }) => {
      if (!acc[currency.id]) {
        acc[currency.id] = { amount: 0, base_currency, currency };
      }
      acc[currency.id].amount += amount;
    });
    return acc;
  }, {});
};

const calculateTotalBalanceAmount = (
  balanceCards: ClientsClientsSubBalancesModel[],
): number => {
  return balanceCards.reduce((sum, card) => sum + card.total_balance.amount, 0);
};

const createTotalBalanceCard = (
  totalBalances: ClientsClientsSubBalancesModel,
  totalAmount: number,
) => {
  return {
    owner: {
      code: "total-code",
      id: "total-id",
      name: "Общий",
    },
    balances: Object.values(totalBalances),
    total_balance: {
      amount: totalAmount,
      base_currency: props.balanceCards[0]?.total_balance.base_currency,
    },
  };
};
<\/script>

<style lang="scss" scoped>
.total-balance-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e1e4e4;
  cursor: default;
  height: 100%;
  transition: all;

  .card-header {
    line-height: 24px;
    padding: 12px;
    gap: 0 16px;
    border-bottom: 5px solid #d10505;
    .header-content {
      .title {
        line-height: 24px;
        font-family: "Inter", sans-serif;
        font-size: 20px;
        font-weight: 600;
      }
    }
  }
}

.balance-card {
  border-radius: 16px;
  background: white;
  border: 1px solid #e1e4e4;
  cursor: pointer;
  transition: all;
  height: 100%;

  .card-header {
    padding: 12px;
    gap: 0 16px;
    border-bottom: 5px solid #e1e4e4;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}

.disabled {
  pointer-events: none;
}

.balance-card:hover {
  border: 1px solid #23c00a;
}

.balance-card-check {
  border-radius: 16px;
  background: white;
  border: 1px solid #299b9b;
  cursor: pointer;
  transition: all;
  height: 100%;

  .card-header {
    padding: 12px;
    gap: 0 16px;
    border-bottom: 5px solid #e1e4e4;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
}
</style>
`;export{n as default};
