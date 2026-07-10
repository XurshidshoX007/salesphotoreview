const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="filter-content-header">
        <div class="filter-content-title">
          <page-title20 :title="t('sidebar.suggestion')" />
          <div class="create-button-mobile">
            <m-btn
              v-if="hasAccess2SaveSuggestion"
              @click="openSuggestionDialog"
            >
              {{ t("clients.add") }}
            </m-btn>
          </div>
        </div>
        <div class="filter-btn-group">
          <DatePicker
            ref="DatePickerComponent"
            :initial-from-date="initialFromDate"
            :initial-to-date="initialToDate"
            default-preset="this-month"
            @onApply="onApplyDateRange"
          />
          <div class="create-button-desktop">
            <m-btn
              v-if="hasAccess2SaveSuggestion"
              @click="openSuggestionDialog"
            >
              {{ t("clients.add") }}
            </m-btn>
          </div>
        </div>
      </div>
      <div class="filter-content">
        <dropdowns-by-filter-states
          ref="DropdownComponent"
          :filter-states="filterStates"
          @onOpenDropdown="filtersStore.onOpenDropdown"
          @search="filtersStore.onSearchDropdown"
        />
        <TerritoryTreeDropdowns
          ref="TerritoryTreeDropdownsComponent"
          @onSelect="filtersStore.selectedTerritories = $event"
          @pass-territory-filter-states="addTerritoryFilterStates"
        />
        <flex-row class="submit-item">
          <m-btn :loading="suggestionStore.loading" @click="onSetFilters">
            {{ t("apply") }}
          </m-btn>
          <ResetFilterBtn
            :is-filter-clearable="isFilterClearable"
            @onClearFilter="onClearFilter"
          />
        </flex-row>
      </div>
    </div>
    <transition name="modal">
      <OrdersSuggestionDialog
        v-if="isSuggestionDialogOpen"
        @close-dialog="closeSuggestionDialog"
      />
    </transition>
  </div>
</template>

<script setup lang="ts">
import type {
  DatePicker,
  DropdownsByFilterStates,
  TerritoryTreeDropdowns,
} from "#components";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import { useI18n } from "vue-i18n";
import { useSuggestionStore } from "~/stores/orders/suggestion/suggestion.store";
import { useOrdersAccess } from "~/composables/access/orders/orders";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { OrderEventKeys } from "~/variable/event-key-constants";
import type { ListParams } from "~/interfaces/api/params/list-parameters";

const { hasAccess2SaveSuggestion } = useOrdersAccess();
// Store
const suggestionStore = useSuggestionStore("main");
const filtersStore = useFiltersStore("/orders/suggestion/filters");

enum permissionFilterRoles {
  AGENT = 1,
  OPERATOR = 2,
  EXPEDITOR = 6,
}

// EventBus
const { emit } = useEventBus();

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const DatePickerComponent = ref<typeof DatePicker | null>(null);
const TerritoryTreeDropdownsComponent = ref<
  typeof TerritoryTreeDropdowns | null
>(null);

// states
const { t } = useI18n();
const eventBus = useEventBus();

const isSuggestionDialogOpen = ref(false);
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const dateRange = ref<DateRangeModel>({} as DateRangeModel);

const unAttachAgent = ref([
  {
    name: t("column.without_agent"),
    id: null,
    is_active: true,
  },
]);

const filterStates = ref<FilterStateModel[]>([
  {
    name: t("column.role_the_sender"),
    key: "lib-const-role",
    get data() {
      return roleItems.value || [];
    },
    get getSelectedData() {
      return filtersStore.selectedRoles;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedRoles = value;
    },
  },
  {
    name: t("column.sender_name"),
    key: "agent-dropdown",
    isFilter: true,
    get data() {
      return agentsForCreatedByFilter.value || [];
    },
    get getSelectedData() {
      return filtersStore.selectedCreatedByAgents;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedCreatedByAgents = value;
    },
  },
  {
    name: t("column.trade_direction_sender"),
    key: "trade-direction-created-by",
    get data() {
      return tradeDirectionsForCreatedFilter.value || [];
    },
    get getSelectedData() {
      return filtersStore.selectedCreatedByTradeDirections;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedCreatedByTradeDirections = value;
    },
  },
  {
    name: t("column.receiving_agents"),
    key: "agent-dropdown-created-by",
    isFilter: true,
    get data() {
      return withoutAgentsStates.value || [];
    },
    get getSelectedData() {
      return filtersStore.selectedAgents;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedAgents = value;
    },
  },
  {
    name: t("column.recipients_trade_direction"),
    key: "trade-directions",
    get data() {
      return tradeDirectionsForCanBeUsedFilter.value || [];
    },
    get getSelectedData() {
      return filtersStore.selectedTradeDirections;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedTradeDirections = value;
    },
  },
]);

