const n=`<template>
  <form
    @submit.prevent="onSubmit"
    class="sticky w-full bottom-0 flex items-center justify-between gap-5 bg-white py-3 px-6 border-t rounded-b-large z-1 flex-wrap"
  >
    <flex-col class="w-full gap-3 md:gap-1">
      <div class="flex items-center gap-3 flex-wrap">
        <div class="progress-container">
          <div
            class="progress-fill"
            :style="{ width: successPercentageValue + '%' }"
          ></div>
          <span class="progress-text">
            {{ t("successfully") }} {{ totalSuccessResponses }} из
            {{ totalResponses }} ({{ successPercentageValue }}%)
          </span>
        </div>
        <m-btn
          v-show="successPercentageValue === 100"
          class="h-7.5"
          @click="onBack"
        >
          {{ backBtnTitle }}
        </m-btn>
      </div>

      <Checkbox
        :title="t('orders.show_only_errored_payments')"
        :checked="!!showOnlyErroredPayments"
        :disabled="!isSaved || isBtnLoading"
        @change="onShowOnlyErroredPayments"
      />
    </flex-col>

    <div
      class="w-full flex items-center justify-start sm:justify-end gap-3 flex-wrap"
    >
      <d-input-date-picker
        :value="selectedDate"
        :disabled="isSaved"
        disable-future-dates
        :disabled-past-dates="!hasAccess2CreatePaymentWithPastDates"
        @change="onSelectDate"
      />
      <div class="sm:w-60 w-full">
        <dropdowns-by-filter-states
          :filter-states="cashboxFilterStates"
          :readonly="isSaved"
          @onOpenDropdown="onOpenDropdown"
        />
      </div>

      <m-btn
        type="submit"
        :loading="isBtnLoading"
        :disabled="isSaved"
        class="sm:w-fit w-full"
        >{{ t("orders.pay") }}
      </m-btn>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { defaultDropdownParams } from "~/variable/params";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";

// props
const props = defineProps<{
  isSaved: boolean;
  selectedCashboxId: string;
  selectedDate: string;
  isBtnLoading?: boolean;
  totalResponses?: number;
  totalSuccessResponses?: number;
  showOnlyErroredPayments?: boolean;
  type: "application" | "order";
}>();

// emits
const emit = defineEmits([
  "on-submit",
  "on-select-date",
  "on-show-only-errored-payments",
  "on-change-cashbox-id",
]);

// access
const { hasAccess2CreatePaymentWithPastDates } = useCashboxAccess();

// store
const orderStore = useOrdersStore("main");

// states
const { t } = useI18n();
const router = useRouter();
const cashboxes = ref();
const cashboxesParams = ref({ ...defaultDropdownParams });

const cashboxFilterStates = ref([
  {
    name: t("cash.cash"),
    key: "cashboxes",
    required: true,
    isSingleSelect: true,
    get data() {
      return cashboxes.value || [];
    },
    get getSelectedData() {
      return props.selectedCashboxId;
    },
    set setSelectedData(value: string) {
      onChangeCashboxId(value);
    },
  },
]);

// hooks
const successPercentageValue = computed(() => {
  if (!props.totalResponses || props.totalResponses === 0) {
    return 0;
  }
  return Math.round(
    ((props.totalSuccessResponses || 0) / props.totalResponses) * 100,
  );
});

const backBtnTitle = computed(() => {
  return props.type === "application"
    ? t("dashboard.return_to_application_payments")
    : t("orders.return_to_orders_page");
});

onMounted(async () => {
  await getCashboxes();
  // onAutoSelectFirstCashbox();
});

// methods
const onBack = () => {
  props.type === "order"
    ? navigateTo("/orders/orders")
    : router.push({
        path: "/dashboard/cashbox/applications-payment",
        query: { type: 0 },
      });
};

const onAutoSelectFirstCashbox = () => {
  const cashboxId = cashboxes.value.items[0]?.id;
  onChangeCashboxId(cashboxId);
};

const onOpenDropdown = async (state: string, value: unknown) => {
  if (state === "cashboxes" && !cashboxes.value.items) {
    await getCashboxes();
    return;
  } else return;
};

const getCashboxes = async () => {
  cashboxes.value = await orderStore.getCashboxes(cashboxesParams.value);
};

const onChangeCashboxId = (value: string) => {
  emit("on-change-cashbox-id", value);
};

const onSelectDate = (newDate: string) => {
  emit("on-select-date", newDate);
};

const onShowOnlyErroredPayments = (newVal: boolean) => {
  emit("on-show-only-errored-payments", newVal);
};

const onSubmit = () => {
  emit("on-submit");
};
<\/script>

<style scoped>
.progress-container {
  width: 50%;
  background-color: #e6f5f5;
  border-radius: 8px;
  border: 1px solid #00332f;
  position: relative;
  height: 30px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #00332f70;
  transition: width 0.5s ease;
}

.progress-text {
  color: #00332f;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  transition: color 0.3s ease;
  z-index: 1;
}

@media only screen and (max-device-width: 767px) {
  .progress-container {
    width: 100%;
  }
}
</style>
`;export{n as default};
