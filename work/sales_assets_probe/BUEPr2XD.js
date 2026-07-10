const e=`<template>
  <div>
    <div class="filter-content-container">
      <div class="filter-content-header">
        <div class="filter-content-title">
          <PageTitle size="xl" :title="t('sidebar.clients_qr_codes')" />
          <div class="create-button-mobile">
            <filter-checkbox-bar-btn
              :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
              :storage-key="clientsQRCodeFilterStates"
              device="mobile"
              @update="filtersStore.updateFilterStates($event, filterStates)"
            />
          </div>
        </div>
        <div class="filter-btn-group">
          <div class="filter-btn-group">
            <RadioBtn
              ref="refDateTypePicker"
              :label="t('labels.date_applies_to')"
              :items="filtersStore.qrCodeDateFilterTypes"
              :selected-item="filtersStore.selectedQRCodeDateFilterType"
              @on-select-item-id="onSelectDateFilterType"
            />
            <DatePicker
              ref="refDatePicker"
              :label="t('column.date')"
              default-preset="past-30-days"
              :initial-from-date="initialFromDate"
              :initial-to-date="initialToDate"
              tomorrow-preset
              @onApply="onChangeDateRange"
            />
          </div>
          <div class="create-button-desktop">
            <filter-checkbox-bar-btn
              :filter-state-keys="filtersStore.filterStateKeys(filterStates)"
              :storage-key="clientsQRCodeFilterStates"
              device="desktop"
              @update="filtersStore.updateFilterStates($event, filterStates)"
            />
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
        <TerritoryTreeDropdowns
          ref="TerritoryTreeDropdownsComponent"
          :filter-storage-key="clientsQRCodeFilterStates"
          with-title
          @onSelect="filtersStore.selectedTerritories = $event"
          @pass-territory-filter-states="addTerritoryFilterStates"
        />
        <flex-row class="submit-item">
          <m-btn
            :loading="
              clientsQRCodeStore.isLoading && clientsQRCodeStore.isFilterLoading
            "
            @click="onApplyFilter"
            >{{ t("apply") }}
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
import type { DatePicker, RadioBtn, TerritoryTreeDropdowns } from "#components";
import { useI18n } from "vue-i18n";
import { clientsQRCodeFilterStates } from "~/variable/column-constants";

// store
const filtersStore = useFiltersStore("/clients/qr-codes");
const clientsQRCodeStore = useClientsQRCodeStore();

// hooks
onMounted(async () => {
  await filtersStore.getQRCodeDateFilterTypes();
  onApplyFilter();
});

const isFilterClearable = computed(() => {
  return !(
    refDatePicker.value?.isClearable() ||
    refDateTypePicker.value?.isClearable() ||
    filtersStore.selectedQRCodeStatuses.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedAttachedStatus !== undefined
  );
});

// states
const { t } = useI18n();
const initialFromDate = ref(filtersStore.selectedDateRange?.fromDate || null);
const initialToDate = ref(filtersStore.selectedDateRange?.toDate || null);
const refDatePicker = ref<typeof DatePicker | null>(null);
const refDateTypePicker = ref<typeof RadioBtn | null>(null);
const refTerritoryTreeDropdowns = ref<typeof TerritoryTreeDropdowns | null>(
  null,
);

const isChecked = (key: string) => {
  return filtersStore.isCheckedFilterState(key, clientsQRCodeFilterStates);
};

const filterStates = ref([
  {
    name: t("column.status"),
    key: "qr-code-statuses",
    get data() {
      return filtersStore.qrCodeStatuses || [];
    },
    get getSelectedData() {
      return filtersStore.selectedQRCodeStatuses;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedQRCodeStatuses = value;
    },
    checked: isChecked("qr-code-statuses"),
  },
  {
    name: t("clients.qr_codes.attached"),
    key: "attached-status",
    isSingleSelect: true,
    get data() {
      return filtersStore.attachedStatus || [];
    },
    get getSelectedData() {
      return filtersStore.selectedAttachedStatus;
    },
    set setSelectedData(value: boolean | null) {
      filtersStore.selectedAttachedStatus = value;
    },
    checked: isChecked("attached-status"),
  },
]);

// methods
const onChangeDateRange = (newRange: DateRangeModel) => {
  filtersStore.selectedDateRange = newRange;
};

const onApplyFilter = () => {
  clientsQRCodeStore.isFilterLoading = true;
  clientsQRCodeStore.params.filter = [
    {
      field: "territory_id",
      value: filtersStore.selectedTerritories,
    },
    {
      field: "status",
      value: filtersStore.selectedQRCodeStatuses.length
        ? filtersStore.selectedQRCodeStatuses.join(",").split(",")
        : [],
    },
    {
      field: "is_attached",
      value: filtersStore.selectedAttachedStatus?.toString()
        ? [filtersStore.selectedAttachedStatus.toString()]
        : [],
    },
  ];

  clientsQRCodeStore.params.date_filter = {
    range: {
      from: filtersStore.selectedDateRange?.fromDate || null,
      to: filtersStore.selectedDateRange?.toDate || null,
    },
    filter_type: filtersStore.selectedQRCodeDateFilterType,
  };
};

const onClearFilter = () => {
  clientsQRCodeStore.setPage(1);
  filtersStore.selectedQRCodeStatuses = [];
  filtersStore.selectedAttachedStatus = undefined;
  filtersStore.selectedTerritories = [];
  refDatePicker.value?.onReset();
  refDateTypePicker.value?.onReset();
  refTerritoryTreeDropdowns.value!.clearSelectedItems();
  onApplyFilter();
};

const onSelectDateFilterType = (id: number) => {
  filtersStore.selectedQRCodeDateFilterType = id;
};

const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[],
) => {
  filterStates.value.push(...territoryFilterStates);
};
<\/script>
`;export{e as default};
