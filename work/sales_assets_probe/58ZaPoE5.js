const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <div class="filter-content-title">
        <page-title
          size="xl"
          :title="t('suppliers.payment.payments_by_suppliers')"
        />
      </div>
      <div class="filter-btn-group">
        <DatePicker
          ref="DatePickerComponent"
          :label="t('column.date')"
          default-preset="this-month"
          @onApply="onChangeDateRange"
        />
        <m-btn v-if="hasAccess2PaymentCreate" @click="openAddDialog">{{
          t("add")
        }}</m-btn>
      </div>
    </div>
    <div class="filter-content">
      <DropdownsByFilterStates
        ref="DropdownComponent"
        :filter-states="filterStates"
        @on-open-dropdown="filtersStore.onOpenDropdown"
      />
      <div class="md:col-span-2 col-span-1">
        <FilterSlider
          :range-amount="filtersStore.priceRangeStatic"
          :min="filtersStore.priceStatic.min"
          :max="filtersStore.priceStatic.max"
          @on-range-amount="setSumRange"
        />
      </div>
      <flex-row class="submit-item">
        <m-btn
          :loading="supplierPaymentsStore.isLoading"
          @click="onApplyFilter"
          >{{ t("apply") }}</m-btn
        >
        <ResetFilterBtn
          :is-filter-clearable="isFilterClearable"
          @onClearFilter="onClearFilter"
        />
      </flex-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { DropdownsByFilterStates, DatePicker } from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { useSuppliersAccess } from "~/composables/access/suppliers/suppliers";

// emits
const emit = defineEmits<{
  (e: "open-add-dialog"): void;
}>();

// stores
const filtersStore = useFiltersStore("/suppliers/payment");
const supplierPaymentsStore = useSupplierPaymentsStore("main");

// accesses
const { hasAccess2PaymentCreate } = useSuppliersAccess();

// child-components
const DatePickerComponent = ref<InstanceType<typeof DatePicker> | null>(null);
const DropdownComponent = ref<InstanceType<
  typeof DropdownsByFilterStates
> | null>(null);

// states
const { t } = useI18n();

const filterStates = ref<FilterStateModel[]>([
  {
    name: t("sidebar.suppliers"),
    key: "supplier",
    get data() {
      return filtersStore.supplier || [];
    },
    get getSelectedData() {
      return filtersStore.selectedSupplier;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedSupplier = value;
    },
  },
  {
    name: t("settings_sidebar.payment_method"),
    key: "currencies",
    get data() {
      return filtersStore.currency || [];
    },
    get getSelectedData() {
      return filtersStore.selectedCurrencies;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedCurrencies = value;
    },
  },
  {
    name: t("cash.cash"),
    key: "cash",
    get data() {
      return filtersStore.cashboxes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedCashboxes;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedCashboxes = value;
    },
  },
]);

// hooks
const isFilterClearable = computed(() => {
  return !(
    filtersStore.selectedSupplier.length ||
    filtersStore.selectedCurrencies.length ||
    filtersStore.selectedCashboxes.length ||
    filtersStore.priceRangeStatic[0] !== 0 ||
    filtersStore.priceRangeStatic[1] !== 100000000000 ||
    DatePickerComponent.value?.isClearable()
  );
});

onMounted(() => onApplyFilter());

// methods
const openAddDialog = () => {
  emit("open-add-dialog");
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.setDateRange(newRange);
};

const setSumRange = (value: number[]) => {
  filtersStore.priceRangeStatic = value;
};

const onApplyFilter = () => {
  supplierPaymentsStore.params.date_range = {
    from: filtersStore.selectedDateRange?.fromDate || new Date().toISOString(),
    to: filtersStore.selectedDateRange?.toDate || new Date().toISOString(),
  };

  supplierPaymentsStore.params.amount_range.from_value =
    filtersStore.priceRangeStatic[0];
  supplierPaymentsStore.params.amount_range.to_value =
    filtersStore.priceRangeStatic[1];

  onAddFieldToFilter(
    supplierPaymentsStore.params,
    "supplier_id",
    filtersStore.selectedSupplier
  );

  onAddFieldToFilter(
    supplierPaymentsStore.params,
    "cash_box_id",
    filtersStore.selectedCashboxes
  );

  onAddFieldToFilter(
    supplierPaymentsStore.params,
    "currency_id",
    filtersStore.selectedCurrencies
  );
};

const onClearFilter = () => {
  filtersStore.selectedSupplier = [];
  filtersStore.selectedCurrencies = [];
  filtersStore.selectedCashboxes = [];
  filtersStore.priceRangeStatic[0] = 0;
  filtersStore.priceRangeStatic[1] = 100000000000;
  DropdownComponent.value?.onClearFilter();
  DatePickerComponent.value?.onReset();
  onApplyFilter();
};
<\/script>
`;export{e as default};
