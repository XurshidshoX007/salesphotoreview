const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <div class="filter-content-title">
        <page-title20
          :title="
            isOrder
              ? t('orders.order_van_selling')
              : t('orders.return_van_selling')
          "
        />
        <div class="create-button-mobile">
          <m-btn v-show="allowToCreate" @click="onOpenCreateModal">{{
            isOrder ? t("filters.order") : t("filters.return")
          }}</m-btn>
          <filter-checkbox-bar-btn
            device="mobile"
            :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
            :storage-key="orderVanSellingFilterStates"
            @update="filtersStore.updateFilterStates($event, filterStates)"
          />
        </div>
      </div>

      <div class="filter-btn-group">
        <RadioBtn
          ref="RadioBtnComponent"
          :label="t('labels.date_applies_to')"
          :items="dateTypes"
          :selectedItem="filtersStore.selectedDateFilterType"
          @onSelectItemId="onSelectDateType"
        />
        <DatePicker
          ref="DatePickerComponent"
          tomorrow-preset
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          default-preset="today"
          @onApply="onChangeDateRange"
        />
        <div class="create-button-desktop">
          <filter-checkbox-bar-btn
            device="desktop"
            :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
            :storage-key="orderVanSellingFilterStates"
            @update="filtersStore.updateFilterStates($event, filterStates)"
          />
          <m-btn v-show="allowToCreate" @click="onOpenCreateModal">{{
            isOrder ? t("filters.order") : t("filters.return")
          }}</m-btn>
        </div>
      </div>
    </div>
    <div class="filter-content">
      <dropdowns-by-filter-states
        ref="DropdownComponent"
        :filterStates="filtersStore.checkedFilterStates(filterStates)"
        @onOpenDropdown="filtersStore.onOpenDropdown"
        @search="filtersStore.onSearchDropdown"
      />
      <div class="submit-item">
        <m-btn
          @click="onApplyFilter"
          :loading="
            vanSellingOrdersStore.isLoading &&
            !vanSellingOrdersStore.isFilterLoading
          "
        >
          {{ t("apply") }}
        </m-btn>
        <ResetFilterBtn
          @onClearFilter="onClearFilterAndApply"
          :is-filter-clearable="isFilterClearable"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DatePicker, DropdownsByFilterStates } from "#components";
import type { RadioBtn } from "#components";
import { useI18n } from "vue-i18n";
import { orderVanSellingFilterStates } from "~/variable/column-constants";

// store
const vanSellingOrdersStore = useVanSellingOrdersStore("main");
const filtersStore = useFiltersStore("orders/van-selling");

// child-components
const DatePickerComponent = ref<typeof DatePicker>();
const DropdownComponent = ref<typeof DropdownsByFilterStates>();
const RadioBtnComponent = ref<typeof RadioBtn | null>(null);

// props
const props = defineProps({
  allowToCreate: Boolean,
});

// emits
const emit = defineEmits(["onOpenCreateModal"]);

// states
const { t } = useI18n();
const route = useRoute();
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, orderVanSellingFilterStates);
};

const filterStates = ref([
  {
    name: t("users.agents.agent"),
    key: "agent-dropdown",
    isFilter: true,
    get data() {
      return filtersStore.agents || [];
    },
    get getSelectedData() {
      return filtersStore.selectedAgents;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedAgents = value;
    },
    checked: isChecked("agent-dropdown"),
  },
  {
    name: t("column.status"),
    key: "van-selling-status",
    get data() {
      return filtersStore.vanSellingStatuses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedVanSellingStatuses;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedVanSellingStatuses = value;
    },
    checked: isChecked("van-selling-status"),
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
  {
    name: t("sidebar.warehouse") + " (Van selling)",
    key: "van-selling-warehouse",
    get data() {
      return filtersStore.vanSellingWarehouses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedVanSellingWarehouses;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedVanSellingWarehouses = value;
    },
    checked: isChecked("van-selling-warehouse"),
  },
  {
    name: t("settings_sidebar.price_type"),
    key: "price-type",
    get data() {
      return filtersStore?.priceTypes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedPriceTypes;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedPriceTypes = value;
    },
    checked: isChecked("price-type"),
  },
]);

// hooks
const dateTypes = computed(() => {
  return vanSellingOrdersStore.dateFilterTypes || [];
});

const isOrder = computed(() => {
  return route.query.order_type === "1";
});

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    RadioBtnComponent.value?.isClearable() ||
    filtersStore.selectedVanSellingStatuses.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedWarehouses.length ||
    filtersStore.selectedVanSellingWarehouses.length ||
    filtersStore.selectedPriceTypes.length
  );
});

watch(
  () => route.query.order_type,
  () => {
    onClearFilter();
  }
);

onMounted(async () => {
  await vanSellingOrdersStore.getDateFilterType();
  onApplyFilter();
});

// methods
const onOpenCreateModal = () => {
  emit("onOpenCreateModal");
};

const onSelectDateType = (id: number) => {
  filtersStore.selectedDateFilterType = id;
};

const onApplyFilter = () => {
  vanSellingOrdersStore.setNullOrdersIds();
  vanSellingOrdersStore.params.orderType = route.query.order_type;
  vanSellingOrdersStore.params.status_id_arr =
    filtersStore.selectedVanSellingStatuses;
  vanSellingOrdersStore.params.filter = [
    {
      field: "agent_id",
      value: filtersStore.selectedAgents,
    },
  ];
  vanSellingOrdersStore.params.warehouse_id_arr =
    filtersStore.selectedWarehouses;
  vanSellingOrdersStore.params.agent_warehouse_id_arr =
    filtersStore.selectedVanSellingWarehouses;
  vanSellingOrdersStore.params.price_type_id_arr =
    filtersStore.selectedPriceTypes;
  vanSellingOrdersStore.params.date_filter_type = Number(
    filtersStore.selectedDateFilterType
  );
  if (filtersStore.selectedDateRange) {
    vanSellingOrdersStore.params.date_only_range.from_value =
      \`\${filtersStore.selectedDateRange.fromDate}\`?.split("T")[0];
    vanSellingOrdersStore.params.date_only_range.to_value =
      \`\${filtersStore.selectedDateRange.toDate}\`?.split("T")[0];
  }
};

const onClearFilterAndApply = () => {
  onClearFilter();
  onApplyFilter();
};

const onClearFilter = () => {
  filtersStore.selectedVanSellingStatuses = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedWarehouses = [];
  filtersStore.selectedVanSellingWarehouses = [];
  filtersStore.selectedPriceTypes = [];
  DropdownComponent.value.onClearFilter();
  DatePickerComponent.value?.onReset();
  RadioBtnComponent.value?.onReset();
};
const onChangeDateRange = (newRange: any) => {
  filtersStore.selectedDateRange = newRange;
};
<\/script>
`;export{e as default};
