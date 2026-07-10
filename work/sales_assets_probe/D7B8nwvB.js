const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="filter-content-header">
        <page-title :title="title" />
        <div class="filter-btn-group">
          <DatePicker
            ref="DatePickerComponent"
            tomorrow-preset
            :initial-from-date="initialFromDate"
            :initial-to-date="initialToDate"
            default-preset="today"
            @onApply="onChangeDateRange"
          />
          <m-btn v-if="props.createBtn" @click="onCreate">{{
            props.createBtnTitle ||
            t("invoices.return.preview_available_returns")
          }}</m-btn>
          <filter-checkbox-bar-btn
            :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
            :storage-key="saveKey"
            @update="filtersStore.updateFilterStates($event, filterStates)"
          />
        </div>
      </div>
      <div class="filter-content">
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filterStates="filtersStore.checkedFilterStates(filterStates)"
          @onOpenDropdown="filtersStore.onOpenDropdown"
        />

        <flex-row class="submit-item">
          <m-btn :loading="isLoading" @click="onSetFilters">
            {{ t("apply") }}
          </m-btn>
          <ResetFilterBtn
            :is-filter-clearable="isFilterClearable"
            @onClearFilter="onClearFilter"
          />
        </flex-row>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import type { DropdownsByFilterStates, DatePicker } from "#components";

const props = defineProps<{
  title: string;
  isLoading?: boolean;
  createBtn?: boolean;
  createBtnTitle?: string;
  saveKey?: string;
}>();

// emits
const emit = defineEmits(["onCreate", "setFilters"]);

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const DatePickerComponent = ref<typeof DatePicker | null>(null);

// Store
const filtersStore = useFiltersStore("/invoices/shipping-invoices");

// state
const { t } = useI18n();
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const isChecked = (key: string) => {
  if (!props.saveKey) return true;
  return filtersStore.isCheckedFilterState(key, props.saveKey);
};

const filterStates = ref([
  {
    name: t("sidebar.warehouse"),
    key: "warehouses",
    get data() {
      return filtersStore.warehouses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedWarehouses;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedWarehouses = value;
    },
    checked: isChecked("warehouses"),
  },
  {
    name: t("filters.expeditor"),
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
    name: t("column.status"),
    key: "shipping-invoice-statuses",
    get data() {
      return filtersStore.shippingInvoicesStatuses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedShippingInvoiceStatuses;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedShippingInvoiceStatuses = value;
    },
    checked: isChecked("shipping-invoice-statuses"),
  },
]);

// hooks
const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedWarehouses.length ||
    filtersStore.selectedShippingInvoiceStatuses.length ||
    filtersStore.selectedExpeditors.length
  );
});

onMounted(() => {
  onSetFilters();
});

// methods
const onCreate = () => {
  emit("onCreate");
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onSetFilters = () => {
  const filter = {
    warehouseIds: filtersStore.selectedWarehouses,
    expeditorIds: filtersStore.selectedExpeditors,
    statusIds: filtersStore.selectedShippingInvoiceStatuses.join("").split(","),
    dateRange: filtersStore.selectedDateRange,
  };
  emit("setFilters", filter);
};

const onClearFilter = () => {
  filtersStore.selectedWarehouses = [];
  filtersStore.selectedShippingInvoiceStatuses = [];
  filtersStore.selectedExpeditors = [];
  DropdownComponent.value!.onClearFilter();
  DatePickerComponent.value!.onReset();
  onSetFilters();
};
<\/script>
`;export{e as default};
