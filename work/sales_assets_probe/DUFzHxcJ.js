const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <div class="filter-content-title">
        <page-title20 :title="t('filters.filter')" />
        <div class="create-button-mobile">
          <filter-checkbox-bar-btn
            device="mobile"
            :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
            :storage-key="aboutClientFilterStates"
            @update="filtersStore.updateFilterStates($event, filterStates)"
          />
        </div>
      </div>

      <div class="filter-btn-group">
        <RadioBtn
          ref="RadioBtnComponent"
          :label="t('labels.date_applies_to')"
          :items="filtersStore.dateFilterTypes"
          :selectedItem="filtersStore.selectedDateFilterType"
          @onSelectItemId="onChangeDateFilterType"
        />
        <DatePicker
          ref="DatePickerComponent"
          without-today-preset
          without-yesterday-preset
          past-3-months-preset
          past-6-months-preset
          default-preset="past-6-monthes"
          @onApply="onChangeDateRange"
        />
        <div class="create-button-desktop">
          <filter-checkbox-bar-btn
            device="desktop"
            :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
            :storage-key="aboutClientFilterStates"
            @update="filtersStore.updateFilterStates($event, filterStates)"
          />
        </div>
      </div>
    </div>
    <div class="filter-content">
      <DropdownsByFilterStates
        ref="DropdownComponent"
        :filterStates="filtersStore.checkedFilterStates(filterStates)"
        @onOpenDropdown="filtersStore.onOpenDropdown"
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
import type {
  DatePicker,
  DropdownsByFilterStates,
  RadioBtn,
} from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import { useI18n } from "vue-i18n";
import { aboutClientFilterStates } from "~/variable/column-constants";

// Stores
const clientsOrdersStore = useClientsOrdersStore("main");
const filtersStore = useFiltersStore("/clients/about-clients/");

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates>(null);
const DatePickerComponent = ref<typeof DatePicker>(null);
const RadioBtnComponent = ref<typeof RadioBtn>(null);

// emits
const emit = defineEmits(["clearFetchedTabs"]);

// States
const { t } = useI18n();
const route = useRoute();

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, aboutClientFilterStates);
};

const filterStates = ref([
  {
    name: t("column.status"),
    key: "order-statuses",
    get data() {
      return filtersStore.orderStatuses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedOrderStatuses;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedOrderStatuses = value;
    },
    checked: isChecked("order-statuses"),
  },
  {
    name: t("settings_sidebar.product_category"),
    key: "product-category",
    get data() {
      return filtersStore.productCategory || [];
    },
    get getSelectedData() {
      return filtersStore.selectedProductCategorieis;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedProductCategorieis = value;
    },
    checked: isChecked("product-category"),
  },
  {
    name: t("settings_sidebar.payment_method"),
    key: "currencies",
    isFilter: true,
    get data() {
      return filtersStore.currency || [];
    },
    get getSelectedData() {
      return filtersStore.selectedCurrencies;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedCurrencies = value;
    },
    checked: isChecked("currencies"),
  },
]);

// hooks
onMounted(async () => {
  await filtersStore.getDateFilterTypes();
  // onSetFilters();
});

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    RadioBtnComponent.value?.isClearable() ||
    filtersStore.selectedProductCategorieis.length ||
    filtersStore.selectedCurrencies.length ||
    filtersStore.selectedOrderStatuses.length
  );
});

// methods
const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onChangeDateFilterType = (value) => {
  clientsOrdersStore.params.date_filter_type = value;
};

const onSetFilters = async () => {
  clientsOrdersStore.params.client_id = route.params.id;
  clientsOrdersStore.params.status_id_arr = [
    ...filtersStore.selectedOrderStatuses,
  ];
  clientsOrdersStore.params.currency_id_arr = filtersStore.selectedCurrencies;
  clientsOrdersStore.params.product_category_id_arr =
    filtersStore.selectedProductCategorieis;
  clientsOrdersStore.params.date.from =
    filtersStore.selectedDateRange?.fromDate;
  clientsOrdersStore.params.date.to = filtersStore.selectedDateRange?.toDate;

  emit("clearFetchedTabs");
};

const onClearFilter = () => {
  clientsOrdersStore.setPage(1);
  filtersStore.selectedCurrencies = [];
  filtersStore.selectedOrderStatuses = [];
  filtersStore.selectedProductCategorieis = [];
  DropdownComponent.value.onClearFilter();
  DatePickerComponent.value?.onReset();
  RadioBtnComponent.value?.onReset();
  onSetFilters();
};
<\/script>
`;export{e as default};
