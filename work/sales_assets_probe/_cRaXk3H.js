const n=`<template>
  <div
    ref="carouselContentRef"
    class="carousel-content-for-client-cards"
    v-if="balanceCardsWithTotal?.length"
  >
    <div v-if="!carouselToggle">
      <div class="cards">
        <div
          v-for="item in balanceCardsWithTotal"
          :key="item.owner?.id"
          class="card-item"
        >
          <div
            :key="item?.owner?.id"
            :class="[
              item?.owner?.id === 'total-id'
                ? 'total-balance-card'
                : (isDepositChecked(item?.owner?.id) && 'balance-card-check') ||
                  (clientDetailBalances.length > 1 && 'balance-card') ||
                  'balance-card disabled',
            ]"
            @click="onCheckDeposit(item?.owner?.id)"
          >
            <flex-col class="card-header">
              <div class="flex items-center justify-between gap-x-1">
                <div class="flex items-center gap-x-3">
                  <div
                    class="header-content"
                    v-if="item?.owner?.id !== 'total-id'"
                  >
                    <Checkbox
                      :id="item?.id"
                      :checked="isDepositChecked(item?.owner?.id)"
                      @change="onCheckDeposit(item?.owner?.id)"
                      class="cursor-pointer"
                    />
                  </div>
                  <div>
                    <div class="text-4 text-grey fw-6 text-start">
                      {{ item?.owner?.name }}
                      <div
                        :class="priceColorFunction(item?.total_balance?.amount)"
                      >
                        {{ getFormattedAmount(item?.total_balance?.amount) }}
                        {{ item?.total_balance?.base_currency?.name }}
                      </div>
                    </div>
                  </div>
                </div>
                <icon-exclamation
                  v-if="item?.owner?.id !== 'total-id' && !item?.is_active"
                  :tooltip="t('clients.invalid_bill')"
                />
              </div>
            </flex-col>
            <div class="py-2">
              <div
                v-for="balance in item.balances"
                :key="balance?.base_currency?.id"
                class="flex items-center justify-between py-1 px-3"
              >
                <div class="text-[#8FA0A0] fs-14">
                  {{ balance?.currency?.name }}:
                </div>
                <div class="text-[#424F4F] fs-14">
                  {{ getFormattedAmount(balance?.amount) }}
                  <span class="text-black">{{
                    balance?.base_currency?.code
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Carousel
      v-else
      ref="carouselRef"
      v-bind="settings"
      :breakpoints="breakpoints"
    >
      <Slide v-for="item in balanceCardsWithTotal" :key="item.owner?.id">
        <div
          :key="item?.owner?.id"
          :class="[
            item?.owner?.id === 'total-id'
              ? 'total-balance-card'
              : (isDepositChecked(item?.owner?.id) && 'balance-card-check') ||
                (clientDetailBalances.length > 1 && 'balance-card') ||
                'balance-card disabled',
          ]"
          @click="onCheckDeposit(item?.owner?.id)"
        >
          <flex-col class="card-header">
            <div class="flex items-center justify-between gap-x-1">
              <div class="flex items-center gap-x-3">
                <div
                  class="header-content"
                  v-if="item?.owner?.id !== 'total-id'"
                >
                  <div>
                    <Checkbox
                      :id="item?.id"
                      :checked="isDepositChecked(item?.owner?.id)"
                      @change="onCheckDeposit(item?.owner?.id)"
                      class="cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <div class="text-4 text-grey fw-6 text-start">
                    {{ item?.owner?.name }}
                    <div
                      :class="priceColorFunction(item?.total_balance?.amount)"
                    >
                      {{ getFormattedAmount(item?.total_balance?.amount) }}
                      {{ item?.total_balance?.base_currency?.name }}
                    </div>
                  </div>
                </div>
              </div>

              <icon-exclamation
                v-if="item?.owner?.id !== 'total-id' && !item?.is_active"
                :tooltip="t('clients.invalid_bill')"
              />
            </div>
          </flex-col>
          <div class="py-2">
            <div
              v-for="balance in item.balances"
              :key="balance?.base_currency?.id"
              class="flex items-center justify-between py-1 px-3"
            >
              <div class="text-[#8FA0A0] fs-14">
                {{ balance?.currency?.name }}:
              </div>
              <div class="text-[#424F4F] fs-14">
                {{ getFormattedAmount(balance?.amount) }}
                <span class="text-black">{{
                  balance?.base_currency?.code
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </Slide>

      <template #addons>
        <Navigation />
      </template>
    </Carousel>
  </div>
</template>

<script setup lang="ts">
import { getFormattedAmount } from "~/utils/filter";
import { Carousel, Navigation, Slide } from "vue3-carousel";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
// store'
const clientsOrderStore = useClientsOrdersStore("main");

// props
const props = defineProps<{
  balanceCards: ClientsClientsSubBalancesModel[];
  hideTotalBlock?: boolean;
  checkedSubDepositIds?: Array<any>;
  hideInvalidBlock?: boolean;
  disableCarousel: boolean;
}>();

// emit
const emit = defineEmits(["onChangeDepositIds"]);
const carouselToggle = ref(true);

// states
const { t } = useI18n();
const carouselRef = ref(null);
const carouselContentRef = ref(null);
let breakpoints = {
  700: {
    itemsToShow: 1,
    snapAlign: "center",
  },
  900: {
    itemsToShow: 1,
    snapAlign: "center",
  },
  1024: {
    itemsToShow: 2,
    itemsToScroll: 1,
    snapAlign: "start",
  },
  1200: {
    itemsToShow: 2,
    itemsToScroll: 1,
    snapAlign: "start",
  },
  1440: {
    itemsToShow: 4,
    itemsToScroll: 1,
    snapAlign: "start",
  },
  1600: {
    itemsToShow: 4,
    itemsToScroll: 1,
    snapAlign: "start",
  },
  2000: {
    itemsToShow: 5,
    itemsToScroll: 1,
    snapAlign: "start",
  },
  2100: {
    itemsToShow: 6,
    itemsToScroll: 1,
    snapAlign: "start",
  },
  4000: {
    itemsToShow: 10,
    itemsToScroll: 1,
    snapAlign: "start",
  },
};
const settings = {
  itemsToShow: 0,
  snapAlign: "center",
};

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
  clientsOrderStore.checkedDepositIds = !isDepositChecked(id)
    ? [...clientsOrderStore.checkedDepositIds, id]
    : clientsOrderStore.checkedDepositIds.filter((ownerId) => ownerId !== id);

  emit("onChangeDepositIds", clientsOrderStore.checkedDepositIds);
};

const isDepositChecked = (id: string) => {
  return clientsOrderStore.checkedDepositIds.includes(id);
};

const calculateTotalBalances = (
  balanceCards: ClientsClientsSubBalancesModel[]
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
  balanceCards: ClientsClientsSubBalancesModel[]
): number => {
  return balanceCards.reduce((sum, card) => sum + card.total_balance.amount, 0);
};

const createTotalBalanceCard = (
  totalBalances: ClientsClientsSubBalancesModel,
  totalAmount: number
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
      base_currency: clientDetailBalances.value[0]?.total_balance.base_currency,
    },
  };
};

// hooks
const clientDetailBalances = computed(() => {
  if (!props.hideInvalidBlock) {
    return props.balanceCards?.filter((item) => item.is_active);
  }
  return props?.balanceCards;
});
const totalBalanceCard = computed(() => {
  const checkedCards = clientsOrderStore.checkedDepositIds.length
    ? checkedBalanceCards.value
    : clientDetailBalances.value;

  const totalBalances = calculateTotalBalances(checkedCards);
  const totalAmount = calculateTotalBalanceAmount(checkedCards);

  return createTotalBalanceCard(totalBalances, totalAmount);
});

const balanceCardsWithTotal = computed(() => {
  if (clientDetailBalances.value?.length) {
    if (props.hideTotalBlock) return clientDetailBalances.value;
    return [totalBalanceCard.value, ...clientDetailBalances.value];
  }
  return [];
});

onMounted(() => {
  updateRect();
  window.addEventListener("resize", updateRect);

  return () => {
    window.removeEventListener("resize", updateRect);
  };
});
const updateRect = () => {
  const rect = carouselContentRef.value?.getBoundingClientRect() || {
    width: 1400,
  };
  carouselToggle.value =
    balanceCardsWithTotal.value?.length >
    breakpoints[carouselWidth(rect?.width)]?.itemsToShow;
};

watch(
  () => balanceCardsWithTotal?.value,
  (newValue) => {
    if (newValue) {
      updateRect();
    }
  }
);

watch(
  () => props.balanceCards,
  (newValue) => {
    if (newValue) {
      updateRect();
    }
  }
);

const checkedBalanceCards = computed(() => {
  return clientDetailBalances.value.filter((card) =>
    clientsOrderStore.checkedDepositIds.includes(card.owner.id)
  );
});
const carouselWidth = (value) => {
  if (value < 700) {
    return 700;
  } else if (value < 900) {
    return 900;
  } else if (value < 1024) {
    return 1024;
  } else if (value < 1200) {
    return 1200;
  } else if (value < 1440) {
    return 1440;
  } else if (value < 1600) {
    return 1600;
  } else if (value < 2000) {
    return 2000;
  } else if (value < 2100) {
    return 2100;
  } else if (value < 4000) {
    return 4000;
  }
};

// carousel
function handleKeydown(event) {
  if (props.disableCarousel) return;
  switch (event.key) {
    case "ArrowLeft":
      carouselRef.value?.prev();
      break;
    case "ArrowRight":
      carouselRef.value?.next();
      break;
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
<\/script>

<style scoped lang="scss">
.carousel-content-for-client-cards {
  //height: 420px;
  border-radius: 8px;
  width: 100%;

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    grid-gap: 20px;
    align-items: end;

    .card-item {
      .total-balance-card {
        margin: 0 5px;
        width: 100%;
        height: 100%;
        display: inline-block;
        background: white;
        border-radius: 16px;
        border: 1px solid #e1e4e4;
        cursor: default;
        transition: all;

        .card-header {
          padding: 12px;
          gap: 0 16px;
          border-bottom: 5px solid #d10505;

          .header-content {
            .title {
              line-height: 24px;
              font-family: "Inter", sans-serif;
              font-size: 20px;
              font-weight: 600;
              text-align: start;
            }
          }
        }
      }

      .balance-card {
        width: 100%;
        height: 100%;
        border-radius: 16px;
        background: white;
        border: 1px solid #e1e4e4;
        cursor: pointer;
        transition: all;

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
        margin: 0 5px;
        width: 100%;
        height: 100%;
        border-radius: 16px;
        background: white;
        border: 1px solid #299b9b;
        cursor: pointer;
        transition: all;

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
    }
  }

  .carousel {
    .carousel__viewport {
      display: flex;

      .carousel__track {
        .total-balance-card {
          margin: 0 5px;
          width: 100%;
          height: 100%;
          display: inline-block;
          background: white;
          border-radius: 16px;
          border: 1px solid #e1e4e4;
          cursor: default;
          transition: all;

          .card-header {
            padding: 12px;
            gap: 0 16px;
            border-bottom: 5px solid #d10505;

            .header-content {
              .title {
                line-height: 24px;
                font-family: "Inter", sans-serif;
                font-size: 20px;
                font-weight: 600;
                text-align: start;
              }
            }
          }
        }

        .balance-card {
          margin: 0 5px;
          width: 100%;
          height: 100%;
          border-radius: 16px;
          background: white;
          border: 1px solid #e1e4e4;
          cursor: pointer;
          transition: all;

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
          margin: 0 5px;
          width: 100%;
          height: 100%;
          border-radius: 16px;
          background: white;
          border: 1px solid #299b9b;
          cursor: pointer;
          transition: all;

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
      }
    }
    .popper > #arrow {
      right: 0 !important;
    }
  }

  .carousel__item {
    height: 100%;
    width: 100%;
    background-color: white;
    color: black;
    font-size: 28px;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    overflow: hidden;
    align-items: center;

    img {
      width: 100%;
      object-fit: contain;
    }
  }

  .carousel__slide {
    width: 100%;
    box-shadow: none;
    height: 100%;
  }

  .carousel__slide:last-child {
    margin: 0;
  }

  .carousel__slide--visible {
    box-shadow: none !important;
  }

  .carousel__next {
    width: 42px;
    height: 42px;
    box-sizing: content-box;
    border-radius: 50%;
    transition: 0.4s;
    outline: none;
    right: -16px;
    margin: 0;
    opacity: 0.7 !important;
    background: #299b9b;

    .carousel__icon {
      fill: white;
      width: 25px;
      height: 25px;
    }
  }

  .carousel__prev {
    width: 42px;
    height: 42px;
    box-sizing: content-box;
    border-radius: 50%;
    transition: 0.4s;
    left: -16px;
    outline: none;
    margin: 0;
    opacity: 0.7 !important;
    background: #299b9b;

    .carousel__icon {
      fill: white;
      width: 25px;
      height: 25px;
    }
  }

  .carousel__prev:hover,
  .carousel__next:hover {
    opacity: 1 !important;
  }
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
}

@media screen and (max-width: 992px) {
  .carousel-content-for-client-cards {
    padding: 0;

    .cards {
      .card-item {
        .total-balance-card {
          margin: 0;
        }
        .balance-card-check {
          margin: 0 !important;
        }
      }
    }

    .carousel {
      .carousel__viewport {
        .carousel__track {
          .balance-card {
            margin: 0;
          }
          .balance-card-check {
            margin: 0 !important;
          }
        }
      }
    }

    .carousel__next {
      right: 5px !important;
      opacity: 0.3 !important;
    }

    .carousel__prev {
      left: 5px !important;
      opacity: 0.3 !important;
    }
  }
}
</style>
`;export{n as default};
