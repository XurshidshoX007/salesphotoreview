const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title20 :title="t('cash.list_of_payments_allowed_for_change')" />
      <div class="filter-btn-group">
        <DatePicker
          ref="DatePickerComponent"
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          default-preset="this-month"
          @onApply="onApplyDateRange"
        />
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="paymentCancellationFilterStates"
          @update="filtersStore.updateFilterStates($event, filterStates)"
        />
      </div>
    </div>
    <div class="filter-content">
      <dropdowns-by-filter-states
        ref="DropdownComponent"
        :filterStates="filtersStore.checkedFilterStates(filterStates)"
        @onOpenDropdown="filtersStore.onOpenDropdown"
        @search="filtersStore.onSearchDropdown"
      />
      <flex-row class="submit-item">
        <m-btn @click="onSetFilters">
          {{ t("apply") }}
        </m-btn>
        <ResetFilterBtn
          :is-filter-clearable="isFilterClearable"
          @onClearFilter="onClearFilter"
        />
      </flex-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DatePicker, DropdownsByFilterStates } from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import { useI18n } from "vue-i18n";
import { usePaymentCancellationStore } from "~/stores/dashboard/cashbox/payment-customers/payment-cancellation";
import { paymentCancellationFilterStates } from "~/variable/column-constants";

// Store
const paymentCancellationStore = usePaymentCancellationStore("main");
const filtersStore = useFiltersStore(
  "/dashboard/cashbox/payment-customers/payment-cancellation",
);

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const DatePickerComponent = ref<typeof DatePicker | null>(null);

// states
const { t } = useI18n();
const dateRange = ref<DateRangeModel>({} as DateRangeModel);

const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(
    key,
    paymentCancellationFilterStates,
  );
};

const filterStates = ref([
  {
    name: t("column.status"),
    key: "payment-cancellation-access-status",
    get data() {
      return filtersStore.paymentCancellationAccessStatus || [];
    },
    get getSelectedData() {
      return filtersStore.selectedPaymentCancellationAccessStatus;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedPaymentCancellationAccessStatus = value;
    },
    checked: isChecked("payment-cancellation-access-status"),
  },
  {
    name: t("clients.forwarder"),
    key: "expeditors",
    get data() {
      return filtersStore.expeditors || [];
    },
    get getSelectedData() {
      return filtersStore.selectedExpeditors;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedExpeditors = value;
    },
    checked: isChecked("expeditors"),
  },
  {
    name: t("settings_sidebar.payment_cancellation_reason"),
    key: "payment-cancellation-reasons",
    get data() {
      return filtersStore.paymentCancelReason || [];
    },
    get getSelectedData() {
      return filtersStore.selectedPaymentCancelReason;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedPaymentCancelReason = value;
    },
    checked: isChecked("payment-cancellation-reasons"),
  },
]);

// hooks
const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedExpeditors.length ||
    filtersStore.selectedPaymentCancellationAccessStatus.length ||
    filtersStore.selectedPaymentCancelReason.length
  );
});

onMounted(async () => {
  await Promise.all([filtersStore.getConsignationFilterTypes()]);
  onSetFilters();
});

// methods

const onApplyDateRange = (value: Record<"fromDate" | "toDate", string>) => {
  dateRange.value = value;
  filtersStore.selectedDateRange = value;
};

const onSetFilters = () => {
  paymentCancellationStore.setPage(1);

  const currentFilters = paymentCancellationStore.params.filter || [];

  const updatedFilters = [
    ...currentFilters.filter(
      (f) =>
        ![
          "accessed_for_user_id",
          "payment_cancellation_reason_id",
          "status",
        ].includes(f.field),
    ), // Remove old filters with matching fields
    {
      field: "accessed_for_user_id",
      value: [...filtersStore.selectedExpeditors],
    },
    {
      field: "payment_cancellation_reason_id",
      value: [...filtersStore.selectedPaymentCancelReason],
    },
    {
      field: "status",
      value:
        filtersStore.selectedPaymentCancellationAccessStatus?.map(String) || [],
    },
  ];

  Object.assign(paymentCancellationStore.params, {
    filter: updatedFilters,
    date_time_range: {
      from: dateRange.value?.fromDate || null,
      to: dateRange.value?.toDate || null,
    },
  });
};

const onClearFilter = () => {
  filtersStore.selectedExpeditors = [];
  filtersStore.selectedPaymentCancelReason = [];
  filtersStore.selectedPaymentCancellationAccessStatus = [];
  DropdownComponent.value.onClearFilter();
  DatePickerComponent.value?.onReset();
  onSetFilters();
};
<\/script>
`;export{e as default};
