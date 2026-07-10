const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="filter-content-header">
        <page-title :title="t('users.agents.agent')" />
        <div class="filter-btn-group">
          <div v-show="hasAccess2Create">
            <m-btn @click="isAddDialogOpen = true">
              {{ t("users.add_agent") }}
            </m-btn>
          </div>
          <filter-checkbox-bar-btn
            :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
            :storage-key="agentFilterStates"
            @update="filtersStore.updateFilterStates($event, filterStates)"
          />
        </div>
      </div>
      <div class="filter-content">
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filterStates="filtersStore.checkedFilterStates(filterStates)"
          @onOpenDropdown="onOpenDropdown"
          @search="filtersStore.onSearchDropdown"
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
    <transition name="modal">
      <div v-if="isAddDialogOpen">
        <users-agents-dialog-body
          :modal-name="t('users.add_agent')"
          :allowToUpdate="hasAccess2Create"
          :agent-limit-data-for-agent-create="agentLimitDataForAgentCreate"
          @closeDialog="onCloseDialog"
          @openAgentLimit="openAgentLimit"
          @refresh="onSetFilters"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { DropdownsByFilterStates } from "#components";
import { useI18n } from "vue-i18n";
import { useAgentAccess } from "~/composables/access/users/agent-accesses";
import { UsersEventKeys } from "~/variable/event-key-constants";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { agentFilterStates } from "~/variable/column-constants";

// props
const props = defineProps({
  isActive: Boolean,
  agentLimitDataForAgentCreate: {
    type: Object as () => {
      product_id_arr: Array<{ product_id: string }>;
      price_type_id_arr: Array<{ price_type_id: string }>;
    },
    default: () => ({
      products: [],
      price_types: [],
    }),
  },
});

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);

// Store
const filtersStore = useFiltersStore("/users/agents");
const agentsStore = useAgentsStore("main");

// props
const emit = defineEmits([
  "clearFetchedTab",
  "openAgentLimit",
  "onCloseDialog",
]);

// composables
const { t } = useI18n();
const eventBus = useEventBus();
const { hasAccess2Create } = useAgentAccess();

// state
const { isActive } = toRefs(props);
const isAddDialogOpen = ref<boolean>(false);
const updateListEventKey = UsersEventKeys.AGENT_TABLE_UPDATE;
const rolePositions = ref<DropdownItemsModelByType<BasicEntity>>();
const selectedRolePositions = ref<string[]>([]);
const loadedTabs = new Set<boolean>();
const isFilterSetToOppositeStore = ref<boolean>(true);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, agentFilterStates);
};

const filterStates = ref([
  {
    name: t("settings_sidebar.branches"),
    key: "branches",
    get data() {
      return filtersStore.branches || [];
    },
    get getSelectedData() {
      return filtersStore.selectedBranches;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedBranches = value;
    },
    checked: isChecked("branches"),
  },
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
    name: t("column.role_position"),
    key: "role-positions",
    get data() {
      return rolePositions.value || [];
    },
    get getSelectedData() {
      return selectedRolePositions.value;
    },
    set setSelectedData(value: string[]) {
      selectedRolePositions.value = value;
    },
    checked: isChecked("role-positions"),
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
    filtersStore.selectedTradeDirections.length ||
    filtersStore.selectedWarehouses.length ||
    selectedRolePositions.value.length ||
    filtersStore.selectedBranches.length
  );
});

watch(
  isActive,
  async () => {
    if (!loadedTabs.has(props.isActive) || !isFilterSetToOppositeStore.value) {
      loadedTabs.add(props.isActive);
      await nextTick();
      onSetFilters();
      isFilterSetToOppositeStore.value = true;
    }
  },
  { immediate: true },
);

// methods
const onOpenDropdown = async (key: string) => {
  if (key === "role-positions") {
    rolePositions.value ??= await agentsStore.getAgentRolePositions();
  } else {
    filtersStore.onOpenDropdown(key);
  }
};

const onSetFilters = () => {
  eventBus.emit(updateListEventKey, {
    isActiveEvent: props.isActive,
    selectedWarehouses: filtersStore.selectedWarehouses,
    selectedTradeDirections: filtersStore.selectedTradeDirections,
    selectedRolePositions: selectedRolePositions.value,
    selectedBranches: filtersStore.selectedBranches,
  });
  isFilterSetToOppositeStore.value = false;
};

const onClearFilter = () => {
  filtersStore.selectedWarehouses = [];
  filtersStore.selectedTradeDirections = [];
  selectedRolePositions.value = [];
  filtersStore.selectedBranches = [];
  DropdownComponent.value!.onClearFilter();
  onSetFilters();
};

const openAgentLimit = () => {
  emit("openAgentLimit");
};

const onCloseDialog = () => {
  isAddDialogOpen.value = false;
  emit("onCloseDialog");
};
<\/script>
`;export{e as default};
