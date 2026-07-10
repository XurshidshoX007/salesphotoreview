const e=`<template></template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useTerritoryTreeState } from "@/composables/useTerritoryTreeState/useTerritoryTreeState";
import { useFilteredTerritories } from "@/composables/useTerritoryTreeState/useFilteredTerritories";

const route = useRoute();

// props
const props = defineProps<{
  isSingleSelect?: boolean;
  filterStorageKey?: string;
  selectedItemIds?: string[];
}>();

// Use a store key that can be overridden per-component via \`filterStorageKey\` prop.
// This prevents multiple instances on the same route (page + modal) sharing state.
const storePath = computed(() =>
  props.filterStorageKey
    ? String(props.filterStorageKey)
    : route.path + "territory-tree-dropdowns",
);
const filtersStore = useFiltersStore(storePath.value);

// emits
const emit = defineEmits(["onSelect", "passTerritoryFilterStates"]);

// states
const { t } = useI18n();
const isFetched = ref(false);

const {
  territories,
  territoriesByStep,
  selectedItemIdsByStep,
  levels,
  getTerritories,
  getChildItemIds,
  setSelectedItemIdsByStep,
} = useTerritoryTreeState(filtersStore);

const names = computed(() => {
  return levels.value
    .sort((a, b) => a.level - b.level)
    .map((level) => level.name);
});

const { filteredItemsByStep } = useFilteredTerritories(
  territoriesByStep,
  selectedItemIdsByStep,
);

// hooks
const savedFilterStatesByKey = computed(
  (): Record<string, { name: string; checked: boolean }> => {
    if (!props.filterStorageKey) return {};
    return getCheckedItemsByKey(props.filterStorageKey) || {};
  },
);

const dropdownsByStep = computed(() => {
  // Include filterStorageKey in the key prefix to ensure uniqueness across instances
  const keyPrefix = props.filterStorageKey ? \`\${props.filterStorageKey}-\` : "";
  return Object.keys(filteredItemsByStep.value).map((step) => {
    return {
      name:
        names.value[+step] || t("settings_sidebar.territory") + \` \${+step + 1}\`,
      key: \`\${keyPrefix}step-\${step}\`,
      isSingleSelect: props.isSingleSelect,
      get data() {
        return { items: filteredItemsByStep.value[+step] };
      },
      get getSelectedData() {
        return selectedItemIdsByStep[+step] || [];
      },
      set setSelectedData(value: string[]) {
        onSelectItemId(+step, value);
      },
      checked: isChecked(\`\${keyPrefix}step-\${step}\`),
    };
  });
});

onMounted(async () => {
  if (!filtersStore.territories?.items?.length) {
    await getTerritories();
    if (props.selectedItemIds?.length) {
      setSelectedItemIdsByStep(props.selectedItemIds);
    }
  } else {
    territories.value = filtersStore.territories?.items;
  }
  isFetched.value = true;
  passDropdowns();
});

// methods
function isChecked(key: string): boolean {
  if (savedFilterStatesByKey.value[key]?.checked === undefined) return true;
  return savedFilterStatesByKey.value[key]?.checked;
}

const onSelectItemId = (step: number, ids: string[]) => {
  // Filter out selected ids that are not in the current step
  ids = ids?.filter((id) =>
    territoriesByStep.value[step].map((t) => t.id).includes(id),
  );

  selectedItemIdsByStep[step] = ids;

  const stepsLength = dropdownsByStep.value.length;

  // Clear selected items for all steps after the current step
  for (let i = step + 1; i < stepsLength - 1; i++) {
    selectedItemIdsByStep[i] = [];
    filteredItemsByStep.value[i].forEach((item) => {
      item.selected = false;
    });
  }

  // Find the last valid step where selected items exist in the filtered results
  let lastStepIds: string[] = [];
  for (let _step = stepsLength - 1; _step >= 0; _step--) {
    const currentStepSelectedIds = selectedItemIdsByStep[_step] || [];
    if (currentStepSelectedIds.length > 0) {
      const filteredIds = new Set(
        filteredItemsByStep.value[_step]?.map((item) => item.id),
      );

      lastStepIds = currentStepSelectedIds.filter((id) => filteredIds.has(id));

      if (lastStepIds.length > 0) {
        break;
      }
    }
  }

  // Collect child item ids for all valid last step items
  const childItemIdsSet = new Set<string>();
  lastStepIds.forEach((id) => {
    getChildItemIds(id).forEach((childId) => childItemIdsSet.add(childId));
  });

  filtersStore.selectedTerritoryIdsByStep = selectedItemIdsByStep;

  emit("onSelect", Array.from(childItemIdsSet));
};

const passDropdowns = () => {
  emit("passTerritoryFilterStates", dropdownsByStep.value);
};

const clearSelectedItems = () => {
  Object.keys(selectedItemIdsByStep).forEach((key) => {
    delete selectedItemIdsByStep[key];
  });
};

const waitForFetch = async () => {
  if (isFetched.value) return true;

  return new Promise<boolean>((resolve) => {
    const unwatch = watch(isFetched, (newValue) => {
      if (newValue) {
        unwatch();
        resolve(true);
      }
    });
  });
};

defineExpose({
  clearSelectedItems,
  waitForFetch,
});
<\/script>
`;export{e as default};
