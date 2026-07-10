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
const cashboxStore = useAccessCashboxStore();
const filtersStore = useFiltersStore("access/cashbox");

// Composables
const { t } = useI18n();

// State
const filterStates = ref([
  {
    name: t("settings.role"),
    key: "lib-const-role",
    isClearable: true,
    get data() {
      return filtersStore.roles;
    },
    get getSelectedData() {
      return filtersStore.selectedRoles;
    },
    set setSelectedData(value: number[]) {
      filtersStore.selectedRoles = value;
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
    !filtersStore.selectedRoles.length &&
    !filtersStore.selectedRolePositions.length &&
    filtersStore.selectedActiveStatus === null
  );
});

// Methods
const onClear = () => {
  filtersStore.selectedRoles = [];
  filtersStore.selectedRolePositions = [];
  filtersStore.selectedActiveStatus = null;
  onApply();
};

const onApply = () => {
  cashboxStore.params.roleIds = filtersStore.selectedRoles.length
    ? filtersStore.selectedRoles
    : undefined;
  cashboxStore.params.rolePositionIds = filtersStore.selectedRolePositions
    .length
    ? filtersStore.selectedRolePositions
    : undefined;
  cashboxStore.params.isActive = filtersStore.selectedActiveStatus;
};
<\/script>
`;export{e as default};
