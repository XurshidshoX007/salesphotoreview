const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <div
        class="flex justify-between items-center grow max-md:flex-col max-md:items-start max-md:gap-y-4"
      >
        <page-title
          size="xl"
          :title="t('cash.reconciliation.act_reconciliation')"
        />

        <div class="max-md:ml-auto">
          <slot name="tabs-list" />
        </div>
      </div>

      <div class="filter-btn-group">
        <date-picker
          ref="DatePickerComponent"
          default-preset="past-30-days"
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          @onApply="onChangeDateRange"
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

      <div class="submit-item">
        <m-btn
          :loading="reconciliationStore.isLoading"
          :disabled="isFilterDisabled"
          @click="onApplyFilters"
        >
          {{ t("apply") }}
        </m-btn>
        <reset-filter-btn
          :is-filter-clearable="isFilterClearable"
          @onClearFilter="onClearFilter"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DatePicker, DropdownsByFilterStates } from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";
import { getLibConstantsByKey } from "~/utils/local-storage";
import { useI18n } from "vue-i18n";
import { useCashboxReconciliationStatementStore } from "~/stores/dashboard/cashbox/reconciliation/reconciliation.store";
import type {
  CashboxReconciliationActiveTabType,
  CashboxReconciliationUpdatePayloadType,
} from "~/interfaces/api/cashboxes/reconciliation-statement-model";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { CashboxEventKeys } from "~/variable/event-key-constants";

// Types
type Props = {
  type: CashboxReconciliationActiveTabType;
};

// Props
const props = defineProps<Props>();

// Stores
const reconciliationStore = useCashboxReconciliationStatementStore(props.type);
const filtersStore = useFiltersStore("/dashboard/cashbox/reconciliation");
const eventBus = useEventBus();

// Composables
const { t } = useI18n();

// State
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);

const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const transactionTypes = ref<ConstantModel[]>([]);

// Hooks
onMounted(async () => {
  const constants = await getLibConstantsByKey<ConstantModel[]>(
    "ActRevise.ByClient.ClientTransactionType",
  );
  transactionTypes.value = constants || [];

  if (!isFilterDisabled.value) {
    emitUpdate();
  }
});

const isFilterDisabled = computed(() => {
  if (props.type === "by_client") {
    return !filtersStore.selectedSingleClients;
  }

  return false;
});

watch(
  () => filtersStore.selectedSingleClients,
  (newClientId) => {
    if (props.type !== "by_client") return;
    if (!newClientId) {
      reconciliationStore.paramsByClient.client_id = null;
      reconciliationStore.setLastFetchedDateKey(null);
    }
  },
);

const filterStates = computed(() => {
  if (props.type === "by_client") {
    return [
      {
        name: t("column.client"),
        key: "clients",
        isFilter: true,
        get data() {
          return filtersStore.clients || [];
        },
        get getSelectedData() {
          return filtersStore.selectedSingleClients;
        },
        set setSelectedData(value: string | null) {
          filtersStore.selectedSingleClients = value;
        },
        onLoadElse: async () => {
          await filtersStore.onLoadElseClients();
        },
        isSingleSelect: true,
        checked: true,
      },
    ];
  }

  return [
    {
      name: t("users.supervisors"),
      key: "supervisors",
      isFilter: true,
      get data() {
        return filtersStore.supervisors;
      },
      get getSelectedData() {
        return filtersStore.selectedSupervisors;
      },
      set setSelectedData(value: string[]) {
        filtersStore.selectedSupervisors = value;
      },
      checked: true,
    },
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
      checked: true,
    },
    {
      name: t("clients.forwarder"),
      key: "expeditors",
      isFilter: true,
      get data() {
        return filtersStore.expeditors || [];
      },
      get getSelectedData() {
        return filtersStore.selectedExpeditors;
      },
      set setSelectedData(value: string[]) {
        filtersStore.selectedExpeditors = value;
      },
      checked: true,
    },
    {
      name: t("settings_sidebar.client_category"),
      key: "client-categories",
      get data() {
        return filtersStore.clientCategories || [];
      },
      get getSelectedData() {
        return filtersStore.selectedClientCategories;
      },
      set setSelectedData(value: string[]) {
        filtersStore.selectedClientCategories = value;
      },
      checked: true,
    },
    {
      name: t("column.type"),
      key: "client-transaction-types",
      get data() {
        return { items: transactionTypes.value };
      },
      get getSelectedData() {
        return reconciliationStore.paramsByTerritory.client_transaction_types;
      },
      set setSelectedData(value: number[]) {
        reconciliationStore.paramsByTerritory.client_transaction_types = value;
      },
      checked: true,
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
      checked: true,
    },
    {
      name: t("settings_sidebar.territory"),
      key: "territories",
      isFilter: true,
      get data() {
        return filtersStore.territories || [];
      },
      get getSelectedData() {
        return filtersStore.selectedTerritories;
      },
      set setSelectedData(value: string[]) {
        filtersStore.selectedTerritories = value;
      },
      isTreeView: true,
      checked: true,
    },
  ];
});

