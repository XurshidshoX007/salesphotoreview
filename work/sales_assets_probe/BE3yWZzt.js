const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <div
        class="filter-content-title flex justify-between items-center grow max-md:flex-col max-md:items-start max-md:gap-y-4"
      >
        <page-title size="xl" :title="t('sidebar.constructor_report')" />

        <div class="flex gap-4">
          <slot name="actions" />

          <div class="w-60">
            <dropdowns-by-filter-states
              :filterStates="[configStates]"
              @onOpenDropdown="onOpenConfigDropdown"
              @search="filtersStore.onSearchDropdown"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-4">
      <div class="flex flex-wrap gap-4 *:w-52">
        <dropdowns-by-filter-states
          :filterStates="filterStates"
          @onOpenDropdown="filtersStore.onOpenDropdown"
          @search="filtersStore.onSearchDropdown"
        />
      </div>

      <div class="flex gap-4 ml-auto">
        <radio-btn
          :label="t('labels.date_applies_to')"
          :items="filtersStore.orderDateFilterTypes.items"
          :selectedItem="filtersStore.selectedOrderDateFilterTypes"
          @onSelectItemId="onSelectDateFilterType"
        />
        <date-picker
          :label="t('column.date')"
          default-preset="past-30-days"
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          tomorrow-preset
          @onApply="onChangeDateRange"
        />
      </div>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
import type { Slot } from "vue";
import { useI18n } from "vue-i18n";
import { REPORT_TYPES } from "~/variable/static-constants";

// Types
type Props = {
  selectedConfigId: string | null;
};

type Emits = {
  (e: "update:selectedConfigId", value: string | null): void;
};

type FilterSlots = {
  default?: Slot;
  actions?: Slot;
};

// Props
const props = defineProps<Props>();

// Emits
const emits = defineEmits<Emits>();

// Slots
defineSlots<FilterSlots>();

// Composables
const { t } = useI18n();

// Stores
const filtersStore = useFiltersStore("/reports/report-builder");
const userConfigurationStore = useUserConfigurationStore(
  REPORT_TYPES.CONSTRUCTOR_SALES
);

// States
const { selectedConfigId } = toRefs(props);

const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const configStates = ref({
  name: "Выбрать отчёт",
  key: "report-configs",
  isSingleSelect: true,
  get data() {
    return userConfigurationStore.data
      ? { items: userConfigurationStore.data }
      : null;
  },
  get getSelectedData() {
    return selectedConfigId.value;
  },
  set setSelectedData(value: string | null) {
    emits("update:selectedConfigId", value);
  },
});

const filterStates = ref([
  {
    name: t("users.agents.agent"),
    key: "agent-dropdown",
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
    name: t("settings_sidebar.branches"),
    key: "branches",
    get data() {
      return filtersStore.branches;
    },
    get getSelectedData() {
      return filtersStore.selectedBranches;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedBranches = value;
    },
  },
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
  },
  {
    name: t("column.order"),
    key: "order-types-with-partial-return",
    get data() {
      return filtersStore.orderTypesWithPartialReturn || [];
    },
    get getSelectedData() {
      return filtersStore.selectedOrderTypesWithPartialReturn;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedOrderTypesWithPartialReturn = value;
    },
  },
]);

// Hooks
onMounted(async () => {
  await filtersStore.getOrderDateFilterTypes();
});

const withoutAgentsStates = computed(() => {
  return {
    items: filtersStore.agents
      ? [
          {
            name: t("column.without_agent"),
            id: "00000000-0000-0000-0000-000000000000",
            is_active: true,
          },
          ...filtersStore.agents.items,
        ]
      : undefined,
  };
});

// Methods
const onSelectDateFilterType = (newValue: number) => {
  filtersStore.selectedOrderDateFilterTypes = newValue;
};

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onOpenConfigDropdown = async () => {
  if (!userConfigurationStore.data) {
    await userConfigurationStore.getData();
  }
};
<\/script>

<!-- 
TODO: Remove after feature confirmation
<style scoped lang="scss">
.config-dropdown {
  :deep(.form-field) {
    .focused {
      .title {
        font-size: 14px !important;
      }
      top: 50% !important;
      transform: translateY(-50%) !important;
    }

    :first-child {
      color: white !important;
      background-color: transparent !important;
    }

    :nth-child(2) {
      background-color: theme("colors.primary.600");

      path {
        fill: white !important;
      }
    }
  }
}
</style> -->
`;export{e as default};
