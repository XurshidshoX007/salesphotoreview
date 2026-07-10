const e=`<template>
  <div class="filter-content-container">
    <div v-if="!id" class="filter-content-header">
      <div class="flex items-center gap-3">
        <back-btn
          without-title
          class="size-10"
          :link="AppRoutes.access.route"
        />
        <page-title :title="t('access.history_title')" size="xl" weight="500" />
      </div>

      <div class="filter-btn-group">
        <date-picker
          ref="DatePickerComponent"
          :initial-from-date="initialFromDate"
          :initial-to-date="initialToDate"
          default-preset="past-30-days"
          @onApply="onChangeDateRange"
        />
        <filter-checkbox-bar-btn
          :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
          :storage-key="accessHistoryFilterStates"
          @update="filtersStore.updateFilterStates($event, filterStates)"
        />
      </div>
    </div>

    <div class="filter-content">
      <dropdowns-by-filter-states
        ref="DropdownComponent"
        :filter-states="filtersStore.checkedFilterStates(filterStates)"
        @on-open-dropdown="filtersStore.onOpenDropdown"
      />
      <div class="submit-item">
        <m-btn @click="onApply" :loading="historyStore.isLoading">
          {{ t("apply") }}
        </m-btn>
        <reset-filter-btn
          :is-filter-clearable="isFilterClearable"
          @on-clear-filter="onClear"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DatePicker, DropdownsByFilterStates } from "#components";
import { useI18n } from "vue-i18n";
import { accessHistoryFilterStates } from "~/variable/column-constants";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import type { FilterParams } from "~/interfaces/api/params/list-parameters";
import { AppRoutes } from "~/variable/routes";

// Types
type Props = {
  id?: string;
  extraFilters?: FilterParams[];
};

// Props
const props = withDefaults(defineProps<Props>(), {
  extraFilters: () => [],
});

// Store
const historyStore = useAccessHistoryStore(props.id || "main");
const filtersStore = useFiltersStore(
  props.id ? \`access/history/\${props.id}\` : "access/history",
);

// Child-components
const DropdownComponent = ref<InstanceType<
  typeof DropdownsByFilterStates
> | null>(null);
const DatePickerComponent = ref<InstanceType<typeof DatePicker> | null>(null);

// Composables
const { t } = useI18n();

// State
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);

const filterStates = ref([
  {
    name: t("access.history_action_type"),
    key: "lib-const-access-action-type",
    isClearable: true,
    get data() {
      return filtersStore.accessActionTypes;
    },
    get getSelectedData() {
      return filtersStore.selectedAccessActionTypes;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedAccessActionTypes = value;
    },
    checked: isChecked("lib-const-access-action-type"),
  },
]);

// Computed
const isFilterClearable = computed(() => {
  if (props.id) {
    return !filtersStore.selectedAccessActionTypes.length;
  }
  return (
    !filtersStore.selectedAccessActionTypes.length &&
    !DatePickerComponent.value?.isClearable()
  );
});

// Methods
function isChecked(key: string) {
  return filtersStore.isCheckedFilterState(key, accessHistoryFilterStates);
}

onMounted(() => {
  onApply();
});

const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onApply = () => {
  // TODO: FILTER IS NOT FINISHED YET.
  // NEED TO ADD OPERATION AND USER DROPDOWN AS A TREE.
  // TREE STYLE IS ALREADY DONE, JUST NEED TO CONNECT THE API ONCE THE BACKEND IS READY.
  historyStore.params.filter = [
    ...props.extraFilters,
    {
      field: "access_action_type_id",
      value: filtersStore.selectedAccessActionTypes.map(String),
    },
  ];

  if (!props.id) {
    historyStore.params.date_range!.from =
      filtersStore.selectedDateRange?.fromDate;
    historyStore.params.date_range!.to = filtersStore.selectedDateRange?.toDate;
  }
};

const onClear = () => {
  filtersStore.selectedAccessActionTypes = [];
  DropdownComponent.value?.onClearFilter();
  if (!props.id) {
    DatePickerComponent.value?.onReset();
  }
  onApply();
};
<\/script>
`;export{e as default};
