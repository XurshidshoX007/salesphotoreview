const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <div class="filter-content-title">
        <page-title
          size="xl"
          :title="t('suppliers.reconciliation.act_reconciliation')"
        />
      </div>
      <div class="filter-btn-group">
        <DatePicker
          ref="DatePickerComponent"
          :label="t('column.date')"
          default-preset="this-month"
          @onApply="onChangeDateRange"
        />
      </div>
    </div>
    <div class="filter-content">
      <DropdownsByFilterStates
        ref="DropdownComponent"
        :filter-states="filterStates"
        @on-open-dropdown="filtersStore.onOpenDropdown"
      />
      <flex-row class="submit-item">
        <m-btn
          :loading="suppliersReconciliationStore.isLoading"
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

// stores
const filtersStore = useFiltersStore("/suppliers/payment");
const suppliersReconciliationStore = useSuppliersReconciliationStore("main");

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
    isSingleSelect: true,
    get isLoading() {
      return filtersStore.isSuppliersLoading;
    },
    get data() {
      return filtersStore.supplier || [];
    },
    get getSelectedData() {
      return filtersStore.selectedSingleSupplier || "";
    },
    set setSelectedData(value: string) {
      filtersStore.selectedSingleSupplier = value;
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
]);

// hooks
const isFilterClearable = computed(() => {
  return (
    filtersStore.isSuppliersLoading ||
    !(
      filtersStore.selectedSingleSupplier !==
        filtersStore.supplier?.items[0]?.id ||
      filtersStore.selectedCurrencies.length ||
      DatePickerComponent.value?.isClearable()
    )
  );
});

onMounted(async () => {
  await getSuppliers();
  !filtersStore.selectedSingleSupplier && autoSelectFirstSupplier();
  onApplyFilter();
});

// methods
const autoSelectFirstSupplier = () => {
  if (filtersStore.supplier?.items?.length) {
    filtersStore.selectedSingleSupplier =
      filtersStore.supplier.items[0].id || "";
  }
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.setDateRange(newRange);
};

const onApplyFilter = () => {
  suppliersReconciliationStore.filterParams.date_range = {
    from_value:
      filtersStore.selectedDateRange?.fromDate || new Date().toISOString(),
    to_value:
      filtersStore.selectedDateRange?.toDate || new Date().toISOString(),
  };

  suppliersReconciliationStore.filterParams.supplier_id =
    filtersStore.selectedSingleSupplier || "";
  suppliersReconciliationStore.filterParams.payment_method_id_arr =
    filtersStore.selectedCurrencies;
};

const onClearFilter = () => {
  autoSelectFirstSupplier();
  filtersStore.selectedCurrencies = [];
  DropdownComponent.value?.onClearFilter();
  DatePickerComponent.value?.onReset();
  onApplyFilter();
};

const getSuppliers = async () => {
  if (filtersStore.supplier?.items.length) {
    return;
  }
  await filtersStore.getSuppliers();
};
<\/script>
`;export{e as default};
