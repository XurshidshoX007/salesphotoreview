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
const accessStore = useAccessOperationsStore();
const filtersStore = useFiltersStore("access/operations");

// Composables
const { t } = useI18n();

// State
const filterStates = ref([
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
    name: t("users.employee_work.role_position"),
    key: "role-positions",
    isClearable: true,
    get data() {
      return filtersStore.rolePositions;
    },
    get getSelectedData() {
      return filtersStore.selectedRolePositions;
    },
    set setSelectedData(value: string[]) {
      filtersStore.selectedRolePositions = value;
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
  {
    name: t("access.activity"),
    key: "status",
    isSingleSelect: true,
    isClearable: true,
    get data() {
      return filtersStore.activeStatus;
    },
    get getSelectedData() {
      return filtersStore.selectedActiveStatus;
    },
    set setSelectedData(value: boolean) {
      filtersStore.selectedActiveStatus = value;
    },
  },
]);

// Hooks
const isFilterClearable = computed(() => {
  return (
    !filtersStore.selectedUserAccessedOperationStatuses.length &&
    !filtersStore.selectedRolePositions.length &&
    accessStore.selectedCanGrantAccess === null &&
    filtersStore.selectedActiveStatus === null
  );
});

// Methods
const onClear = () => {
  filtersStore.selectedUserAccessedOperationStatuses = [];
  filtersStore.selectedRolePositions = [];
  accessStore.selectedCanGrantAccess = null;
  filtersStore.selectedActiveStatus = null;
  onApply();
};

const onApply = () => {
  accessStore.filterParams = {
    statusIds: filtersStore.selectedUserAccessedOperationStatuses.length
      ? filtersStore.selectedUserAccessedOperationStatuses
      : undefined,
    rolePositionIds: filtersStore.selectedRolePositions.length
      ? filtersStore.selectedRolePositions
      : undefined,
    canGrantAccess: accessStore.selectedCanGrantAccess,
    isActive: filtersStore.selectedActiveStatus,
  };
};
<\/script>
`;export{e as default};
