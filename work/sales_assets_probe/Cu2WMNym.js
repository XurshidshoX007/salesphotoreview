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
        <no-data />
      </div>
      <flex-col v-else>
        <flex-row
          v-if="data?.items?.length && !maxSelectionLimit"
          class="items-center"
        >
          <Checkbox
            :checked="isAllSelected"
            :id="'all-select' + data?.items[0]?.id + stateKey"
            :title="t('filters.choose_all')"
            class="checkbox-select-item"
            :disabled="isDisabledAllItem"
            @change="onAllSelect"
          />
        </flex-row>
        <flex-row
          v-for="(cargo, cargoIdx) in data?.items"
          :key="cargo?.id || cargo"
          class="w-full"
        >
          <div class="flex items-center gap-2 justify-between w-full relative">
            <Checkbox
              :checked="cargo.selected"
              :id="cargo?.id + cargoIdx + stateKey"
              :title="cargo?.name || cargo?.full_name"
              :is-in-active-item="cargo?.is_active === false"
              :disabled="isDisabledItem(cargo)"
              class="checkbox-select-item"
              @change="onSelectItem($event, cargo)"
            />

            <div
              v-tooltip="{
                text: t('invoices.number_of_applications'),
                disabled: isDisabledItem(cargo),
                placement: 'top-end',
              }"
              class="circle"
              :class="isDisabledItem(cargo) && 'opacity-50'"
            >
              {{ cargo?.available_orders_to_shipment_invoice_count }}
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
  data: Object,
  selectedItems: {
    type: [Array, String, Number],
  },
  maxSelectionLimit: [Number, Boolean],
  stateKey: String,
  isItemsDisabled: Function,
});

const emit = defineEmits(["onLoadElse", "onSelectItems"]);

// State
const { t } = useI18n();
const { isActive } = variableData;
const loadingNextItems = ref(false);

// hooks
const isAllSelected = computed(() => {
  const { isItemsDisabled, data } = props;
  if (isDisabledAllItem.value) return false;
  if (!data?.items?.length) return false;

  const itemsToCheck = isItemsDisabled
    ? data.items.filter((item) => !isItemsDisabled(item))
    : data.items;

  return itemsToCheck.every((item) => item?.selected);
});

watch(
  () => props.data?.items?.length,
  () => {
    if (loadingNextItems.value) {
      loadingNextItems.value = false;
    }
  },
);

watchEffect(() => {
  if (props.selectedItems?.length > 0) {
    props.selectedItems.forEach((id) => {
      const item = props.data?.items?.find((d) => d?.id === id);
      if (item) {
        item.selected = true;
      }
    });
  }
});

// Methods
const onAllSelect = (isChecked) => {
  const { data, isItemsDisabled, selectedItems } = props;

  const items = isItemsDisabled
    ? data?.items?.filter((item) => !isItemsDisabled(item))
    : data?.items;

  const currentAllItemIds = items.map((item) => item.id);

  items.forEach((item) => {
    item.selected = isChecked;
  });

  const newSelectedItems = isChecked
    ? [...new Set([...selectedItems, ...currentAllItemIds])]
    : selectedItems.filter((id) => !currentAllItemIds.includes(id));

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
    item.selected = false;
  }
};

const onClearFilter = () => {
  props.data?.items?.forEach((item) => {
    item.selected = false;
  });
};

const isDisabledAllItem = computed(() => {
  return props?.data?.items?.every((item) => isDisabledItem(item));
});

const isDisabledItem = (item) => {
  return props?.isItemsDisabled && props?.isItemsDisabled(item);
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
  background: #fafafa;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
}

.scroll-container::-webkit-scrollbar-thumb {
  border-radius: 10px;
  min-height: 18px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.circle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  min-width: 24px;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: theme("colors.neutral.0");
  background: #299b9b;
  font-weight: 400;
  font-family: "Inter", sans-serif;
  font-size: 12px;
  padding: 0 4px;
  border-radius: 12px;
}
</style>
`;export{e as default};
