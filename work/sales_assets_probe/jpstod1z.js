const e=`<template>
  <div class="access-attach-dialog-modal">
    <d-modal
      with-out-header
      data-container-width="896px"
      @close-dialog="closeDialog"
    >
      <template #header>
        <div
          class="flex items-center gap-2 rounded-t-xl text-neutral-400 p-5 bg-red-lotion border-b -mt-3 -mx-2"
        >
          <slot name="title" />

          <icon-x
            class="ml-auto cursor-pointer shrink-0 [&>path]:stroke-neutral-600"
            @click="closeDialog"
          />
        </div>

        <div class="px-5 py-3 -mx-2">
          <access-attach-toolbar
            :is-all-expanded="isAllExpanded"
            :checked="tree.globalCheckState.value.checked"
            :indeterminate="tree.globalCheckState.value.indeterminate"
            @toggle-all="toggleAllSections()"
            @change="tree.toggleAll($event)"
            @search="searchValue = $event"
          />
        </div>
      </template>
      <access-attach-content
        :data="props.data"
        :filtered-data="filteredData"
        :is-loading="isLoading"
        :tree="tree"
        :open-items="openItems"
        @update:open-items="openItems = $event"
      />

      <template #footer v-if="slots.footer">
        <slot name="footer" />
      </template>
    </d-modal>
  </div>
</template>

<script setup lang="ts">
import type { Slot } from "vue";
import type { MenuTreeItemType } from "~/interfaces/ui/SideMenuTypes";
import { useTreeSelection } from "~/composables/useTreeSelection";

// Type
type Props = {
  data: MenuTreeItemType[];
  checkedItemIds: string[];
  isLoading?: boolean;
  showOnlyChecked?: boolean;
  autoIncludeMap?: Record<number, number>;
  updateCheckedItemIds: (ids: string[]) => void;
};

type AttachDialogSlots = {
  title?: Slot;
  footer?: Slot;
};

// Props
const props = defineProps<Props>();

// Emits
const emit = defineEmits(["closeDialog"]);

// Slots
defineSlots<AttachDialogSlots>();
const slots = useSlots() as AttachDialogSlots;

// State
const searchValue = ref("");
const openItems = ref<Record<string, boolean>>({});

// Computed
const filteredData = computed(() => {
  let result = props.data;

  if (props.showOnlyChecked) {
    const checked = new Set(props.checkedItemIds);
    result = filterTree(result, (item) => checked.has(String(item.id)));
  }

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

// Composables
const tree = useTreeSelection<MenuTreeItemType>({
  data: filteredData,
  checkedItemIds: computed(() => props.checkedItemIds),
  autoIncludeMap: computed(() => props.autoIncludeMap),
  updateCheckedItemIds: (ids) => props.updateCheckedItemIds(ids),
});

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

const closeDialog = () => emit("closeDialog");
<\/script>

<style lang="scss">
.access-attach-dialog-modal .modal-body-content {
  max-height: calc(100vh - 260px) !important;
  padding: 0 !important;
  margin: 0 -8px;
  @apply border-t border-neutral-200;
}
</style>
`;export{e as default};