// hooks
const withoutAgentsStates = computed(() => {
  return {
    items: filtersStore.agents
      ? [...unAttachAgent.value, ...filtersStore.agents.items]
      : [],
  };
});

const agentsForCreatedByFilter = computed(() => {
  return JSON.parse(JSON.stringify(filtersStore?.agents || []));
});

const tradeDirectionsForCreatedFilter = computed(() => {
  return JSON.parse(JSON.stringify(filtersStore?.tradeDirections || []));
});

const tradeDirectionsForCanBeUsedFilter = computed(() => {
  return {
    items: filtersStore.tradeDirections?.items.filter(
      (item) => item.can_be_used_in_order_suggestion,
    ),
  };
});

const filterRoles = computed(
  () =>
    filtersStore.roles?.items.filter((role) =>
      Object.values(permissionFilterRoles).includes(role.id),
    ) || [],
);

const roleItems = computed(() => {
  return {
    items: filterRoles,
  };
});

const isFilterClearable = computed(() => {
  return !(
    DatePickerComponent.value?.isClearable() ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedClients.length ||
    filtersStore.selectedCreatedByAgents.length ||
    filtersStore.selectedCreatedByTradeDirections.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedRoles.length ||
    filtersStore.selectedTradeDirections.length
  );
});

const updateListEventKey = OrderEventKeys.SUGGESTION_TABLE_UPDATE;

onMounted(async () => {
  onSetFilters();
});

// methods

const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[],
) => {
  filterStates.value.unshift(territoryFilterStates[1]);
};

const onApplyDateRange = (value: Record<"fromDate" | "toDate", string>) => {
  dateRange.value = value;
  filtersStore.selectedDateRange = value;
};

const onSetFilters = () => {
  const emitData: Partial<ListParams> = {
    receiver_agent_id_arr: [...filtersStore.selectedAgents],
    creator_trade_direction_id_arr: [
      ...filtersStore.selectedCreatedByTradeDirections,
    ],
    date_range: {
      from: filtersStore.selectedDateRange?.fromDate || "",
      to: filtersStore.selectedDateRange?.toDate || "",
    },
    filter: [
      {
        field: "trade_direction_id",
        value: filtersStore.selectedTradeDirections,
      },
      {
        field: "created_by_role",
        value: filtersStore.selectedRoles.map(String),
      },
      {
        field: "territory_id",
        value: filtersStore.selectedTerritories,
      },
      {
        field: "client_id",
        value: filtersStore.selectedClients,
      },
      {
        field: "created_by_id",
        value: filtersStore.selectedCreatedByAgents,
      },
    ],
  };
  suggestionStore.setFilterParams(emitData);
  eventBus.emit(updateListEventKey, emitData);
};

const onClearFilter = () => {
  filtersStore.selectedAgents = [];
  filtersStore.selectedCreatedByAgents = [];
  filtersStore.selectedClients = [];
  filtersStore.selectedTradeDirections = [];
  filtersStore.selectedCreatedByTradeDirections = [];
  filtersStore.selectedRoles = [];
  filtersStore.selectedTerritories = [];
  DropdownComponent.value?.onClearFilter();
  DatePickerComponent.value?.onReset();
  TerritoryTreeDropdownsComponent.value?.clearSelectedItems();
  onSetFilters();
};

const openSuggestionDialog = () => {
  isSuggestionDialogOpen.value = true;
};

const closeSuggestionDialog = () => {
  isSuggestionDialogOpen.value = false;
};
<\/script>
`;export{e as default};
