const e=`<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-nowrap">
    <MonthPicker
      @changeMonth="changeMonthYear"
      class="w-full sm:w-auto lg:min-w-[200px] lg:max-w-[240px]"
    />
    <div class="min-w-0 w-full sm:flex-1 sm:min-w-[140px]">
      <DropdownsByFilterStates
        :filter-states="filterStates"
        @on-open-dropdown="filtersStore.onOpenDropdown"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// stores
const filtersStore = useFiltersStore("planning/setting-plans");

// emits
const emit = defineEmits<{
  (
    e: "set-filters",
    payload: { date: MonthYearModel; tradeDirectionId: string | null },
  ): void;
}>();

// states
const { t } = useI18n();
const selectedMonthYear = ref<MonthYearModel>({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
});

const filterStates = ref<FilterStateModel[]>([
  {
    name: t("settings_sidebar.trade_direction"),
    key: "trade-directions",
    isSingleSelect: true,
    get data() {
      return filtersStore.tradeDirections;
    },
    get getSelectedData() {
      return filtersStore.selectedSingleTradeDirections;
    },
    set setSelectedData(value: string) {
      filtersStore.selectedSingleTradeDirections = value;
    },
  },
]);

// methods
const changeMonthYear = async (data: MonthYearModel) => {
  selectedMonthYear.value = data;
};

const autoSelectFirstTradeDirection = () => {
  if (
    !filtersStore.selectedSingleTradeDirections &&
    filtersStore.tradeDirections?.items?.length
  ) {
    filtersStore.selectedSingleTradeDirections =
      filtersStore.tradeDirections.items[0].id;
  }
};

const setFilters = () => {
  emit("set-filters", {
    date: selectedMonthYear.value,
    tradeDirectionId: filtersStore.selectedSingleTradeDirections || null,
  });
};

// hooks
onMounted(async () => {
  await filtersStore.getTradeDirections();
  autoSelectFirstTradeDirection();
});

watch(
  () => [selectedMonthYear.value, filtersStore.selectedSingleTradeDirections],
  () => {
    setFilters();
  },
);
<\/script>
`;export{e as default};
