const e=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <div
        class="filter-content-title flex justify-between items-center grow max-md:flex-col max-md:items-start max-md:gap-y-4"
      >
        <PageTitle size="xl" :title="t('sidebar.merging_clients')" />
        <div class="max-md:ml-auto">
          <slot name="tabs-list" />
        </div>
      </div>
    </div>
    <div v-if="filterStates.length" class="filter-content">
      <DropdownsByFilterStates
        ref="DropdownComponent"
        :filter-states="filtersStore.checkedFilterStates(filterStates)"
        @on-open-dropdown="filtersStore.onOpenDropdown"
        @search="filtersStore.onSearchDropdown"
      />
      <div v-if="props.type === CLIENT_DUPLICATION_TAB_TYPES.BY_LOCATION">
        <d-input
          type="number"
          :label="t('clients.duplication.radius')"
          :value="radius"
          :min="1"
          :required="!radius"
          @change="radius = $event"
        />
      </div>
      <flex-row class="submit-item">
        <m-btn
          :loading="
            clientsDuplicationStore[props.type].isLoading &&
            clientsDuplicationStore[props.type].isFilterLoading
          "
          :disabled="isFilterDisabled"
          @click="onApplyFilter"
          >{{ t("apply") }}
        </m-btn>
        <ResetFilterBtn
          :is-filter-clearable="isFilterClearable"
          @on-clear-filter="onClearFilter"
        />
      </flex-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { clientsDuplicationFilterStates } from "~/variable/column-constants";
import { CLIENT_DUPLICATION_TAB_TYPES } from "~/variable/static-constants";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { ClientEventKeys } from "~/variable/event-key-constants";
import { DEFAULT_BY_LOCATION_RADIUS } from "~/stores/clients/duplication/clients-duplication.store";

type Props = {
  type: ClientsDuplicationTabType;
};

const props = defineProps<Props>();

// Constants
const updateListEventKey = ClientEventKeys.CLIENT_DUPLICATION_TABLE_UPDATE;

// Stores
const clientsDuplicationStore = useClientDuplicationStore();
const filtersStore = useFiltersStore("/clients/duplication");

// Composable
const { t } = useI18n();
const eventBus = useEventBus();

// States
const radius = ref<number>(DEFAULT_BY_LOCATION_RADIUS);

const filterStates = computed(() => {
  const baseStates = [
    {
      name: t("settings_sidebar.branches"),
      key: "branches",
      isFilter: true,
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
      name: t("users.agents.agent"),
      key: "agent-dropdown",
      isFilter: true,
      get data() {
        return filtersStore.agents || [];
      },
      get getSelectedData() {
        return filtersStore.selectedAgents;
      },
      set setSelectedData(value: string[]) {
        filtersStore.selectedAgents = value;
      },
      checked: isChecked("agent-dropdown"),
    },
    {
      name: t("settings_sidebar.territory"),
      key: "territories",
      isFilter: true,
      get data() {
        return filtersStore.territories || [];
      },
      get getSelectedData() {
        return filtersStore.selectedTerritories;
      },
      set setSelectedData(value: string[]) {
        filtersStore.selectedTerritories = value;
      },
      isTreeView: true,
      checked: isChecked("territories"),
    },
    {
      name: t("settings.client_format"),
      key: "client-format",
      get data() {
        return filtersStore.clientFormat || [];
      },
      get getSelectedData() {
        return filtersStore.selectedClientFormat;
      },
      set setSelectedData(value: string[]) {
        filtersStore.selectedClientFormat = value;
      },
      checked: isChecked("client-format"),
    },
    {
      name: t("settings_sidebar.client_category"),
      key: "client-categories",
      get data() {
        return filtersStore.clientCategories || [];
      },
      get getSelectedData() {
        return filtersStore.selectedClientCategories;
      },
      set setSelectedData(value: string[]) {
        filtersStore.selectedClientCategories = value;
      },
      checked: isChecked("client-categories"),
    },
    {
      name: t("settings_sidebar.client_type"),
      key: "client-types",
      isFilter: true,
      get data() {
        return filtersStore.clientTypes || [];
      },
      get getSelectedData() {
        return filtersStore.selectedClientTypes;
      },
      set setSelectedData(value: string[]) {
        filtersStore.selectedClientTypes = value;
      },
      checked: isChecked("client-types"),
    },
    {
      name: t("column.status"),
      key: "status",
      get data() {
        return filtersStore.activeStatus;
      },
      get getSelectedData() {
        return filtersStore.selectedActiveStatus;
      },
      set setSelectedData(value: boolean) {
        filtersStore.selectedActiveStatus = value;
      },
      isSingleSelect: true,
      checked: isChecked("status"),
    },
  ];

  switch (props.type) {
    case CLIENT_DUPLICATION_TAB_TYPES.BY_FIELDS:
      return [
        ...baseStates,
        {
          name: t("search_by"),
          key: "clients-duplication-by-fields-types",
          get data() {
            return filtersStore.clientsDuplicationByFieldsFilterTypes || [];
          },
          get getSelectedData() {
            return filtersStore.selectedClientsDuplicationByFieldsFilterTypeIds;
          },
          set setSelectedData(value: number[]) {
            filtersStore.selectedClientsDuplicationByFieldsFilterTypeIds =
              value;
          },
          checked: isChecked("clients-duplication-by-fields-types"),
          class: cn(
            "[&_.title]:transition-colors [&_.border-1]:transition-colors",
            {
              "[&_.title]:!text-red-600 [&_.border-1]:!border-red-600":
                !filtersStore.selectedClientsDuplicationByFieldsFilterTypeIds
                  .length,
            }
          ),
        },
      ];
    case CLIENT_DUPLICATION_TAB_TYPES.BY_LOCATION:
      return baseStates;
    default:
      return [];
  }
});

