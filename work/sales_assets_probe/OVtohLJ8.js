const e=`<template>
  <div :class="dropdownClasses">
    <div
      v-if="!dropdownView && showBtns"
      class="-translate-x-5.5 flex items-center gap-1"
    >
      <rounded-icon-btn
        v-if="!movingItem"
        icon="plus"
        tooltip="Добавить"
        size="2xsm"
        id="add-item"
        type="outlined"
        @click="onAddItem(undefined)"
      />
      <div v-else class="flex items-center gap-1">
        <rounded-icon-btn
          icon-file-name="Insert"
          tooltip="Вставить"
          id="paste-item"
          size="2xsm"
          @click="onPasteItem(undefined)"
        />
        <rounded-icon-btn
          icon-file-name="x-delete"
          tooltip="Отменить"
          id="paste-item"
          size="2xsm"
          type="danger"
          @click="onMoveItem(null)"
        />
      </div>
    </div>
    <div v-if="props.loading">
      <div class="flex justify-center py-5">
        <IconLoading :loading="true" :width="11" :height="11" />
      </div>
    </div>
    <TreeItem
      v-for="item in itemsWithParentIds"
      :key="item.id"
      :item="item"
      :movingItem="movingItem"
      :showBtns="showBtns"
      :checked-items="checkedItems"
      :dropdown-view="dropdownView"
      :disabled="disabled"
      :single-select="singleSelect"
      :single-selected-item-id="singleSelectedItem"
      :opened="includesSingleSelectedItem(item.children)"
      :includes-single-selected-item="includesSingleSelectedItem"
      @add="onAddItem"
      @edit="onEditItem"
      @delete="onDeleteItem"
      @move="onMoveItem"
      @paste="onPasteItem"
      @check="onCheckItem"
      @onSingleSelect="handleSingleSelect"
    />
  </div>
</template>

<script setup lang="ts">
import type { TerritoryModel } from "~/interfaces/api/settings/territory-model";
// props
const props = defineProps<{
  loading?: boolean;
  items: TerritoryModel[];
  showBtns?: boolean;
  dropdownView?: boolean;
  selectedItems?: string[] | string;
  singleSelect?: boolean;
  disabled?: boolean;
}>();

// emits
const emit = defineEmits([
  "add",
  "edit",
  "delete",
  "paste",
  "onSelectItems",
  "onSingleSelect",
]);

// states
const movingItem = ref<TerritoryModel | null>(null);
const checkedItems = ref<string[]>(
  Array.isArray(props.selectedItems) ? props.selectedItems : []
);

// hookss
const dropdownClasses = computed(() => ({
  "ml-3": !props.dropdownView,
  "flex flex-col gap-1 px-1 py-3": props.dropdownView && !props.singleSelect,
  "p-4": props.dropdownView && props.singleSelect,
}));

const singleSelectedItem = computed(() => {
  if (Array.isArray(props.selectedItems)) return undefined;
  return props.selectedItems;
});

const itemsWithParentIds = computed((): TerritoryModel[] => {
  if (!props.items) return [];
  const updatedItems = props.items.map((item) => ({
    ...item,
    children: childsWithParentIds(item.children, item.id),
  }));
  return updatedItems;
});

const includesSingleSelectedItem = (items: TerritoryModel[]): boolean => {
  if (!props.singleSelect || Array.isArray(props.selectedItems)) return false;
  const getAllItemsIds = (items: TerritoryModel[]): string[] => {
    return items.reduce((acc, item) => {
      acc.push(item.id);
      if (item.children.length) {
        acc.push(...getAllItemsIds(item.children));
      }
      return acc;
    }, [] as string[]);
  };
  const itemsIds = getAllItemsIds(items);
  return itemsIds.includes(props.selectedItems!);
};

// methods
const childsWithParentIds = (
  children: TerritoryModel[],
  parentId: string
): TerritoryModel[] => {
  return children.map((item) => {
    const updatedItem = { ...item, parent_id: parentId };
    if (updatedItem.children.length) {
      updatedItem.children = childsWithParentIds(
        updatedItem.children,
        updatedItem.id
      );
    }
    return updatedItem;
  });
};

const onAddItem = (id: string | undefined) => {
  emit("add", id);
};

const onEditItem = (id: string) => {
  emit("edit", id);
};

const onDeleteItem = (id: string) => {
  emit("delete", id);
};

const onMoveItem = (item: TerritoryModel | null) => {
  movingItem.value = item;
};

const onPasteItem = (newParentId: string | undefined) => {
  emit("paste", movingItem.value, newParentId);
  movingItem.value = null;
};

const onCheckItem = (ids: string[], isChecked: boolean) => {
  if (isChecked) {
    checkedItems.value = [...new Set([...checkedItems.value, ...ids])];
  } else {
    checkedItems.value = checkedItems.value.filter((id) => !ids.includes(id));
  }
  emit("onSelectItems", checkedItems.value);
};

const handleSingleSelect = (id: string) => {
  emit("onSingleSelect", id);
};
<\/script>
`;export{e as default};
