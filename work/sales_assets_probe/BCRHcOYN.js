const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="filter-content-header">
        <div class="filter-content-title">
          <page-title20 :title="t('sidebar.return_packaging')" />
          <div class="create-button-mobile">
            <m-btn @click="isCreateOrdersModal = true">{{
              t("orders.add_refund")
            }}</m-btn>
            <filter-checkbox-bar-btn
              device="mobile"
              :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
              :storage-key="returnContainersFilterStates"
              @update="filtersStore.updateFilterStates($event, filterStates)"
            />
          </div>
        </div>
        <div class="filter-btn-group">
          <div class="md:w-60 w-full">
            <DropdownsByFilterStates
              class="grid grid-cols-[repeat(auto-fill,_minmax(240px,_1fr))] gap-4"
              :filterStates="filterStatesType"
              @onOpenDropdown="filtersStore.onOpenDropdown"
            />
          </div>
          <DatePicker
            ref="DatePickerComponent"
            :initial-from-date="initialFromDate"
            :initial-to-date="initialToDate"
            default-preset="today"
            @onApply="onChangeDateRange"
          />
          <div class="create-button-desktop">
            <filter-checkbox-bar-btn
              device="desktop"
              :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
              :storage-key="returnContainersFilterStates"
              @update="filtersStore.updateFilterStates($event, filterStates)"
            />
            <m-btn @click="isCreateOrdersModal = true">{{
              t("orders.add_refund")
            }}</m-btn>
          </div>
        </div>
      </div>
      <div class="filter-content">
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filterStates="filtersStore.checkedFilterStates(filterStates)"
          @onOpenDropdown="filtersStore.onOpenDropdown"
          @search="filtersStore.onSearchDropdown"
        />
        <flex-row class="submit-item">
          <m-btn
            @click="onApplyFilters"
            :loading="
              orderRefundStore.isLoading && !orderRefundStore.isFilterLoading
            "
            >{{ t("apply") }}
          </m-btn>
          <ResetFilterBtn
            :is-filter-clearable="isFilterClearable"
            @onClearFilter="onClearFilter"
          />
        </flex-row>
      </div>
    </div>
    <transition name="modal">
      <div v-if="isCreateOrdersModal">
        <OrdersCreateOrdersClientsTableWithFilter
          @closeDialog="isCreateOrdersModal = false"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { DatePicker, DropdownsByFilterStates } from "#components";
import { useI18n } from "vue-i18n";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import {
  clientFilterStates,
  returnContainersFilterStates,
} from "~/variable/column-constants";

const DropdownComponent = ref<typeof DropdownsByFilterStates>(null);
const orderRefundStore = useOrderReturnContainersStore("main");
const filtersStore = useFiltersStore("orders/return-containers");
const DatePickerComponent = ref<typeof DatePicker>(null);

// states
const { t } = useI18n();
const isCreateOrdersModal = ref<boolean>(false);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, returnContainersFilterStates);
};

const filterStates = ref([
  {
    name: t("users.agents.agent"),
    key: "agent-dropdown",
    get data() {
      return filtersStore.agents || [];
    },
    get getSelectedData() {
      return filtersStore.selectedAgents;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedAgents = value;
    },
    isFilter: true,
    checked: isChecked("agent-dropdown"),
  },
  {
    name: t("column.type"),
    key: "refund-tara-types",
    get data() {
      return filtersStore.refundTypes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedRefundTypes;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedRefundTypes = value;
    },
    checked: isChecked("refund-tara-types"),
  },
  {
    name: t("column.status"),
    key: "return-statuses",
    get data() {
      return filtersStore.returnStatuses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedStatuses;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedStatuses = value;
    },
    checked: isChecked("return-statuses"),
  },
]);
const filterStatesType = ref([
  {
    name: "",
    key: "date-types",
    get data() {
      return filtersStore.dateTypes || [];
    },
    get getSelectedData() {
      return filtersStore.selectedDateType;
    },
    set setSelectedData(value: number) {
      filtersStore.selectedDateType = value;
    },
    isSingleSelect: true,
  },
]);
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);
// hooks
onMounted(async () => {
  await filtersStore.getDateTypes();
  onApplyFilters();
}); // Called to show first item of refundTypes

// methods
const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};
const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedStatuses.length ||
    filtersStore.selectedRefundTypes.length
  );
});

const onClearFilter = () => {
  orderRefundStore.setPage(1);
  filtersStore.selectedAgents = [];
  filtersStore.selectedRefundTypes = [];
  filtersStore.selectedStatuses = [];
  DropdownComponent.value.onClearFilter();
  DatePickerComponent.value?.onReset();
  onApplyFilters();
};

const onApplyFilters = () => {
  orderRefundStore.setNullOrdersIds();
  orderRefundStore.params.agent_id_arr = [...filtersStore.selectedAgents];
  orderRefundStore.params.status_arr = filtersStore.selectedStatuses;
  orderRefundStore.params.type_arr = filtersStore.selectedRefundTypes;
  orderRefundStore.params.date_filter_type = filtersStore.selectedDateType;
  orderRefundStore.params.date_only_range!.from_value =
    filtersStore.selectedDateRange?.fromDate?.split("T")[0];
  orderRefundStore.params.date_only_range!.to_value =
    filtersStore.selectedDateRange?.toDate?.split("T")[0];
};
<\/script>
`;export{e as default};