const isFilterClearable = computed(() => {
  return !(
    filtersStore.selectedBranches.length ||
    filtersStore.selectedAgents.length ||
    filtersStore.selectedTerritories.length ||
    filtersStore.selectedClientFormat.length ||
    filtersStore.selectedClientCategories.length ||
    filtersStore.selectedClientTypes.length ||
    filtersStore.selectedActiveStatus !== null ||
    filtersStore.selectedClientsDuplicationByFieldsFilterTypeIds.length <
      (filtersStore.clientsDuplicationByFieldsFilterTypes?.items.length || 0) ||
    radius.value !== DEFAULT_BY_LOCATION_RADIUS
  );
});

const onClearFilter = () => {
  switch (props.type) {
    case CLIENT_DUPLICATION_TAB_TYPES.BY_FIELDS:
      clientsDuplicationStore.by_fields.setPage(1);
      break;
    case CLIENT_DUPLICATION_TAB_TYPES.BY_LOCATION:
      clientsDuplicationStore.by_location.setPage(1);
      break;
  }

  filtersStore.selectedBranches = [];
  filtersStore.selectedAgents = [];
  filtersStore.selectedTerritories = [];
  filtersStore.selectedClientFormat = [];
  filtersStore.selectedClientCategories = [];
  filtersStore.selectedClientTypes = [];
  filtersStore.selectedActiveStatus = null;
  filtersStore.selectedClientsDuplicationByFieldsFilterTypeIds =
    filtersStore.clientsDuplicationByFieldsFilterTypes?.items.map(
      (item) => item.id
    ) || [];
  radius.value = DEFAULT_BY_LOCATION_RADIUS;
  onApplyFilter();
};

// Methods
function isChecked(key: string) {
  return filtersStore.isCheckedFilterState(key, clientsDuplicationFilterStates);
}

const onApplyFilter = () => {
  clientsDuplicationStore.generalParams.branch_id_arr = filtersStore.selectedBranches;
  clientsDuplicationStore.generalParams.agent_ids = filtersStore.selectedAgents;
  clientsDuplicationStore.generalParams.territory_ids =
    filtersStore.selectedTerritories;
  clientsDuplicationStore.generalParams.filter = [
    {
      field: "format_id",
      value: filtersStore.selectedClientFormat,
    },
    {
      field: "category_id",
      value: filtersStore.selectedClientCategories,
    },
    {
      field: "type_id",
      value: filtersStore.selectedClientTypes,
    },
    {
      field: "is_active",
      value:
        filtersStore.selectedActiveStatus !== null
          ? [filtersStore.selectedActiveStatus.toString()]
          : [],
    },
  ];

  switch (props.type) {
    case CLIENT_DUPLICATION_TAB_TYPES.BY_FIELDS:
      clientsDuplicationStore.additinalParams[
        CLIENT_DUPLICATION_TAB_TYPES.BY_FIELDS
      ].by_fields = clientDuplicationByFieldsTypeKeys.value.by_fields;
      break;
    case CLIENT_DUPLICATION_TAB_TYPES.BY_LOCATION:
      clientsDuplicationStore.additinalParams.by_location.in_radius =
        radius.value;
      break;
  }

  eventBus.emit(updateListEventKey);
};

// Hooks
onMounted(async () => {
  if (!filtersStore.clientsDuplicationByFieldsFilterTypes?.items) {
    await filtersStore.getClientsDuplicationByFieldsFilterTypes();
  }

  filtersStore.selectedClientsDuplicationByFieldsFilterTypeIds =
    DEFAULT_BY_FIELDS_VALUES.reduce<number[]>((acc, key) => {
      const item =
        filtersStore.clientsDuplicationByFieldsFilterTypes?.items.find(
          (i) => i.key === key
        );
      if (item) {
        acc.push(item.id);
      }
      return acc;
    }, []);
});

const clientDuplicationByFieldsTypeKeys = computed(() => {
  return (
    filtersStore.clientsDuplicationByFieldsFilterTypes?.items.reduce(
      (acc, item) => {
        if (
          filtersStore.selectedClientsDuplicationByFieldsFilterTypeIds.includes(
            item.id
          )
        ) {
          acc.by_fields.push(item.key as ClientsDuplicationByFieldsType);
        }
        return acc;
      },
      { by_fields: [] as ClientsDuplicationByFieldsType[] }
    ) || { by_fields: [] }
  );
});

const isFilterDisabled = computed(() => {
  switch (props.type) {
    case CLIENT_DUPLICATION_TAB_TYPES.BY_FIELDS:
      return !filtersStore.selectedClientsDuplicationByFieldsFilterTypeIds
        .length;
    case CLIENT_DUPLICATION_TAB_TYPES.BY_LOCATION:
      return !radius.value;
  }
});
<\/script>
`;export{e as default};
