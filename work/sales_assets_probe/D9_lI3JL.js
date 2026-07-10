const e=`<template>
  <div :class="variantClasses.root()">
    <div :class="variantClasses.categoryContainer()">
      <!-- All Select Item - inline with other items -->
      <div
        v-if="isAllSelectShowable"
        :class="variantClasses.allSelectWrapper()"
      >
        <div
          v-if="!loading && categoryItems.length"
          class="flex gap-x-3 items-center"
          @click="handleAllSelectClick"
        >
          <div :class="variantClasses.indicator({ isChecked: isAllSelected })">
            <IconCheckCircle
              size="20"
              class="text-primary-600 justify-self-center shrink-0"
            />
          </div>

          <Checkbox
            id="all-select-items-select-by-checkbox"
            :checked="isAllSelected"
            :title="props.allSelectTitle || t('filters.choose_all')"
            :disabled="disabled"
            :class="variantClasses.item({ isChecked: isAllSelected })"
            @change="onAllSelect"
          />
          <span :class="variantClasses.requiredSymbol()"> *</span>
        </div>
      </div>

      <!-- Loading State -->
      <template v-if="loading">
        <SkeletonRows
          v-for="i in 12"
          :key="i"
          :rows="1"
          height="18px"
          :maxRowWidth="55"
          class="border bg-input rounded-lg w-fit"
        />
      </template>

      <!-- Category Items -->
      <template v-else>
        <div
          v-for="(category, categoryIndex) in categoryItems"
          :key="categoryIndex"
          :class="variantClasses.itemContainer()"
        >
          <div
            v-for="item in category"
            :key="item.id"
            @click="handleItemClick(item, $event)"
            class="relative"
          >
            <div
              :class="
                variantClasses.indicator({ isChecked: isItemChecked(item.id) })
              "
            >
              <IconCheckCircle
                size="20"
                class="text-primary-600 justify-self-center shrink-0 !ml-0"
              />
            </div>

            <Checkbox
              :id="item.id"
              :title="item?.name"
              v-tooltip="item?.tooltip"
              :checked="isItemChecked(item.id)"
              :disabled="item?.disabled || disabled"
              :class="
                variantClasses.item({ isChecked: isItemChecked(item.id) })
              "
              @change="onSelectItems(item.id, $event)"
            >
              <template #suffix>
                <icon-warning
                  v-if="item?.showWarning"
                  v-tooltip="item?.warningTooltip || t('common.warning')"
                />
              </template>
            </Checkbox>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { itemsSelectByCheckboxVariants } from "./variants";

// Types
interface SelectableItem {
  id: string | number;
  name: string;
  disabled?: boolean;
  tooltip?: string;
  showWarning?: boolean;
  warningTooltip?: string;
}

type GapSize = "small" | "large";

interface ItemSelectByCheckboxProps {
  variant?: "default" | "tag";
  items?: SelectableItem[];
  selectedItems?: (string | number)[];
  loading?: boolean;
  disabled?: boolean;
  gapSize?: GapSize;
  allSelectTitle?: string | null;
}

interface ItemSelectByCheckboxEmits {
  (e: "onChangeSelectedItems", selectedItems: (string | number)[]): void;
}

// Extended interface for internal use
interface GroupedItem extends SelectableItem {
  new_row: boolean;
}

// Props definition
const props = withDefaults(defineProps<ItemSelectByCheckboxProps>(), {
  items: () => [],
  selectedItems: () => [],
  loading: false,
  disabled: false,
  gapSize: "small",
  allSelectTitle: null,
});

// Emits definition
const emit = defineEmits<ItemSelectByCheckboxEmits>();

// states
const { t } = useI18n();

const variantClasses = itemsSelectByCheckboxVariants({
  variant: props.variant,
});

// hooks
const isAllSelected = computed(
  (): boolean =>
    props.items?.every((item) => props.selectedItems?.includes(item.id)) ??
    false
);

const categoryItems = computed((): GroupedItem[][] => {
  if (!props.items || !Array.isArray(props.items)) return [];

  const groupedItems = props.items
    .sort((a, b) => a.name.localeCompare(b.name))
    .reduce<GroupedItem[][]>(
      (acc, item, index) => {
        const currentChar = item?.name?.charAt(0).toLowerCase();
        const nextChar = props.items?.[index + 1]?.name
          ?.charAt(0)
          .toLowerCase();

        const newItem: GroupedItem = {
          ...item,
          new_row: currentChar !== nextChar,
        };

        if (newItem.new_row) {
          acc.push([...acc.pop()!, newItem]);
          acc.push([]);
        } else if (newItem) {
          acc[acc.length - 1].push(newItem);
        }

        return acc;
      },
      [[]]
    );

  return groupedItems.filter((group) => group.length > 0);
});

const isAllSelectShowable = computed((): boolean => {
  return !(props.items?.every((item) => item.disabled) ?? false);
});

// Methods
const handleAllSelectClick = (event: MouseEvent): void => {
  if (props.disabled) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  onAllSelect(!isAllSelected.value);
};

const handleItemClick = (item: SelectableItem, event: MouseEvent): void => {
  if (props.variant !== "tag" || item.disabled || props.disabled) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const isCurrentlyChecked = isItemChecked(item.id);

  onSelectItems(item.id, !isCurrentlyChecked);
};

const onSelectItems = (id: string | number, isChecked: boolean): void => {
  const currentSelected = props.selectedItems || [];
  let newSelectedItems: (string | number)[];

  if (isChecked) {
    newSelectedItems = [...currentSelected, id];
  } else {
    newSelectedItems = currentSelected.filter((_id) => _id !== id);
  }

  emit("onChangeSelectedItems", newSelectedItems);
};

const isItemChecked = (itemId: string | number): boolean =>
  props.selectedItems?.includes(itemId) ?? false;

const onAllSelect = (isChecked: boolean): void => {
  const currentSelected = props.selectedItems || [];
  const nonDisabledIds =
    props.items?.filter((item) => !item.disabled).map((item) => item.id) ?? [];

  let newSelectedItems: (string | number)[];
  if (isChecked) {
    newSelectedItems = [...new Set([...currentSelected, ...nonDisabledIds])];
  } else {
    newSelectedItems = currentSelected.filter(
      (id) => !nonDisabledIds.includes(id)
    );
  }

  emit("onChangeSelectedItems", newSelectedItems);
};
<\/script>
`;export{e as default};
