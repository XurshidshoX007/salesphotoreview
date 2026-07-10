const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title20 :title="t('filters.filter')" />
      <div class="filter-btn-group">
        <RadioBtn
          :label="t('labels.type_order')"
          :items="consignationFilterTypes"
          :selectedItem="filtersStore.selectedConsignationFilterType"
          @onSelectItemId="onSelectConsignationFilterType"
        />
        <DatePicker
          ref="DatePickerComponent"
          default-preset="this-month"
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          @onApply="onApplyDateRange"
        />
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="applicationPaymentFilterStates"
          @update="filtersStore.updateFilterStates($event, filterStates)"
        />
      </div>
    </div>
    <div class="filter-content">
      <DropdownsByFilterStates
        ref="DropdownComponent"
        :filterStates="filtersStore.checkedFilterStates(filterStates)"
        @onOpenDropdown="filtersStore.onOpenDropdown"
        @search="filtersStore.onSearchDropdown"
      />
      <TerritoryTreeDropdowns
        ref="TerritoryTreeDropdownsComponent"
        :filter-storage-key="applicationPaymentFilterStates"
        @onSelect="filtersStore.selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
      <flex-row class="submit-item">
        <m-btn @click="onSetFilters" :loading="isLoading && !isFilterLoading">
          {{ t("apply") }}</m-btn
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
import type {
  DatePicker,
  DropdownsByFilterStates,
  TerritoryTreeDropdowns,
} from "#components";
import { useI18n } from "vue-i18n";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { applicationPaymentFilterStates } from "~/variable/column-constants";
import {
  ApplicationPaymentGroupingType,
  ConsignationFilterType,
  PaymentStatus,
} from "~/variable/static-constants";
import type { ListParams } from "~/interfaces/api/params/list-parameters";

// props
const paymentGroupingTypes = [
  ApplicationPaymentGroupingType.BankPayments,
  ApplicationPaymentGroupingType.CashCollectorPayments,
  ApplicationPaymentGroupingType.ExpeditorPayments,
  ApplicationPaymentGroupingType.VanSellingPayments,
] as const;

const props = defineProps<{
  isFilterLoading: boolean;
  isLoading: boolean;
  params: ListParams & { consignation_filter_type: number };
  groupType: (typeof paymentGroupingTypes)[number];
}>();

