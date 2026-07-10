const e=`<template>
  <div
    :class="[
      'tree-item',
      {
        'dropdown-view': isMultiSelect,
        'single-select-view': isSingleSelect,
      },
    ]"
  >
    <div
      class="tree-item-label"
      :style="itemLevelIndentationOnSingleSelect"
      :class="{
        'before-w-4': itemHasChildren,
        'before-w-6': !itemHasChildren,
        'hover-bg-[#299B9B0D] hover-text-[#299B9B]': isItemSelectable,
        'bg-[#299B9B] text-white': isItemSelected,
      }"
      @click="onSingleSelectItem(item.id)"
    >
      <span v-if="itemHasChildren" class="icon" @click.stop="toggle">
        <span class="transition-all" :class="{ 'rotate-90': isOpen }"
          ><fa-icon hash="&#xf105;" class="text-xl"
        /></span>
      </span>
      <Checkbox
        v-if="isMultiSelect"
        :disabled="!item.is_active || props.disabled"
        :check-from-label="false"
        :checked="isItemChecked(item)"
        :indeterminate="isItemIndeterminate(item)"
        :title="item.name"
        :class="{ 'ml-7': !itemHasChildren }"
        @change="onCheckItem(item, $event)"
      />
      <div
        v-else
        class="tree-item-name mr-2 hover:text-primary-600"
        :class="{
          'opacity-50': !item.is_active,
          'ml-5': !itemHasChildren && !dropdownView,
        }"
        @click.passive="toggle"
      >
        {{ item.name }}
      </div>
      <div v-if="showBtns" class="item-btns">
        <div v-if="!movingItem" class="flex items-center gap-1">
          <rounded-icon-btn
            v-if="item.is_active"
            icon-file-name="Plus"
            tooltip="Добавить"
            id="add-item"
            type="outlined"
            size="2xsm"
            @click="addItem(item.id)"
          />
          <rounded-icon-btn
            type="edit"
            tooltip="Изменить"
            id="edit-item"
            icon-size="18"
            size="2xsm"
            @click="editItem(item.id)"
          />
          <rounded-icon-btn
            icon-file-name="Move"
            tooltip="Переместить"
            id="move-item"
            size="2xsm"
            @click="moveItem(item)"
          />
        </div>
        <div v-else class="flex items-center gap-1">
          <rounded-icon-btn
            icon-file-name="Insert"
            tooltip="Вставить"
            id="paste-item"
            size="2xsm"
            @click="pasteItem(item.id)"
          />
          <rounded-icon-btn
            icon-file-name="x-delete"
            tooltip="Отменить"
            id="cancel-moving-item"
            type="danger"
            size="2xsm"
            @click="cancelMovingItem"
          />
        </div>
      </div>
    </div>

    <transition-expand
      v-if="itemHasChildren"
      :is-open="isOpen"
      class="tree-item-children"
    >
      <TreeItem
        v-for="child in item.children"
        :key="child.id"
        :item="child"
        :show-btns="showBtns"
        :dropdown-view="dropdownView"
        :disabled="props.disabled"
        :moving-item="movingItem"
        :checked-items="checkedItems"
        :single-select="singleSelect"
        :single-selected-item-id="singleSelectedItemId"
        :level="level + 1"
        :opened="props.includesSingleSelectedItem(child.children)"
        :includes-single-selected-item="props.includesSingleSelectedItem"
        @add="addItem"
        @edit="editItem"
        @delete="deleteItem"
        @move="moveItem"
        @paste="pasteItem"
        @check="onCheck"
        @onSingleSelect="onSingleSelect"
      />
    </transition-expand>
  </div>
</template>

<script setup lang="ts">
import type { TerritoryModel } from "~/interfaces/api/settings/territory-model";
import { variableData } from "~/variable/variable";

// props
const props = defineProps<{
  item: TerritoryModel;
  movingItem: TerritoryModel | null;
  checkedItems: string[];
  showBtns?: boolean;
  dropdownView?: boolean;
  singleSelect?: boolean;
  singleSelectedItemId?: string;
  level?: number;
  opened?: boolean;
  disabled?: boolean;
  includesSingleSelectedItem: (items: TerritoryModel[]) => boolean;
}>();

// emits
const emit = defineEmits([
  "add",
  "edit",
  "delete",
  "move",
  "paste",
  "check",
  "onSingleSelect",
]);

// states
const isOpen = ref<boolean>(props.opened || false);
const { isActive } = variableData;
const level = props.level || 0;

// hooks
const itemHasChildren = computed(() => {
  return !!props.item.children.length;
});

const isMultiSelect = computed(() => {
  return props.dropdownView && !props.singleSelect;
});

const isSingleSelect = computed(() => {
  return props.dropdownView && props.singleSelect;
});

const isItemSelectable = computed(() => {
  if (isSingleSelect.value) {
    return !itemHasChildren.value;
  }
});

const isItemSelected = computed(() => {
  if (isSingleSelect.value) {
    return props.singleSelectedItemId === props.item.id;
  }
});

const itemLevelIndentationOnSingleSelect = computed(() => {
  if (isSingleSelect.value) {
    return {
      "--level-indent": \`\${level * 20}px\`,
    };
  }
});

watchEffect(() => {
  if (props.opened) {
    isOpen.value = props.opened;
  }
});

// methods
const toggle = () => {
  isOpen.value = !isOpen.value;
};

const addItem = (id: string) => {
  emit("add", id);
};

const editItem = (id: string) => {
  emit("edit", id);
};

const deleteItem = (id: string) => {
  emit("delete", id);
};

const moveItem = (item: TerritoryModel) => {
  emit("move", item);
};

const pasteItem = (id: string) => {
  emit("paste", id);
};

const cancelMovingItem = () => {
  emit("move", null);
};

const onCheck = (ids: string[], checked: boolean) => {
  emit("check", ids, checked);
};

const onSingleSelectItem = (id: string) => {
  if (isItemSelectable.value) {
    onSingleSelect(id);
    isActive.value = false;
  }
};

const onSingleSelect = (id: string) => {
  emit("onSingleSelect", id);
};

const isItemChecked = (item: TerritoryModel): boolean => {
  if (item.children.length) {
    return item.children.every((child) => isItemChecked(child));
  } else {
    return props.checkedItems.includes(item.id);
  }
};

const hasAnyCheckedItem = (item: TerritoryModel): boolean => {
  if (item.children.length) {
    return item.children.some((child) => hasAnyCheckedItem(child));
  } else {
    return props.checkedItems.includes(item.id);
  }
};

const isItemIndeterminate = (item: TerritoryModel): boolean => {
  if (item.children.length) {
    const hasCheckedChild = item.children.some((child) =>
      hasAnyCheckedItem(child),
    );
    const hasUncheckedOrIndeterminateChild = item.children.some(
      (child) => !isItemChecked(child) || isItemIndeterminate(child),
    );
    return hasCheckedChild && hasUncheckedOrIndeterminateChild;
  }
  return false;
};

const onCheckItem = (item: TerritoryModel, checked: boolean) => {
  let idsToCheck = getAllChildIds(item);
  if (!checked) idsToCheck = [...idsToCheck, ...getAllParentIds(item)]; // to uncheck all parents of the unchecking item
  emit("check", idsToCheck, checked);
};

const getAllChildIds = (item: TerritoryModel): string[] => {
  let ids = [item.id];
  if (item.children.length) {
    item.children.forEach((child) => {
      ids = ids.concat(getAllChildIds(child));
    });
  }
  return ids;
};

const getAllParentIds = (item: TerritoryModel): string[] => {
  let ids: string[] = [];
  if (item.parent_id) ids = [item.parent_id];
  if (item.children.length) {
    item.children.forEach((child) => {
      ids = ids.concat(getAllParentIds(child));
    });
  }
  return ids;
};
<\/script>

<style scoped>
.tree-item {
  position: relative;
  padding-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tree-item:last-child {
  padding-bottom: 0;
}

.tree-item-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  padding-left: var(--level-indent, 0px) !important;
}

.tree-item-label .icon {
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 5px;
}

.tree-item-children {
  position: relative;
  padding-left: 28px;
  margin-left: 5px;
}

.tree-item-children::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 10px;
  border-left: 1px solid #ccc;
}

.tree-item-children:first-child:before {
  height: 0px;
}

.tree-item-children:last-child:before {
  height: 12px;
}

.tree-item::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: -10px;
  border-left: 1px solid #ccc;
}

.tree-item:last-child:before {
  height: 12px;
}

.tree-item-label::before {
  content: "";
  position: absolute;
  top: 12px;
  left: -10px;
  border-top: 1px solid #ccc;
}

.item-btns {
  visibility: hidden;
}

.tree-item-label:hover .item-btns {
  visibility: visible;
}

/* MultiSelect view */
.tree-item.dropdown-view .tree-item-children::before,
.tree-item.dropdown-view::before,
.tree-item.dropdown-view .tree-item-label::before {
  content: none;
}

.dropdown-view .tree-item-children {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 0;
}

.dropdown-view .icon {
  margin-left: 0;
  margin-right: 8px;
}

.tree-item.dropdown-view {
  gap: 0;
  padding: 0;
}

.dropdown-view .tree-item-label {
  padding: 8px 0;
}

/* Single-select view */
.tree-item.single-select-view .tree-item-children::before,
.tree-item.single-select-view::before,
.tree-item.single-select-view .tree-item-label::before {
  content: none;
}

.tree-item.single-select-view {
  gap: 0;
  padding-bottom: 0;
}

.single-select-view {
  border-bottom: 1px solid #299b9b;
}

.single-select-view:last-child {
  border-bottom: 0;
}

.single-select-view .tree-item-children {
  margin-left: 0;
  padding-left: 0;
}

.single-select-view .tree-item-children .icon {
  margin-left: 0px;
}

.tree-item-children .single-select-view {
  border-color: #ccc;
}

.single-select-view > .tree-item-label {
  padding: 8px 0 8px 10px;
}

.single-select-view .tree-item-children:first-child {
  border-top: 1px solid #ccc;
}
</style>
`;export{e as default};
