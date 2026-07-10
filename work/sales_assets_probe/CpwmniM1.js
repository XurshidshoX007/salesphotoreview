const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="flex justify-between items-center">
        <page-title :title="t('users.auditors.auditors')" />
        <div class="filter-btn-group">
          <m-btn v-show="hasAccess2Create" @click="isDialogOpen = true">
            {{ t("users.auditors.add_auditors") }}
          </m-btn>
        </div>
      </div>
      <div class="filter-content">
        <dropdowns-by-filter-states
          ref="DropdownComponent"
          :filter-states="filterStates"
          @on-open-dropdown="onOpenDropdown"
          @search="filtersStore.onSearchDropdown"
        />

        <flex-row class="submit-item">
          <m-btn @click="onSetFilters">
            {{ t("apply") }}
          </m-btn>
          <reset-filter-btn
            :is-filter-clearable="isFilterClearable"
            @on-clear-filter="onClearFilter"
          />
        </flex-row>
      </div>
    </div>
    <transition name="modal">
      <div v-if="isDialogOpen">
        <users-auditor-dialog
          :is-active="props.isActive"
          @close-dialog="closeDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { DropdownsByFilterStates } from "#components";
import { useI18n } from "vue-i18n";
import { UsersEventKeys } from "~/variable/event-key-constants";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { useAuditorAccess } from "~/composables/access/users/auditors-access";

// Props
const props = defineProps({
  isActive: Boolean,
});

// Child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);

// Composables
const { t } = useI18n();
const eventBus = useEventBus();

// Store
const filtersStore = useFiltersStore("/users/auditors");
const auditorStore = useAuditorsStore("main");

// Access
const { hasAccess2Create } = useAuditorAccess();

// Constants
const updateListEventKey = UsersEventKeys.AUDITOR_TABLE_UPDATE;

// States
const { isActive } = toRefs(props);
const isDialogOpen = ref<boolean>(false);
const rolePositions = ref<DropdownItemsModelByType<BasicEntity>>();
const selectedRolePositions = ref<string[]>([]);
const loadedTabs = new Set<boolean>();
const isFilterSetToOppositeStore = ref<boolean>(true);

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
  },
]);

// Hooks
const isFilterClearable = computed(() => {
  return !(
    selectedRolePositions.value.length || filtersStore.selectedBranches.length
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

// Methods
const onOpenDropdown = async (key: string) => {
  if (key === "role-positions") {
    rolePositions.value ??= await auditorStore.getAuditorRolePositions();
  } else {
    filtersStore.onOpenDropdown(key);
  }
};

const onSetFilters = () => {
  eventBus.emit(updateListEventKey, {
    isActiveEvent: props.isActive,
    selectedRolePositions: selectedRolePositions.value,
    selectedBranches: filtersStore.selectedBranches,
  });
  isFilterSetToOppositeStore.value = false;
};

const onClearFilter = () => {
  selectedRolePositions.value = [];
  filtersStore.selectedBranches = [];
  DropdownComponent.value!.onClearFilter();
  onSetFilters();
};

const closeDialog = () => {
  isDialogOpen.value = false;
};
<\/script>
`;export{e as default};