// Store
const filtersStore = useFiltersStore(
  \`/dashboard/applications-payment/\${props.groupType}\`,
);

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

interface IEmitTypes {
  (e: "onSetFilters", data?: ListParams): void;
}
// emits

const emit = defineEmits<IEmitTypes>();

// states
const { t } = useI18n();
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, applicationPaymentFilterStates);
};

const filterStates = ref<FilterStateModel[]>([
  {
    name: t("settings_sidebar.trade_direction"),
    key: "trade-directions",
    get data() {
      return filtersStore.tradeDirections || [];
    },
    get getSelectedData() {
      return filtersStore.selectedTradeDirections;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedTradeDirections = value;
    },
    checked: isChecked("trade-directions"),
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
  {
    name: t("column.status"),
    key: "payment-statuses",
    get data() {
      return filtersStore.paymentStatuses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedPaymentStatuses;
    },
    set setSelectedData(value: number) {
      filtersStore.selectedPaymentStatuses = value;
    },
    isSingleSelect: true,
    checked: isChecked("payment-statuses"),
  },
  ...(props.groupType === ApplicationPaymentGroupingType.VanSellingPayments
    ? [
        {
          name: "Van-selling",
          key: "van-selling-agent-dropdown",
          get data() {
            return filtersStore.vanSellingAgents || [];
          },
          get getSelectedData() {
            return filtersStore.selectedVanSellingAgents;
          },
          set setSelectedData(value: string[]) {
            filtersStore.selectedVanSellingAgents = value;
          },
          checked: isChecked("van-selling-agent-dropdown"),
        },
      ]
    : [
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
          checked: isChecked("agent-dropdown"),
        },
      ]),
] as FilterStateModel[]);

const consignationFilterTypes = computed(() => {
  return filtersStore.consignationFilterTypes || undefined;
});

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedExpeditors.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedVanSellingAgents.length ||
    filtersStore.selectedCashCollector.length ||
    filtersStore.selectedCurrencies.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedTradeDirections.length ||
    filtersStore.selectedConsignationFilterType !==
      ConsignationFilterType.All ||
    filtersStore.selectedPaymentStatuses !== PaymentStatus.WaitingForApprove
  );
});

onMounted(async () => {
  onAddFilter();
  filtersStore.selectedPaymentStatuses = 1; // set to waiting for approve
  await Promise.all([
    filtersStore.getConsignationFilterTypes(),
    filtersStore.getPaymentStatuses(),
  ]);

  onSetFilters();
});

// methods

const filterDefinitions: Record<
  "cashCollectors" | "expeditors",
  FilterStateModel
> = {
  cashCollectors: {
    name: t("sidebar.cash_collector"),
    key: "cash-collector",
    get data() {
      return filtersStore.cashCollector || [];
    },
    get getSelectedData() {
      return filtersStore.selectedCashCollector;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedCashCollector = value;
    },
    checked: isChecked("cash-collector"),
  },
  expeditors: {
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
};

const onAddFilter = () => {
  switch (props.groupType) {
    case ApplicationPaymentGroupingType.ExpeditorPayments:
      filterStates.value.unshift(filterDefinitions.expeditors);
      break;

    case ApplicationPaymentGroupingType.CashCollectorPayments:
      filterStates.value.unshift(filterDefinitions.cashCollectors);
      break;

    default:
      break;
  }
};

const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[],
) => {
  filterStates.value.push(...territoryFilterStates);
};

const onClearFilter = () => {
  props.params.page = 1;

  Object.assign(filtersStore, {
    selectedExpeditors: [],
    selectedAgents: [],
    selectedVanSellingAgents: [],
    selectedTradeDirections: [],
    selectedTerritories: [],
    selectedCurrencies: [],
    selectedCashCollector: [],
    selectedPaymentStatuses: PaymentStatus.WaitingForApprove,
    selectedConsignationFilterType: ConsignationFilterType.All,
    selectedDateRange: null,
  });

  TerritoryTreeDropdownsComponent.value?.clearSelectedItems();
  DropdownComponent.value?.onClearFilter();
  DatePickerComponent.value?.onReset();

  onSetFilters();
};

const onSelectConsignationFilterType = (newValue: number) => {
  filtersStore.selectedConsignationFilterType = newValue;
};

const onSetFilters = () => {
  props.params.page = 1;

  const filterMap: Record<string, any> = {
    request_creator_id: requestCreatorFilter(),
    agent_id: agentFilter(),
    trade_direction_id: filtersStore.selectedTradeDirections,
    territory_id: filtersStore.selectedTerritories,
    currency_id: filtersStore.selectedCurrencies,
    status: filtersStore.selectedPaymentStatuses || null,
  };

  Object.entries(filterMap).forEach(([field, value]) =>
    setFilter(field, value),
  );

  props.params.consignation_filter_type =
    filtersStore.selectedConsignationFilterType;

  if (filtersStore.selectedDateRange) {
    const fromDate = filtersStore.selectedDateRange.fromDate || undefined;
    const toDate = filtersStore.selectedDateRange.toDate || undefined;

    props.params.date_range = {
      from: fromDate,
      to: toDate,
    };
  } else {
    props.params.date_range = undefined;
  }

  emit("onSetFilters", props.params);
};

const requestCreatorFilter = () => {
  const map = {
    [ApplicationPaymentGroupingType.BankPayments]: [],
    [ApplicationPaymentGroupingType.VanSellingPayments]:
      filtersStore.selectedVanSellingAgents,
    [ApplicationPaymentGroupingType.ExpeditorPayments]:
      filtersStore.selectedExpeditors,
    [ApplicationPaymentGroupingType.CashCollectorPayments]:
      filtersStore.selectedCashCollector,
  };

  return map[props.groupType] ?? [];
};

const agentFilter = () => {
  if (props.groupType === ApplicationPaymentGroupingType.VanSellingPayments) {
    return [];
  }

  return filtersStore.selectedAgents;
};

function setFilter(field: string, value: any) {
  if (!props.params.filter) props.params.filter = [];

  const normalizedValue = Array.isArray(value)
    ? value
    : value != null
      ? [value.toString()]
      : [];

  const existing = props.params.filter.find((f) => f.field === field);

  if (existing) {
    if (!normalizedValue.length) {
      props.params.filter = props.params.filter.filter((f) => f !== existing);
      return;
    }

    existing.value = normalizedValue;
  } else if (normalizedValue.length > 0) {
    props.params.filter.push({ field, value: normalizedValue });
  }
}

const onApplyDateRange = (value: any) => {
  filtersStore.selectedDateRange = value;
};
<\/script>
`;export{e as default};
