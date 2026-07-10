const n=`<template>
  <div class="table-content-container relative">
    <div
      v-if="isSaving"
      class="absolute z-19 bottom-0 left-0 w-[100%] h-[100%] bg-[rgba(0,0,0,0.3)] flex items-center justify-center pointer-events-none rounded-large"
    >
      <Loading />
    </div>
    <div
      class="table-content-body rounded-large"
      :class="{
        'max-h-[calc(100vh-16rem)] overflow-auto': !isFewDataUiApplyable,
      }"
    >
      <data-table :loading="isLoadingTable" :table-styles="fewDataTableStyles">
        <template #header>
          <c-tr
            class="bg-lotion border-t-0 top-0 sticky bg-lotion z-8 shadow-md"
            :class="fewDataTrClasses"
          >
            <c-td-no-edit
              v-for="key in headers"
              :key="key.key"
              :class="[
                fewDataTdClasses,
                key?.borderX && 'border-r-1',
                key.key === 'currency' && !key.isActive && 'bg-red-200',
              ]"
            >
              <div v-if="key.key === 'currency'">
                <d-input
                  :label="key.name"
                  min="0"
                  type="number"
                  :disabled="isSaved || key.isDisabled"
                  @change="onAddAmountForAll(key.id, $event)"
                />
              </div>
              <div v-else class="text-nowrap">
                {{ key.name }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>

        <template #body>
          <c-tr
            v-for="(data, index) in visibleData"
            :key="data.order_id"
            class="relative"
            :class="fewDataTrClasses"
            v-observe-visibility="
              (isVisible: boolean, entry: unknown) =>
                onVisibilityChange(isVisible, index)
            "
          >
            <c-td-no-edit
              v-for="key in headers"
              :key="key.key"
              :class="[
                fewDataTdClasses,
                key?.borderX && 'border-r-1',
                isSaved && key.key !== 'client_name' && 'opacity-20',
                key.key === 'currency' && !key.isActive && 'bg-red-200',
              ]"
            >
              <div v-if="key.key === 'currency'">
                <d-input
                  min="0"
                  :disabled="isSaved || key.isDisabled"
                  :value="getInpValue(data.order_id, key.id)"
                  type="number"
                  @change="onAddAmount(data, key.id, $event)"
                />
              </div>
              <div v-else-if="key.key === 'consignation_term'">
                {{ getFormattedDate(data[key.key]) }}
              </div>
              <div v-else-if="key.key === 'not_paid'">
                {{ getNotPaidValueByOrder(data) }}
              </div>
              <div
                v-else-if="
                  typeof data[key.key] === 'number' && key.key !== 'visual_id'
                "
                class="text-end"
              >
                {{ getFormattedAmount(data[key.key]) }}
              </div>
              <div v-else>
                {{ data[key.key] }}
              </div>
            </c-td-no-edit>

            <TableResponseResult
              v-if="isSaved"
              :response-results="responseResults"
              :id="data.order_id"
              @on-try-again="onTryAgainFailedRequest"
            />
          </c-tr>
        </template>
        <template #footer>
          <OrdersOrdersOrderPaymentTotalAmounts
            :headers="headers"
            :total-amounts="totalAmounts"
            :few-data-tr-classes="fewDataTrClasses"
            :few-data-td-classes="fewDataTdClasses"
          />
        </template>
      </data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableResponseResultModel } from "~/interfaces/ui/table-response-result-model";
import type { Template } from "~/interfaces/ui/template";
import { getFormattedDate } from "~/utils/formatters";
import type {
  OrderPaymentGetModel,
  OrderPaymentPostModel,
} from "~/interfaces/api/orders/order-payment-model";

// props
const props = defineProps<{
  data: OrderPaymentGetModel[];
  postData: OrderPaymentPostModel[];
  headers: (Template & {
    id: string;
    isDisabled: boolean;
    isActive: boolean;
  })[];
  isLoadingTable?: boolean;
  isSaved?: boolean;
  responseResults?: TableResponseResultModel;
  totalAmounts: {
    id: string;
    title: string;
    amount: string;
    details?: {
      id: string;
      title: string;
      amount: string;
    }[];
  }[];
  allowedCurrencies: CurrencyDropdownModel[];
  isSaving?: boolean;
}>();

// emit
const emit = defineEmits(["on-try-again-failed-request", "create-new-payment"]);

// states
const visibleData = ref<OrderPaymentGetModel[]>([]);
const rowsPerPage = ref(20);
const currentPage = ref(1);

// hooks
const isFewDataUiApplyable = computed(() => {
  return visibleData.value.length < 6;
});

const fewDataTableStyles = computed(() => {
  if (!isFewDataUiApplyable.value) return {};
  return {
    height: "calc(100vh - 16rem) !important",
  };
});

const fewDataTrClasses = computed(() => {
  if (!isFewDataUiApplyable.value) return [];
  return [
    "flex",
    visibleData.value.length > 1 ? "first-border-0" : "border-t-0",
  ];
});

const fewDataTdClasses = computed(() => {
  if (!isFewDataUiApplyable.value) return [];
  return ["flex items-center", "min-w-40"];
});

watch(
  () => props.data,
  () => {
    visibleData.value = [];
    currentPage.value = 1;
    loadMoreRows();
  },
);

// methods
const loadMoreRows = () => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  visibleData.value.push(...props.data.slice(start, start + rowsPerPage.value));
  currentPage.value++;
};

const onVisibilityChange = (isVisible: boolean, index: number) => {
  if (isVisible && index === visibleData.value.length - 10) loadMoreRows();
};

const getInpValue = (orderId: string, currencyId: string) => {
  const isCurrencyAllowed = props.allowedCurrencies.some(
    (currency) => currency.id === currencyId,
  );

  if (!isCurrencyAllowed) return null;

  return props.postData
    .find((data) => data.order_id === orderId)
    ?.income?.find((currency) => currency.currency_id === currencyId)?.amount;
};

const onAddAmount = (
  order: OrderPaymentGetModel,
  currencyId: string,
  amount: number,
) => {
  const orderIndex = props.postData.findIndex(
    (item) => item.order_id === order.order_id,
  );

  if (!isValidAmount(amount)) {
    if (orderIndex !== -1) {
      removeCurrencyFromPayment(props.postData[orderIndex], currencyId);
    }
    return;
  }

  if (orderIndex !== -1) {
    updateExistingPayment(props.postData[orderIndex], currencyId, amount);
    return;
  }

  createNewPayment(order, currencyId, amount);
};

const isValidAmount = (amount: number): boolean => {
  return amount !== 0 && amount !== null && amount !== undefined;
};

const removeCurrencyFromPayment = (
  order: OrderPaymentPostModel,
  currencyId: string,
): void => {
  const currencyIndex = order.income.findIndex(
    (item) => item.currency_id === currencyId,
  );
  if (currencyIndex !== -1) {
    order.income.splice(currencyIndex, 1);
  }
};

const updateExistingPayment = (
  order: OrderPaymentPostModel,
  currencyId: string,
  amount: number,
): void => {
  const currency = order.income.find((item) => item.currency_id === currencyId);
  if (currency) {
    currency.amount = amount;
  } else {
    order.income.push({ currency_id: currencyId, amount });
  }
};

const createNewPayment = (
  order: OrderPaymentGetModel,
  currencyId: string,
  amount: number,
): void => {
  const { order_id, client_id, agent_id, expeditor_id } = order;
  const data = {
    order_id,
    client_id,
    agent_id,
    expeditor_id,
    income: [{ currency_id: currencyId, amount }],
  };
  emit("create-new-payment", data);
};

const getNotPaidValueByOrder = (order: OrderPaymentGetModel) => {
  const totalPaid = getTotalPayingSumByOrderId(order?.order_id) ?? 0;
  return getFormattedAmount(Math.max(0, order?.debt - totalPaid));
};

const getTotalPayingSumByOrderId = (orderId: string) => {
  const order = props.postData.find((item) => item.order_id === orderId);
  return getTotalsByDataAndField(order?.income ?? [], "amount");
};

const getTotalsByDataAndField = (
  data: OrderPaymentPostModel["income"],
  field: string,
) => {
  return data.reduce(
    (result: number, item: OrderPaymentPostModel["income"][0]) =>
      Number(result) + Number(item[field]),
    0,
  );
};

const onAddAmountForAll = (currencyId: string, amount: number) => {
  for (let data of props.data) {
    onAddAmount(data, currencyId, amount);
  }
};

const onTryAgainFailedRequest = (id: number) => {
  emit("on-try-again-failed-request", id);
};
<\/script>

<style scoped>
.table-content-body {
  padding-bottom: 0;
}

::-webkit-scrollbar {
  width: 8.5px;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
}
</style>
`;export{n as default};