const isFilterClearable = computed(() => {
  if (props.type === "by_client") {
    return !(
      DatePickerComponent.value?.isClearable() ||
      filtersStore.selectedSingleClients
    );
  }

  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedSupervisors.length ||
    filtersStore.selectedExpeditors.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedCurrencies.length ||
    reconciliationStore.paramsByTerritory.client_transaction_types?.length
  );
});

// Methods
const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onApplyFilters = async () => {
  if (isFilterDisabled.value) return;

  reconciliationStore.paramsByClient.date_range!.from =
    filtersStore.selectedDateRange?.fromDate ?? undefined;
  reconciliationStore.paramsByClient.date_range!.to =
    filtersStore.selectedDateRange?.toDate ?? undefined;

  if (props.type === "by_client") {
    reconciliationStore.paramsByClient.client_id =
      filtersStore.selectedSingleClients || null;

    emitUpdate(true);

    return;
  }

  reconciliationStore.paramsByTerritory.date_range!.from =
    filtersStore.selectedDateRange?.fromDate ?? undefined;
  reconciliationStore.paramsByTerritory.date_range!.to =
    filtersStore.selectedDateRange?.toDate ?? undefined;
  reconciliationStore.paramsByTerritory.supervisor_ids =
    filtersStore.selectedSupervisors;
  reconciliationStore.paramsByTerritory.expeditor_ids =
    filtersStore.selectedExpeditors;
  reconciliationStore.paramsByTerritory.agent_ids = filtersStore.selectedAgents;
  reconciliationStore.paramsByTerritory.client_category_ids =
    filtersStore.selectedClientCategories;
  reconciliationStore.paramsByTerritory.territory_ids =
    filtersStore.selectedTerritories;
  reconciliationStore.paramsByTerritory.currency_ids =
    filtersStore.selectedCurrencies;

  emitUpdate(true);
};

const onClearFilter = async () => {
  DatePickerComponent.value?.onReset();
  DropdownComponent.value?.onClearFilter();

  if (props.type === "by_client") {
    filtersStore.selectedSingleClients = null;
  } else {
    filtersStore.selectedSupervisors = [];
    filtersStore.selectedExpeditors = [];
    filtersStore.selectedAgents = [];
    filtersStore.selectedClientCategories = [];
    filtersStore.selectedTerritories = [];
    filtersStore.selectedCurrencies = [];
    reconciliationStore.paramsByTerritory.client_transaction_types = [];

    await onApplyFilters();
  }
};

const getDateKey = () => {
  const from = filtersStore.selectedDateRange?.fromDate ?? "";
  const to = filtersStore.selectedDateRange?.toDate ?? "";
  return \`\${from}|\${to}\`;
};

const emitUpdate = (force = false) => {
  const dateKey = getDateKey();

  if (props.type === "by_client") {
    const payload: CashboxReconciliationUpdatePayloadType = {
      type: "by_client",
      dateKey,
      force,
      disabled: isFilterDisabled.value,
      params: {
        date_range: {
          from: filtersStore.selectedDateRange?.fromDate ?? undefined,
          to: filtersStore.selectedDateRange?.toDate ?? undefined,
        },
        client_id: filtersStore.selectedSingleClients || null,
        filter: [],
      },
    };

    eventBus.emit(
      CashboxEventKeys.CASHBOX_RECONCILIATION_TABLE_UPDATE,
      payload,
    );
    return;
  }

  const payload: CashboxReconciliationUpdatePayloadType = {
    type: "by_territory",
    dateKey,
    force,
    disabled: isFilterDisabled.value,
    params: {
      date_range: {
        from: filtersStore.selectedDateRange?.fromDate ?? undefined,
        to: filtersStore.selectedDateRange?.toDate ?? undefined,
      },
      supervisor_ids: filtersStore.selectedSupervisors,
      expeditor_ids: filtersStore.selectedExpeditors,
      agent_ids: filtersStore.selectedAgents,
      client_category_ids: filtersStore.selectedClientCategories,
      territory_ids: filtersStore.selectedTerritories,
      currency_ids: filtersStore.selectedCurrencies,
      client_transaction_types:
        reconciliationStore.paramsByTerritory.client_transaction_types,
    },
  };

  eventBus.emit(CashboxEventKeys.CASHBOX_RECONCILIATION_TABLE_UPDATE, payload);
};
<\/script>
`;export{e as default};
