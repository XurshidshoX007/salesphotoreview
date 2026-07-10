const e=`<template>
  <div
    v-for="(cols, index) in filterStates"
    :key="cols.key"
    :class="cols?.order && \`order-\${cols?.order}\`"
    class="w-full"
    v-show="!cols?.hide"
  >
    <div>
      <DropdownsByFilterStatesTitle
        :required="cols?.required"
        :selected-data="cols.getSelectedData"
        :state-key="cols.key"
        :is-form-valid="isFormValid.bind(null, cols?.initialName)"
        :required-notification="cols?.notification"
        :required-check="requiredCheck"
        class="hidden"
      />
      <div
        :class="
          cn(cols?.class, {
            'flex items-center border rounded-lg bg-[#FAFDFD]': cols?.isLoading,
          })
        "
      >
        <menu-btn-for-dropdown
          :disabled="readonly || cols?.disabled"
          v-model="cols.contentPosition"
          @on-change-is-active="onChangeMenuIsActive(cols, index, $event)"
          @click="onOpenDropdown(cols, $event)"
          @blur="onBlur(cols.isMenuActive)"
        >
          <template #btn>
            <DropdownsByFilterStatesBtn
              ref="DropdownBtn"
              :disabled="readonly || cols?.disabled"
              :is-clearable="cols?.isClearable"
              :name="cols.name"
              :state-key="cols.key"
              :initial-name="cols?.initialName"
              :is-menu-active="cols?.isMenuActive"
              :selected-items-text="getSelectedItemsNames(cols)"
              :is-invalid="
                isDropdownInvalid(cols?.required, cols.getSelectedData)
              "
              :hasInitialName="hasInitialName(cols)"
              :btn-border-classes="btnBorderClasses(cols)"
              :set-selected-data="cols.getSelectedData"
              :is-single-select="cols?.isSingleSelect"
              :is-on-blur="isOnBlur"
              :notification="cols?.notification"
              :contentPosition="cols?.contentPosition"
              :placeholder="cols?.placeholder"
              :has-icon="Boolean(cols?.icon)"
              @on-clear="onClear(cols)"
            >
              <template #icon-btn v-if="cols?.icon">
                <DropdownsByFilterStatesIconBtn
                  :icon="cols?.icon"
                  :handle-click="onIconClick.bind(null, resolveStoreKey(cols))"
                />
              </template>
            </DropdownsByFilterStatesBtn>
          </template>
          <template #content>
            <DropdownsByFilterStatesContent
              v-if="!cols?.isLoading"
              ref="DropdownContent"
              :items="filteredItems(cols)"
              :is-tree-view="cols?.isTreeView"
              :is-single-select="cols?.isSingleSelect"
              :selected-data="cols.getSelectedData"
              :total-count="cols.data?.total_count"
              :state-key="cols.key"
              :data="cols.data"
              :customFilterItems="cols?.customFilterItems"
              :max-selection-limit="cols?.maxSelectionLimit"
              :onLoadElse="cols?.onLoadElse"
              :isItemsDisabled="cols?.isItemsDisabled"
              :search-handler="search.bind(null, cols)"
              :select-items-handler="updateSelectedItems.bind(null, cols)"
              :auto-focus="cols?.autoFocusSearch"
            />
          </template>
        </menu-btn-for-dropdown>
        <DropdownsByFilterStatesLoadingIcon :loading="cols?.isLoading" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { notify } from "@kyvg/vue3-notification";
import { nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { variableData } from "~/variable/variable";
import MenuBtnForDropdown from "~/components/global/DropdownsByFilterStates/MenuBtnForDropdown.vue";

// props
const props = defineProps({
  filterStates: Array,
  readonly: Boolean,
});

// emits
const emit = defineEmits(["onOpenDropdown", "search", "onIconClick"]);

// hooks
const readonly = computed(() => props.readonly || false);

// states
const { t } = useI18n();
const { isNotificationTriggered } = variableData;
const isInvalidState = ref("");
const searchingResults = ref({});
const additionalDetailData = ref({});
const isOnBlur = ref(false);
const isCheckRequired = ref(false);

// child-components
const DropdownContent = ref(null);
const DropdownBtn = ref(null);
const resolveStoreKey = (cols) => cols?.storeKey || cols?.key;

const resolveDropdownContent = (index) => {
  if (Array.isArray(DropdownContent.value)) {
    return DropdownContent.value[index] || null;
  }
  return DropdownContent.value;
};

const focusDropdownSearchInput = (cols, index) => {
  if (!cols?.autoFocusSearch) return;
  const dropdownInstance = resolveDropdownContent(index);
  dropdownInstance?.focusSearchInput?.();
};

// methods
const onOpenDropdown = (cols, value) => {
  if (props.readonly || cols?.disabled) return;
  const storeKey = resolveStoreKey(cols);
  emit("onOpenDropdown", storeKey, value);
  if (isInvalidState.value === cols?.key) isInvalidState.value = "";
};

const onBlur = (isActive) => {
  if (isActive) {
    isOnBlur.value = false;
  }
};

const search = (cols, value) => {
  const storeKey = resolveStoreKey(cols);
  if (storeKey?.includes("clients")) {
    // client comes with pagination
    emit("search", storeKey, value);
    return;
  }
  if (value) {
    searchingResults.value[cols.key] = cols.isTreeView
      ? filterTreeItems(cols.data?.items, value)
      : filterItems(cols.data?.items, value);
  } else {
    searchingResults.value[cols.key] = undefined;
  }
};

const filterItems = (items, query) => {
  return items.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  );
};

const filterTreeItems = (items, query) => {
  const lowerQuery = query.toLowerCase();

  return items
    .map((item) => {
      if (item.name.toLowerCase().includes(lowerQuery)) return item;
      if (item.children?.length) {
        const filtered = filterTreeItems(item.children, query);
        if (filtered.length) return { ...item, children: filtered };
      }
      return null;
    })
    .filter(Boolean);
};

const filteredItems = (cols) => {
  const { key, data, isFilter, isSingleSelect, getSelectedData } = cols;

  setAdditionalDetailData(cols);

  let colsItems = searchingResults.value[key] || data?.items;

  if (!isFilter) {
    if (isSingleSelect) {
      const isSelectedData = getSelectedData
        ? data?.items
        : data?.items?.filter((item) => item.is_active !== false);
      colsItems = searchingResults.value[key] || isSelectedData;
    } else {
      const hasSelectedData =
        getSelectedData?.length || additionalDetailData.value[key]?.length;
      const isSelectedData = hasSelectedData
        ? data?.items
        : data?.items?.filter((item) => item.is_active !== false);
      colsItems = searchingResults.value[key] || isSelectedData;
    }

    if (isSelectedDataTypeString(key, colsItems)) {
      const additionalData = additionalDetailData.value[key] || [];
      colsItems = colsItems.filter(
        (item) => item.is_active || additionalData.includes(item.id),
      );
    }
  }

  return colsItems;
};

const isSelectedDataTypeString = (key, colsItems) => {
  return (
    additionalDetailData.value[key] &&
    typeof additionalDetailData.value[key][0] === "string" &&
    colsItems?.some((item) => "is_active" in item)
  );
};

const setAdditionalDetailData = (cols) => {
  const { key, isSingleSelect, getSelectedData } = cols;

  if (isSingleSelect && !additionalDetailData.value[key] && !!getSelectedData) {
    additionalDetailData.value[key] = [getSelectedData];
  } else if (
    getSelectedData?.length > 0 &&
    !additionalDetailData.value[key] &&
    !!getSelectedData
  ) {
    additionalDetailData.value[key] = getSelectedData;
  }
};

const onIconClick = (storeKey) => {
  emit("onIconClick", storeKey);
};

const btnBorderClasses = (cols) => {
  return cols?.isLoading
    ? "border-none"
    : isDropdownInvalid(cols?.required, cols.getSelectedData)
      ? "border-red"
      : "border-grey";
};

const onClear = (cols) => {
  if (cols?.isSingleSelect) {
    cols.setSelectedData = null;
    if (cols?.initialName) {
      cols.initialName = null;
    }
  } else {
    cols.setSelectedData = [];
  }
  onClearFilter();
};

// handle with selected-names
const hasInitialName = (cols) => {
  if (cols?.initialName && !cols.data?.items) {
    DropdownBtn.value?.map((item, index) => {
      DropdownBtn.value?.[index]?.setFocusedInitialName();
    });
  }
};

const getSelectedItemsNames = (cols) => {
  const items = cols?.isTreeView
    ? getAllInnerItems(cols.data?.items)
    : cols.data?.items;
  if (cols?.isSingleSelect) {
    return getSingleSelectedName(items, cols.getSelectedData) || "";
  }
  if (!items && cols?.getSelectedData?.length && !cols?.initialName) {
    return \`\${t("cash.selected")} \${cols.getSelectedData?.length}\`;
  }
  return getMultipleSelectedNames(items, cols.getSelectedData) || "";
};

const getAllInnerItems = (items) => {
  let innerItems = [];
  items?.forEach((item) => {
    innerItems.push(item);
    if (item.children.length) {
      innerItems = innerItems.concat(getAllInnerItems(item.children));
    }
  });
  return innerItems;
};

const getSingleSelectedName = (items, selectedId) => {
  const item = items?.find((val) => val?.id === selectedId);
  return (
    item?.name ||
    item?.first_name ||
    item?.last_name ||
    item?.middle_name ||
    item?.full_name
  );
};

const getMultipleSelectedNames = (items, selectedItems) => {
  const namesArr = selectedItems?.map((selectedId) => {
    const selectedItemName = items?.find((item) => item?.id === selectedId);
    return (
      selectedItemName?.name ||
      selectedItemName?.first_name ||
      selectedItemName?.last_name ||
      selectedItemName?.middle_name ||
      selectedItemName?.full_name
    );
  });
  if (namesArr?.length > 4) {
    return namesArr.slice(0, 4).join(", ") + \` и eщё \${namesArr.length - 4}\`;
  }
  return namesArr?.join(", ");
};

const updateSelectedItems = (cols, selectedItems) => {
  cols.setSelectedData = selectedItems;
};

// validations
const requiredCheck = (selectedData, stateKey, outputNotification, name) => {
  if (Array.isArray(selectedData) ? selectedData.length : selectedData) return;

  isInvalidState.value = stateKey;
  isCheckRequired.value = true;

  document.getElementById(stateKey)?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  if (outputNotification && !isNotificationTriggered.value) {
    triggerNotification(name);
  }
};

const triggerNotification = (name) => {
  notify({
    type: "error",
    title: name
      ? \`Ввод \${name.toLowerCase()} обязателен\`
      : t("errors.fill_all_fields"),
  });
  isNotificationTriggered.value = true;
  setTimeout(() => {
    isNotificationTriggered.value = false;
  }, 1000);
};

const isDropdownInvalid = (isRequired, selectedData) => {
  if (Array.isArray(selectedData)) {
    if (selectedData.length === 0) {
      return isCheckRequired.value && isRequired;
    } else {
      return false;
    }
  } else {
    if (
      selectedData === null ||
      selectedData === "" ||
      selectedData === undefined
    ) {
      return isCheckRequired.value && isRequired;
    } else {
      return false;
    }
  }
};

const isFormValid = (initialName, selectedData) => {
  if (initialName) return true;
  if (Array.isArray(selectedData)) {
    return selectedData.length ? true : null;
  } else return selectedData;
};

const onChangeMenuIsActive = (cols, index, newValue) => {
  cols.isMenuActive = newValue;
  if (!newValue) return;
  nextTick(() => {
    focusDropdownSearchInput(cols, index);
  });
};

const onClearFilter = () => {
  if (Array.isArray(DropdownContent.value)) {
    for (let idx = 0; idx < DropdownContent.value.length; idx++) {
      DropdownContent?.value[idx]?.onClearFilter();
    }
  } else DropdownContent.value?.onClearFilter();
};

defineExpose({
  onClearFilter,
});
<\/script>

<style scoped>
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  border-radius: 6px;
}

::-webkit-scrollbar-thumb {
  border-radius: 6px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
}
</style>
`;export{e as default};
