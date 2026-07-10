const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="flex justify-between items-center">
        <page-title :title="title || t('create')" />
        <div v-if="!noDate" class="flex item gap-x-4">
          <DInputDatePicker
            without-time
            :label="t('column.shipped_date')"
            :value="selectedDate"
            :min-date="new Date().toString()"
            @change="onChangeDateTime"
          />
        </div>
      </div>
      <div class="filter-content">
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filterStates="filterStates"
          @onOpenDropdown="filtersStore.onOpenDropdown"
        />

        <flex-row class="submit-item">
          <m-btn :loading="loading" @click="onSetFilters">
            {{ t("apply") }}
          </m-btn>
          <ResetFilterBtn
            :is-filter-clearable="isFilterClearable"
            @onClearFilter="onClearFilter"
          />
        </flex-row>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import moment from "moment";
import { useI18n } from "vue-i18n";
import type { DropdownsByFilterStates } from "#components";

// props
const props = defineProps<{
  loading?: boolean;
  noDate?: boolean;
  title?: string;
}>();

// emits
const emit = defineEmits(["setFilters"]);

// Store
const filtersStore = useFiltersStore("/invoices/shipping-invoices");

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);

// state
const { t } = useI18n();
const selectedDate = ref<string>(moment().format("YYYY-MM-DD"));

const filterStates = ref([
  {
    name: t("sidebar.warehouse"),
    key: "warehouses",
    isSingleSelect: true,
    get data() {
      return filtersStore.warehouses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedSingleWarehouses;
    },
    set setSelectedData(value: string) {
      filtersStore.selectedSingleWarehouses = value;
    },
  },
]);

// hooks
const isFilterClearable = computed(() => {
  return (
    filtersStore.selectedSingleWarehouses ===
      filtersStore.warehouses?.items[0]?.id &&
    moment(selectedDate.value).isSame(moment().format("YYYY-MM-DD"))
  );
});

onMounted(async () => {
  await filtersStore.getWarehouses();
  onAutoSelectFirstWarehouse();
  onSetFilters();
});

// methods
const getSelectedWarehouseName = () => {
  return filtersStore.warehouses?.items.find(
    (item) => item.id === filtersStore.selectedSingleWarehouses,
  )?.name;
};

const onChangeDateTime = (value: string | null) => {
  const nextValue = value || "";
  if (nextValue === selectedDate.value) return;
  selectedDate.value = nextValue;
};

const onSetFilters = () => {
  const filter = {
    warehouse: {
      id: filtersStore.selectedSingleWarehouses,
      name: getSelectedWarehouseName(),
    },
    date: selectedDate.value,
  };
  emit("setFilters", filter);
};

const onClearFilter = () => {
  onAutoSelectFirstWarehouse();
  selectedDate.value = moment().format("YYYY-MM-DD");
  onSetFilters();
};

const onAutoSelectFirstWarehouse = () => {
  if (filtersStore.warehouses) {
    filtersStore.selectedSingleWarehouses =
      filtersStore.warehouses.items[0]?.id || "";
  }
};
<\/script>
`;export{e as default};
