const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title size="xl" weight="500" :title="t('filters.filter')" />
    </div>

    <div class="filter-content">
      <dropdowns-by-filter-states
        :filter-states="filterStates"
        @on-open-dropdown="filtersStore.onOpenDropdown"
      />
      <div class="submit-item">
        <m-btn @click="onApply">
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
import { useI18n } from "vue-i18n";

// Store
const accessStore = useAccessUsersStore();
const filtersStore = useFiltersStore("access/users");

// Composables
const { t } = useI18n();

// State
const filterStates = ref([
  {
    name: t("column.parent"),
    key: "operation-parents",
    isSingleSelect: false,
    isClearable: true,
    get data() {
      return filtersStore.operationParents;
    },
    get getSelectedData() {
      return filtersStore.selectedOperationParents;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedOperationParents = value;
    },
  },
  {
    name: t("column.status"),
    key: "lib-const-user-accessed-operation-status",
    isClearable: true,
    get data() {
      return filtersStore.userAccessedOperationStatuses;
    },
    get getSelectedData() {
      return filtersStore.selectedUserAccessedOperationStatuses;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedUserAccessedOperationStatuses = value;
    },
  },
  {
    name: t("column.providing_access"),
    key: "can-grant-access-filter",
    isSingleSelect: true,
    isClearable: true,
    get data() {
      return filtersStore.consignationsBoolean;
    },
    get getSelectedData() {
      return accessStore.selectedCanGrantAccess;
    },
    set setSelectedData(value: boolean | null) {
      accessStore.selectedCanGrantAccess = value;
    },
  },
]);

// Hooks
const isFilterClearable = computed(() => {
  return (
    !filtersStore.selectedOperationParents.length &&
    !filtersStore.selectedUserAccessedOperationStatuses.length &&
    accessStore.selectedCanGrantAccess === null
  );
});

// Methods
const onClear = () => {
  filtersStore.selectedOperationParents = [];
  filtersStore.selectedUserAccessedOperationStatuses = [];
  accessStore.selectedCanGrantAccess = null;
  onApply();
};

const onApply = () => {
  accessStore.filterParams = {
    operationParents: filtersStore.selectedOperationParents.length
      ? filtersStore.selectedOperationParents
      : undefined,
    statusIds: filtersStore.selectedUserAccessedOperationStatuses.length
      ? filtersStore.selectedUserAccessedOperationStatuses
      : undefined,
    canGrantAccess: accessStore.selectedCanGrantAccess,
  };
};
<\/script>
`;export{e as default};
