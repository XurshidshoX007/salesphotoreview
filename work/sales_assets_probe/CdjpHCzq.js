const e=`<template>
  <card
    v-if="activeRoleId"
    size="none"
    :classes="{
      root: 'flex flex-col h-full overflow-hidden',
      header: 'p-5 m-0',
      content:
        'overflow-auto scrollbar-default flex-1 min-h-0 border-y border-neutral-200',
      footer: 'p-5 m-0 justify-end',
    }"
  >
    <template #header>
      <access-attach-toolbar
        show-stats
        :is-all-expanded="isAllExpanded"
        :checked="tree.globalCheckState.value.checked"
        :indeterminate="tree.globalCheckState.value.indeterminate"
        :initial-count="initialCheckedIds.length"
        :added-count="addedCount"
        :removed-count="removedCount"
        @toggle-all="toggleAllSections()"
        @change="tree.toggleAll($event)"
        @search="searchValue = $event"
      />
    </template>

    <access-attach-content
      :data="normalizedData"
      :filtered-data="filteredData"
      :is-loading="store.isOperationsLoading"
      :tree="tree"
      :open-items="openItems"
      @update:open-items="openItems = $event"
    />

    <template #footer>
      <m-btn :loading="store.isSaveLoading" @click="onSave">
        {{ t("save") }}
      </m-btn>
    </template>
  </card>

  <div v-else class="h-full grid place-items-center">
    <no-infarmation :title="t('access.no_information_found')" />
  </div>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useTreeSelection } from "~/composables/useTreeSelection";
import type { RoleDefaultsOperationsModel } from "~/interfaces/api/access/role-defaults-model";
import type { MenuTreeItemType } from "~/interfaces/ui/SideMenuTypes";

// Props
const props = defineProps<{
  activeRoleId?: number;
}>();

// Store
const store = useAccessRoleDefaultsStore();

// Composables
const { t } = useI18n();

// State
const checkedItemIds = ref<string[]>([]);
const initialCheckedIds = ref<string[]>([]);
const searchValue = ref("");
const openItems = ref<Record<string, boolean>>({});

// Computed
const normalizedData = computed<MenuTreeItemType[]>(() => {
  const transformItem = (
    item: RoleDefaultsOperationsModel,
  ): MenuTreeItemType => {
    const transformedChildren = item.children.map(transformItem);

    return {
      id: \`group-\${item.id}\`,
      name: item.name,
      children: [
        ...(transformedChildren.length ? [transformedChildren] : []),
        item.operation_list.map((operation) => ({
          id: operation.id.toString(),
          name: operation.name,
        })),
      ],
    };
  };

  return store.operationsList.map<MenuTreeItemType>((item) => ({
    id: \`group-\${item.id}\`,
    name: item.name,
    children: [
      [
        ...item.children.map(transformItem),
        ...item.operation_list.map((operation) => ({
          id: operation.id.toString(),
          name: operation.name,
        })),
      ],
    ],
  }));
});

const filteredData = computed(() => {
  let result = normalizedData.value;

  if (searchValue.value) {
    const term = searchValue.value.toLowerCase();
    result = filterTree(result, (item) =>
      item.name.toLowerCase().includes(term),
    );
  }

  return result;
});

const isAllExpanded = computed(() => {
  if (!filteredData.value.length) return false;
  const expandableIds = getAllExpandableIds(filteredData.value);
  return (
    expandableIds.length > 0 && expandableIds.every((id) => openItems.value[id])
  );
});

const initialSet = computed(() => new Set(initialCheckedIds.value));

const addedCount = computed(
  () => checkedItemIds.value.filter((id) => !initialSet.value.has(id)).length,
);

const removedCount = computed(
  () =>
    initialCheckedIds.value.filter(
      (id) => !new Set(checkedItemIds.value).has(id),
    ).length,
);

// Composables
const tree = useTreeSelection<MenuTreeItemType>({
  data: filteredData,
  checkedItemIds,
  updateCheckedItemIds: (ids) => {
    checkedItemIds.value = ids;
  },
});

// Hooks
watch(
  () => store.operationsList,
  (list) => {
    const collectCheckedIds = (
      items: RoleDefaultsOperationsModel[],
    ): string[] =>
      items.flatMap((item) => [
        ...item.operation_list
          .filter((op) => op.is_checked)
          .map((op) => op.id.toString()),
        ...collectCheckedIds(item.children),
      ]);

    const ids = collectCheckedIds(list);
    checkedItemIds.value = ids;
    initialCheckedIds.value = [...ids];
  },
);

// Methods
const toggleAllSections = () => {
  const shouldExpand = !isAllExpanded.value;
  if (shouldExpand) {
    const expandableIds = getAllExpandableIds(filteredData.value);
    openItems.value = Object.fromEntries(expandableIds.map((id) => [id, true]));
  } else {
    openItems.value = {};
  }
};

const filterTree = (
  items: MenuTreeItemType[],
  predicate: (item: MenuTreeItemType) => boolean,
): MenuTreeItemType[] => {
  return items
    .map((item) => {
      const filteredChildren = item.children?.map((childGroup) =>
        filterTree(childGroup, predicate),
      );
      const hasMatchingChildren = filteredChildren?.some(
        (group) => group.length > 0,
      );
      const selfMatches = predicate(item);
      if (!selfMatches && !hasMatchingChildren) return null;
      return { ...item, children: filteredChildren };
    })
    .filter(Boolean) as MenuTreeItemType[];
};

const getAllExpandableIds = (items: MenuTreeItemType[]): string[] => {
  const ids: string[] = [];
  const collect = (list: MenuTreeItemType[]) => {
    for (const item of list) {
      if (item.children?.length) {
        ids.push(String(item.id));
        for (const group of item.children) collect(group);
      }
    }
  };
  collect(items);
  return ids;
};

const onSave = async () => {
  if (!props.activeRoleId) return;

  const res = await store.saveDefaults([
    {
      role: props.activeRoleId,
      access_operation_ids: checkedItemIds.value.map(Number),
    },
  ]);

  if (res !== "error") {
    notify({ title: t("toast.success"), type: "success" });
    await store.getRoles();
  } else {
    notify({ title: t("toast.error"), type: "error" });
  }
};
<\/script>
`;export{e as default};
