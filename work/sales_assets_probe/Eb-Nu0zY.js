const e=`<template>
  <div id="toggle" v-click-outside="outsideClick" class="dropdown">
    <i-btn
      v-tooltip="{
        text: tooltip || t('show_hide_column'),
        placement: 'top-start',
      }"
      class="table-checkbox-button"
      :class="toggleOpen && 'table-checkbox-button-active'"
      @click="toggleCheckboxBar"
    >
      <icon-filter-fill />
    </i-btn>
    <div
      class="table-checkbox-content-checkbox-bar"
      :class="{ show: toggleOpen, top: isDropdownTop }"
    >
      <div class="search-content">
        <search-input-border-none
          :value="searchValues"
          @updated="changeSearch"
        />
      </div>
      <div class="pr-3">
        <div v-if="filterStateArray.length === 0">
          <no-data size="small" />
        </div>
        <flex-col v-else class="table-checkbox-bar-btn">
          <Checkbox
            v-if="filterStateArray?.length > 9"
            :id="'all-select-filter-items-' + device"
            :title="t('filters.choose_all')"
            :checked="selectAllCheckbox"
            :indeterminate="selectIndeterminateCheckbox"
            class="checkbox-select-item"
            @change="setCheckboxAll"
          />
          <div v-for="(item, index) in filterStateKeysSearch" :key="item.name">
            <Checkbox
              :id="'filter-item-' + item.name + item.key + '-' + device"
              :title="item.name"
              :checked="!!item.checked"
              class="checkbox-select-item"
              @change="changeStatusFilter(item.key, $event)"
            />
          </div>
        </flex-col>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { setCheckedItemsToLocalByKey } from "~/utils/local-storage";
import { ref } from "vue";

// props
const props = defineProps<{
  filterStateKeys: Record<string, { name: string; checked?: boolean }>;
  storageKey?: string;
  tooltip?: string;
  device?: string;
}>();

// emits
const emit = defineEmits(["update"]);

// states
const { t } = useI18n();
const toggleOpen = ref(false);
const searchValues = ref<null | string>(null);

// hooks
const filterStateArray = computed(() =>
  Object.values(filterStateKeysSearch.value || {}),
);

const selectAllCheckbox = computed(
  () =>
    filterStateArray.value.length > 0 &&
    filterStateArray.value.every((item) => item.checked),
);

const selectIndeterminateCheckbox = computed(
  () =>
    filterStateArray.value.length > 0 &&
    filterStateArray.value.some((item) => item.checked) &&
    !selectAllCheckbox.value,
);

const isDropdownTop = computed(() => {
  const dropdownButton = document.getElementById("toggle");

  if (!dropdownButton) return false;

  const windowHeight = window.innerHeight;
  const buttonRect = dropdownButton.getBoundingClientRect();

  return windowHeight < buttonRect.bottom + 150;
});

const filterStateKeysArray = computed(() => {
  return Object.entries(props.filterStateKeys).map(([key, value]) => ({
    key,
    ...value,
  }));
});

const filterStateKeysSearch = computed(() => {
  const search = searchValues.value?.toLowerCase().trim();
  if (!search) return filterStateKeysArray.value;

  return filterStateKeysArray.value.filter((item) =>
    item.name.toLowerCase().includes(search),
  );
});
// methods
function outsideClick() {
  toggleOpen.value = false;
}

const changeSearch = (value: string | null) => {
  searchValues.value = value;
};

const changeStatusFilter = (key: string, isChecked: boolean) => {
  props.filterStateKeys[key].checked = isChecked;

  props.storageKey &&
    setCheckedItemsToLocalByKey(props.storageKey, props.filterStateKeys);
  emit("update", props.filterStateKeys);
};

const setCheckboxAll = (event: boolean) => {
  const updatedFilterStateKeys = { ...props.filterStateKeys };

  Object.keys(updatedFilterStateKeys).forEach((key) => {
    updatedFilterStateKeys[key].checked = event;
  });

  props.storageKey &&
    setCheckedItemsToLocalByKey(props.storageKey, updatedFilterStateKeys);
  emit("update", updatedFilterStateKeys);
};

const toggleCheckboxBar = () => {
  toggleOpen.value = !toggleOpen.value;
};

function adjustPosition() {
  const checkboxContent = document.querySelector(
    ".table-checkbox-content-checkbox-bar",
  );
  if (!checkboxContent && !true) return;

  const triggerBtn = document.querySelector(".table-checkbox-button");
  if (!triggerBtn) return;

  const { left, right, width: btnWidth } = triggerBtn.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const contentWidth = checkboxContent.offsetWidth;

  checkboxContent.style.left = "auto";
  checkboxContent.style.right = "auto";
  checkboxContent.style.transform = "none";

  if (left + contentWidth > viewportWidth) {
    if (contentWidth <= left) {
      checkboxContent.style.right = \`0px\`;
    } else {
      checkboxContent.style.right = \`calc(50% - \${
        viewportWidth - left - btnWidth
      }px\`;
      checkboxContent.style.transform = \`translateX(-calc(50% - \${
        viewportWidth - left - btnWidth + 12
      }px))\`;
    }
  } else if (contentWidth < viewportWidth) {
    checkboxContent.style.left = \`0px\`;
  } else {
    checkboxContent.style.left = \`\${left - btnWidth}px\`;
  }
}

window.addEventListener("resize", adjustPosition);
window.addEventListener("load", adjustPosition);

onMounted(() => {
  adjustPosition();
});

watch(toggleOpen, async (val) => {
  if (val) {
    await nextTick();
    adjustPosition();
  }
});
<\/script>

<style scoped lang="scss">
.dropdown {
  position: relative;
  display: inline-block;
}

.table-checkbox-button {
  background: white;
  border: 1px solid theme("colors.neutral.200");
  box-sizing: border-box;
  height: 40px;
  width: 40px;
}

.table-checkbox-button:hover {
  border: 1px solid #299b9b;
}

.table-checkbox-button-active {
  border: 1px solid #299b9b;
  background: #299b9b1a;
}

.table-checkbox-content-checkbox-bar {
  flex-direction: column;
  gap: 5px;
  background-color: white;
  z-index: 9999;
  box-shadow: 0 16px 32px theme("colors.neutral.alpha.10");
  border: 1px solid #e1e4e4;
  border-radius: 8px;
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  width: 280px !important;
  border-bottom: 10px inherit;
  border-top: 10px inherit;
  display: none;

  .search-content {
    padding: 4px 8px;
    border-bottom: 1px solid #d8dbdb;
  }

  .table-checkbox-bar-btn {
    overflow-y: auto;
    padding: 8px;
    width: 100%;
    max-height: 440px;
    overflow-x: hidden;
  }
}

.show {
  display: block;
}

::-webkit-scrollbar {
  width: 8px;
  margin-right: 4px;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px #e1e4e4;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
}
</style>
`;export{e as default};
