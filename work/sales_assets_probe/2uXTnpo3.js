const n=`<template>
  <div :class="[containerClasses]" class="select-none">
    <div
      v-if="title"
      class="button-bg py-3 px-5 text-white font-semibold text-lg"
    >
      {{ title }}
    </div>
    <div v-if="searchInput" class="flex justify-center w-full p-4 border-b-1">
      <SearchInput no-debounce class="w-full" @change="onSearch" />
    </div>
    <div
      v-for="item in itemsArr"
      :key="item?.id"
      :class="itemClasses(item)"
      @click="onChangeActiveItem(item?.id)"
    >
      <div class="flex justify-between items-center">
        <div class="fs-14 fw-4 flex gap-x-2">
          {{ item?.name || item?.full_name || item?.first_name }}
          <p v-if="descriptionKey" class="m-0 fs-12 text-gray-2">
            {{ item[descriptionKey] }}
          </p>
          <icon-warning
            v-if="isCreateOrder && !item?.all_products_belong_to_agent"
            v-tooltip="t('orders.without_agent_category')"
          />
        </div>
      </div>
      <div
        class="total_circle"
        v-if="props.indicatorMode && isUsedItemTab(item.id)"
      >
        {{ showTotalCount(item?.total_count) }}
      </div>
      <div v-if="isInvalidItemTabResult(item.id) > 0" class="invalid-circle">
        {{ isInvalidItemTabResult(item.id) }}
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="loading">
      <SkeletonRows v-show="!tabMode && !indicatorMode" :rows="6" />

      <flex-row v-show="indicatorMode || tabMode" class="item-center gap-4">
        <SkeletonBlock v-for="i in 3" :key="i" height="42px" width="150px" />
      </flex-row>
    </div>

    <!-- EMPTY -->
    <div
      v-if="!loading && !itemsArr?.length && isSideMenuMode"
      class="flex justify-center items-center flex-col py-6"
    >
      <no-data size="large" />
    </div>
  </div>
</template>

<script setup>
// props
import { useI18n } from "vue-i18n";

const props = defineProps({
  tabMode: {
    type: Boolean,
    default: false,
  },
  indicatorMode: {
    type: Boolean,
    default: false,
  },
  itemsArr: {
    type: Array,
    required: true,
  },
  activeItemId: [String, Number],
  searchInput: Boolean,
  usedItemIds: Array,
  invalidItemIds: Array,
  loading: Boolean,
  isBtnLoading: {
    type: Boolean,
    default: false,
  },
  invalidItemShowByNumber: Boolean,
  descriptionKey: String,
  isCreateOrder: Boolean,
  autoSelect: {
    type: Boolean,
    default: true,
  },
  title: String,
});

// emits
const emit = defineEmits(["onSearchItems", "onChangeActiveItem"]);

//states

const { t } = useI18n();

// hooks
watchEffect(() => {
  if (props.autoSelect && !props.activeItemId && props.itemsArr?.length) {
    emit("onChangeActiveItem", props.itemsArr[0]?.id);
  }
});

const isSideMenuMode = computed(() => {
  return !props.tabMode && !props.indicatorMode;
});

const containerClasses = computed(() => ({
  "mode-container gap-2 md:gap-0": props.tabMode,
  "mode-container gap-4": props.indicatorMode,
  "menu-container": !props.tabMode && !props.indicatorMode,
}));

// methods
const itemClasses = (item) => {
  const baseClasses = {
    "tab-mode-item order border-r bg-white hover:bg-gray-100 hover:opacity-80 active:bg-gray-200 border-y first:border-l":
      props.tabMode,
    "tab-mode-item order bg-white hover:bg-gray-200 active:bg-gray-300 rounded-lg border":
      props.indicatorMode,
    "settings-sidebar": !props.tabMode && !props.indicatorMode,
    "text-primary-600": props.indicatorMode && item.id === props.activeItemId,
    bgc:
      (props.tabMode || props.indicatorMode) && item.id === props.activeItemId,
    activeColor:
      !props.tabMode && !props.indicatorMode && item.id === props.activeItemId,
    "used-item-tab": props.indicatorMode && isUsedItemTab(item.id),
    "invalid-item-tab":
      props.indicatorMode &&
      !isInvalidItemTab(item.id) &&
      !props.invalidItemShowByNumber,
    "invalid-item-tab-for-number":
      props.indicatorMode && !isInvalidItemTab(item.id),
  };
  return baseClasses;
};

const isUsedItemTab = (itemId) =>
  props.indicatorMode && props.usedItemIds?.includes(itemId);

const isInvalidItemTab = (itemId) => {
  return props.indicatorMode && !props.invalidItemIds?.includes(itemId);
};

const isInvalidItemTabResult = (id) => {
  const products = props.itemsArr?.find((item) => item.id === id);
  const totalReturningAmount = products.products?.reduce(
    (acc, product) =>
      acc + product.returning_count + product?.returning_count_as_payment,
    0,
  );
  const currentMinReturningAmount =
    products?.min_returning_amount - totalReturningAmount;

  return currentMinReturningAmount;
};

const onSearch = (newValue) => {
  emit("onSearchItems", newValue);
};

const onChangeActiveItem = (itemId) => {
  if (!props.isBtnLoading && itemId !== props.activeItemId) {
    emit("onChangeActiveItem", itemId);
  }
};

const showTotalCount = (count) => {
  if (count > 999) {
    return "999+";
  }
  return count;
};
<\/script>

<style scoped lang="scss">
.mode-container {
  width: fit-content;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;

  .tab-mode-item {
    padding: 8px 12px;
    white-space: nowrap;
    cursor: pointer;
  }
}

.menu-container {
  width: 100%;
  border-radius: 8px;
  min-height: 80px;
  background: white;
  border: 1px solid #e1e4e4;
  overflow: hidden;
}

.activeColor:after {
  position: absolute;
  content: "";
  right: 0;
  bottom: 0;
  top: 0;
  margin: 3px 0;
  width: 4px;
  border-radius: 3px 0px 0px 3px;
  background: #299b9b;
}

.invalid-item-tab,
.invalid-item-tab-for-number,
.used-item-tab {
  position: relative;
}

.invalid-item-tab-for-number {
  .invalid-circle {
    position: absolute;
    top: -5px;
    right: -5px;
    padding: 0 5px;
    border-radius: 8px;
    background: red;
    color: white;
    font-weight: 500;
    font-family: "Inter", sans-serif;
    font-size: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.used-item-tab {
  .total_circle {
    min-width: 26px; /* Ensures a minimum size */
    height: 26px; /* Keeps consistent height */
    border: 1px solid #f2f5f5;
    border-radius: 150px;
    position: absolute;
    right: -14px;
    top: -14px;
    color: white;
    padding: 0 6px;
    font-size: 12px;
    text-align: center;
    font-family: "Inter", sans-serif;
    background-color: #299b9b;
    display: flex; /* Ensures content scales naturally */
    align-items: center; /* Centers content vertically */
    justify-content: center; /* Centers content horizontally */
  }
}

.invalid-item-tab::after {
  content: "";
  width: 20px;
  height: 20px;
  border: 4px solid #fff;
  border-radius: 50%;
  position: absolute;
  left: 0px;
  top: 0px;
  transform: translate(-40%, -40%);
  background-color: #f00;
}

.order:first-child {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.order:last-child {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

.bgc {
  background: #299b9b;
  border-color: #299b9b;
  color: white;
}

@media only screen and (max-width: 767px) {
  .mode-container {
    .tab-mode-item {
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid #e1e4e4;
      font-size: 12px;
    }
  }
}
</style>
`;export{n as default};
