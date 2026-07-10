const e=`<template>
  <div class="relative min-h-10 w-full">
    <div class="loading-content">
      <IconLoading
        :loading="!data?.items"
        :width="6"
        :height="6"
        class="my-1"
      />
    </div>
    <flex-col
      class="max-h-70 overflow-x-hidden scroll-container"
      :class="{
        'overflow-y-scroll': data?.items && data.items.length > 9,
        'py-2 pl-2 pr-1': !singleSelect,
      }"
      ref="scrollContainer"
      @scroll="onScroll"
    >
      <div v-if="data?.items?.length === 0">
        <no-data size="small" />
      </div>
      <flex-col v-else class="w-100">
        <flex-row
          v-if="!singleSelect && localItems?.length && !maxSelectionLimit"
          class="items-center"
        >
          <Checkbox
            :checked="isAllSelected"
            :id="'all-select' + localItems[0]?.id + stateKey"
            :title="t('filters.choose_all')"
            :disabled="isDisabledAllItem"
            :indeterminate="isAllIndeterminate"
            class="checkbox-select-item"
            @change="onAllSelect"
          />
        </flex-row>
        <flex-row
          v-for="(cargo, cargoIdx) in localItems"
          :key="cargo?.id || cargo"
          :class="singleSelect && 'border-b-1 last:border-b-0'"
        >
          <flex-row v-if="!singleSelect" class="items-center w-full">
            <Checkbox
              :checked="cargo.selected"
              :id="cargo?.id + cargoIdx + stateKey"
              :title="
                cargo?.name || cargo?.full_name || nameComputable('fio', cargo)
              "
              :is-in-active-item="cargo?.is_active === false"
              :disabled="isDisabledItem(cargo)"
              class="checkbox-select-item"
              @change="onSelectItem($event, cargo)"
            />
          </flex-row>
          <div
            v-else
            class="w-full flex flex-col hover:bg-neutral-50 active:bg-[#299B9B0F] p-2.5 cursor-pointer text-sm"
            :class="[
              selectedItems === cargo?.id && 'bg-[#299B9B0D] text-primary-600',
              isDisabledItem(cargo) &&
                'hover:cursor-auto hover:bg-transparent hover:text-[#424F4F]',
            ]"
            :title="disabledItemTitle(cargo)"
            @click="onSingleItemSelect(cargo)"
          >
            <div
              v-if="cargo?.name || cargo?.full_name"
              class="flex items-center justify-between flex-wrap select-none"
              :class="isDisabledItem(cargo) && 'opacity-55'"
            >
              <div
                :class="{
                  'text-red-3': !cargo?.selected && cargo?.is_active === false,
                  'text-gray-3': cargo?.selected || cargo?.is_active !== false,
                }"
              >
                {{ cargo?.name || cargo?.full_name }}
              </div>
              <div :class="{ 'text-red-3': isDebtOrders }">
                <span v-show="isDebtOrders">-</span>{{ cargo?.secondaryName }}
              </div>
            </div>
            <div v-else @click="onSingleItemSelect(cargo)">
              {{ nameComputable("fio", cargo) }}
            </div>
          </div>
        </flex-row>
        <div v-if="loadingNextItems" class="flex justify-center items-center">
          <IconLoading :loading="true" :width="6" :height="6" />
        </div>
      </flex-col>
    </flex-col>
  </div>
</template>

<script setup>
import { variableData } from "~/variable/variable";
import { useI18n } from "vue-i18n";

// Props
const props = defineProps({
  singleSelect: {
    type: Boolean,
    default: false,
  },
  data: Object,
  selectedItems: {
    type: [Array, String, Number],
  },
  maxSelectionLimit: [Number, Boolean],
  stateKey: String,
  isItemsDisabled: Function,
});

const emit = defineEmits(["onLoadElse", "onSelectItems", "onSingleItemSelect"]);

// State
const { t } = useI18n();
const { isActive } = variableData;
const loadingNextItems = ref(false);

const localItems = computed(() => {
  if (!props.data?.items) return [];
  if (props.singleSelect) return props.data?.items || [];
  return props.data.items.map((item) => ({
    ...item,
    selected: props.selectedItems?.includes(item.id) || false,
  }));
});

// hooks
const isAllSelected = computed(() => {
  const { isItemsDisabled } = props;
  if (isDisabledAllItem.value) return false;
  if (!localItems.value?.length) return false;

  const itemsToCheck = isItemsDisabled
    ? localItems.value.filter((item) => !isItemsDisabled(item))
    : localItems.value;

  return itemsToCheck.every((item) => item?.selected);
});

const isAllIndeterminate = computed(() => {
  const { isItemsDisabled } = props;
  if (isAllSelected.value) return false;

  const itemsToCheck = isItemsDisabled
    ? localItems.value.filter((item) => !isItemsDisabled(item))
    : localItems.value;

  return itemsToCheck.some((item) => item?.selected);
});

const isDebtOrders = computed(
  () => props.stateKey === "debt-orders" /* used for order-debts dropdown */,
);

watch(
  () => props.data?.items?.length,
  () => {
    if (loadingNextItems.value) {
      loadingNextItems.value = false;
    }
  },
);

watchEffect(() => {
  if (props.maxSelectionLimit) {
    if (props.selectedItems?.length > props.maxSelectionLimit) {
      props.selectedItems.length = 3;
      const selectedItems = props.selectedItems;
      localItems.value.forEach((item) => {
        if (!selectedItems.includes(item?.id)) {
          item.selected = false;
        }
      });
      emit("onSelectItems", selectedItems);
    }
  }
});

// Methods
const onAllSelect = (isChecked) => {
  const { isItemsDisabled, selectedItems } = props;

  const items = isItemsDisabled
    ? localItems.value.filter((item) => !isItemsDisabled(item))
    : localItems.value;

  const currentAllItemIds = items.map((item) => item.id);

  items.forEach((item) => {
    item.selected = isChecked;
  });

  const newSelectedItems = isChecked
    ? [...new Set([...selectedItems, ...currentAllItemIds])] // Merge and remove duplicates if selected
    : selectedItems.filter((id) => !currentAllItemIds.includes(id)); // Remove the selected IDs from the list if unchecked

  emit("onSelectItems", newSelectedItems);
};

const onSelectItem = (isSelected, item) => {
  if (isSelected) {
    emit("onSelectItems", [...props.selectedItems, item.id]);
  } else {
    emit(
      "onSelectItems",
      props.selectedItems?.filter((id) => id !== item.id),
    );
    const localItem = localItems.value.find((i) => i.id === item.id);
    if (localItem) {
      localItem.selected = false;
    }
  }
};

const onSingleItemSelect = (item) => {
  if (isDisabledItem(item)) return;
  emit("onSingleItemSelect", item.id);
  isActive.value = false;
};

const nameComputable = (type, data) => {
  switch (type) {
    case "fio": {
      return \`\${data?.last_name ?? "-"} \${data?.first_name ?? "-"} \${
        data?.middle_name ?? "-"
      }\`;
    }
    default: {
      return "Not found";
    }
  }
};

const onClearFilter = () => {
  localItems.value.forEach((item) => {
    item.selected = false;
  });
};

const isDisabledAllItem = computed(() => {
  return localItems.value?.every((item) => isDisabledItem(item));
});

const isDisabledItem = (item) => {
  return props?.isItemsDisabled && props?.isItemsDisabled(item);
};

const disabledItemTitle = (item) => {
  if (props?.isItemsDisabled && props?.isItemsDisabled(item)) {
    if (typeof props?.isItemsDisabled(item) === "string") {
      return props?.isItemsDisabled(item);
    }
  }
  return null;
};

defineExpose({
  onClearFilter,
});

const onScroll = (e) => {
  // to load items, when user scrolled to the end
  const { target } = e;
  const isAtBottom =
    Math.ceil(target.scrollTop) >=
    target.scrollHeight - target.offsetHeight - 5;

  if (isAtBottom && props.data?.has_next_page && !loadingNextItems.value) {
    loadingNextItems.value = true;
    emit("onLoadElse");
  }
};
<\/script>

<style scoped>
.loading-content {
  position: absolute;
  top: 5px;
  left: 47%;
}

.scroll-container::-webkit-scrollbar {
  width: 12px;
}

.scroll-container::-webkit-scrollbar-track {
  background: theme("colors.neutral.0");
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
}

.scroll-container::-webkit-scrollbar-thumb {
  border-radius: 10px;
  min-height: 18px;
  border: 3px solid transparent;
  background-clip: padding-box;
}
</style>
`;export{e as default};
