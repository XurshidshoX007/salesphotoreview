const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="filter-content-header">
        <page-title :title="t('invoices.assembly_invoices')" />
        <div class="filter-btn-group">
          <DatePicker
            ref="DatePickerComponent"
            tomorrow-preset
            :initial-from-date="initialFromDate"
            :initial-to-date="initialToDate"
            @onApply="onChangeDateRange"
          />
          <!-- <m-btn v-if="hasAccess2Create" @click="openCreateDialog">
            {{ t("invoices.create_invoices") }}
          </m-btn> -->
          <filter-checkbox-bar-btn
            :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
            :storage-key="assemblyInvoicesFilterStates"
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
          <m-btn
            :loading="invoicesStore.isLoading && !invoicesStore.isFilterLoading"
            @click="onSetFilters"
          >
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
import moment from "moment";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { InvoicesEventKeys } from "~/variable/event-key-constants";
import { useAssemblyAccess } from "~/composables/access/invoices/assembly-access";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import type { DropdownsByFilterStates, DatePicker } from "#components";
import { assemblyInvoicesFilterStates } from "~/variable/column-constants";

// props
const props = defineProps<{
  currentTab: number;
}>();

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const DatePickerComponent = ref<typeof DatePicker | null>(null);

// Store
const filtersStore = useFiltersStore("/invoices/assembly-invoices");
const invoicesStore = useInvoicesStore("main");

// emits
const emit = defineEmits(["openCreateDialog"]);

// state
const { t } = useI18n();
const eventBus = useEventBus();
const tomorrow = moment().add(1, "days").toDate();
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || tomorrow);
const isNewFilterSet = ref(false);
let updateListEventKey = InvoicesEventKeys.ASSEMBLY_TABLE_UPDATE;
const { hasAccess2Create } = useAssemblyAccess();

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, assemblyInvoicesFilterStates);
};

const filterStates = ref([
  {
    name: t("sidebar.delivery"),
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
    key: "warehouse-invoice-status",
    get data() {
      return filtersStore.warehouseInvoicesStatuses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedWarehouseInvoiceStatuses;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedWarehouseInvoiceStatuses = value;
    },
    checked: isChecked("warehouse-invoice-status"),
  },
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
]);

// hooks
const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedWarehouses.length ||
    filtersStore.selectedWarehouseInvoiceStatuses.length ||
    filtersStore.selectedExpeditors.length
  );
});

watch(
  () => props.currentTab,
  (newVal) => {
    switch (newVal) {
      case 1:
        updateListEventKey = InvoicesEventKeys.ASSEMBLY_TABLE_UPDATE;
        break;
      case 2:
        updateListEventKey = InvoicesEventKeys.BY_EXPEDITOR_TABLE_UPDATE;
        break;
      default:
        break;
    }
  },
);

watch(
  () => props.currentTab,
  () => {
    if (isNewFilterSet.value) {
      onSetFilters();
      isNewFilterSet.value = false;
    }
  },
);

onMounted(() => {
  onSetFilters();
});

// methods
const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onSetFilters = () => {
  const emitData = {
    warehouse_id_arr: filtersStore.selectedWarehouses,
    expeditor_id_arr: filtersStore.selectedExpeditors,
    status_id_arr: filtersStore.selectedWarehouseInvoiceStatuses
      .join(",")
      .split(","),
    date_range: {
      from_value: getFormattedDate(
        filtersStore.selectedDateRange?.fromDate,
        "YYYY-MM-DD",
      ),
      to_value: getFormattedDate(
        filtersStore.selectedDateRange?.toDate,
        "YYYY-MM-DD",
      ),
    },
  };
  isNewFilterSet.value = true;
  eventBus.emit(updateListEventKey, emitData);
};

const onClearFilter = () => {
  filtersStore.selectedWarehouses = [];
  filtersStore.selectedExpeditors = [];
  filtersStore.selectedWarehouseInvoiceStatuses = [];
  DropdownComponent.value!.onClearFilter();
  DatePickerComponent.value!.onReset();
  onSetFilters();
};

const openCreateDialog = () => {
  emit("openCreateDialog");
};
<\/script>
`;export{e as default};
