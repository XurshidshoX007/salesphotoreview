const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <div class="filter-content-title">
        <page-title size="xl" :title="t('cash.cash_flow.cash_flow')" />
      </div>
      <div class="filter-btn-group">
        <DatePicker
          ref="DatePickerComponent"
          :label="t('column.date')"
          default-preset="this-month"
          :initial-from-date="filtersStore.selectedDateRange?.fromDate"
          :initial-to-date="filtersStore.selectedDateRange?.toDate"
          @onApply="onChangeDateRange"
        />
      </div>
    </div>
    <div class="filter-content">
      <DropdownsByFilterStates
        ref="DropdownComponent"
        :filter-states="filterStates"
        @onOpenDropdown="filtersStore.onOpenDropdown"
        @search="filtersStore.onSearchDropdown"
      />
      <flex-row class="submit-item">
        <m-btn :loading="cashFlowStore.isLoading" @click="onApplyFilter"
          >{{ t("apply") }}
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
import { useI18n } from "vue-i18n";
import type { DatePicker, DropdownsByFilterStates } from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";

// stores
const filtersStore = useFiltersStore("dashboard/cashbox/cash-flow");
const cashFlowStore = useCashFlowStore("main");

// child-components
const DatePickerComponent = ref<InstanceType<typeof DatePicker> | null>(null);
const DropdownComponent = ref<InstanceType<
  typeof DropdownsByFilterStates
> | null>(null);

// states
const { t } = useI18n();

const filterStates = ref([
  {
    name: t("column.cash"),
    key: "cash",
    isSingleSelect: true,
    get isLoading() {
      return filtersStore.isCashboxesLoading;
    },
    get data() {
      return filtersStore.cashboxes || [];
    },
    get getSelectedData() {
      return filtersStore.singleSelectedCashbox;
    },
    set setSelectedData(value: string) {
      filtersStore.singleSelectedCashbox = value;
    },
  },
]);

// hooks
const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.singleSelectedCashbox !==
      filtersStore.cashboxes?.items?.[0]?.id
  );
});

onMounted(async () => {
  await filtersStore.getCashboxes();
  autoSelectFirstCashbox();
  onApplyFilter();
});

// methods
const onChangeDateRange = (range: DateRangeModel) => {
  filtersStore.setDateRange(range);
};

const autoSelectFirstCashbox = () => {
  if (filtersStore.cashboxes?.items?.length) {
    filtersStore.singleSelectedCashbox =
      filtersStore.cashboxes?.items[0].id || "";
  }
};

const onApplyFilter = () => {
  cashFlowStore.params.CashBoxId = filtersStore.singleSelectedCashbox || "";
  cashFlowStore.params.DateRange = {
    FromValue: filtersStore.selectedDateRange?.fromDate || "",
    ToValue: filtersStore.selectedDateRange?.toDate || "",
  };
};

const onClearFilter = () => {
  autoSelectFirstCashbox();
  DropdownComponent.value?.onClearFilter();
  DatePickerComponent.value?.onReset();
  onApplyFilter();
};
<\/script>
`;export{e as default};
