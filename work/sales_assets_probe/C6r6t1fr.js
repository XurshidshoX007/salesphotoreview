const e=`<template>
  <div class="checkbox-table dropdown checkbox-order">
    <menu-btn2 size-free withoutPadding @onChangeIsActive="toggleOpen = $event">
      <template #btn>
        <div
          v-tooltip="{
            text: tooltip || t('show_hide_column'),
            placement: 'top',
            nowrap: true,
          }"
        >
          <div
            class="show-hide-column"
            :class="toggleOpen && 'active-show-hide-column'"
          >
            <icon-filter-fill :color="iconColorByAction" />
          </div>
        </div>
      </template>
      <template #content>
        <div class="table-checkbox-content">
          <div class="search-content">
            <search-input-border-none
              :value="searchValues"
              @updated="changeSearch"
            />
          </div>
          <div v-if="__headers.length === 0">
            <no-data size="small" />
          </div>
          <div v-else class="pr-3">
            <flex-col class="table-checkbox">
              <Checkbox
                v-if="__headers.length > 6"
                :id="'all-select-header-columns' + props.saveKey"
                :title="t('filters.choose_all')"
                :checked="selectAllCheckbox"
                :indeterminate="selectIndeterminateCheckbox"
                class="checkbox-select-item"
                @change="setCheckboxAll"
              />
              <div v-for="(item, index) in __headers" :key="item.key">
                <Checkbox
                  :id="
                    'header-column-' +
                    props.saveKey +
                    item.name +
                    item?.key +
                    index
                  "
                  :title="item.name"
                  :checked="item.checked"
                  :disabled="item?.disabled"
                  class="checkbox-select-item"
                  @change="onToggleItem(item, $event)"
                />
              </div>
            </flex-col>
          </div>
        </div>
      </template>
    </menu-btn2>
  </div>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { setCheckedItemsToLocalByKey } from "~/utils/local-storage";

// props
const props = defineProps<{
  headers?: Template[];
  disabledHeaders?: string[];
  saveKey?: string;
  tooltip?: string;
  contentPositionR?: boolean;
}>();

//state
let toggleOpen = ref(false);
const { t } = useI18n();
const selectAllCheckbox = ref(false);
const selectIndeterminateCheckbox = ref(false);
const searchValues = ref<null | string>(null);

// hooks
const __headers = computed(() => {
  const search = searchValues.value?.toLowerCase() || "";
  return props?.headers
    ?.filter(
      (item) =>
        item?.excelOnly !== true &&
        item.type !== "checkbox" &&
        item.type !== "action" &&
        item.name?.toLowerCase().includes(search),
    )
    .map((item) => {
      const disabled = computed(() =>
        props.disabledHeaders?.includes(item.key),
      );
      return reactive({ ...item, disabled });
    });
});

const iconColorByAction = computed(() => {
  if (toggleOpen.value) return "#299B9B";
  return null;
});

watch(__headers, () => {
  changeAllCheckboxEvent();
  if (props.saveKey) {
    setCheckedItemsToLocalByKey(props.saveKey, props.headers);
  }
});

onMounted(() => {
  changeAllCheckboxEvent();
});
// methods
const changeSearch = (value: string | null) => {
  searchValues.value = value;
};

const setCheckboxAll = (event: boolean) => {
  selectAllCheckbox.value = event;
  props.headers.forEach((header) => {
    if (header.type !== "checkbox" && header.type !== "action") {
      if (props.disabledHeaders?.includes(header.key)) return;
      header.checked = event;
    }
  });
};

const changeAllCheckboxEvent = () => {
  const checkedItemsCount =
    __headers.value?.filter((item) => item.checked).length || 0;
  const totalItemsCount = __headers.value?.length || 0;

  selectAllCheckbox.value = checkedItemsCount === totalItemsCount;
  selectIndeterminateCheckbox.value =
    checkedItemsCount > 0 && checkedItemsCount < totalItemsCount;
};

const onToggleItem = (item: Template, isChecked: boolean) => {
  const header = props.headers.find((header) => header.key === item.key);
  if (header) {
    header.checked = isChecked;
  }
};
<\/script>

<style scoped lang="scss">
.dropdown {
  position: relative;
  display: inline-block;
}

.table-checkbox-content {
  flex-direction: column;
  background-color: white;
  z-index: 400;
  border-radius: 8px;
  border: 1px solid #e1e4e4;
  min-width: fit-content;
  width: 272px;
  border-bottom: 10px inherit;
  border-top: 10px inherit;
  box-shadow: 0px 16px 32px -12px theme("colors.neutral.alpha.10");

  .search-content {
    padding: 4px 8px;
    border-bottom: 1px solid #d8dbdb;
  }

  .table-checkbox {
    overflow-y: auto;
    width: 100%;
    max-height: 440px;
    overflow-x: hidden;
    padding: 8px;
  }

  .no-data {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 16px;

    svg {
      width: 60px;
      height: 60px;
    }

    .text {
      font-family: "Inter", sans-serif;
      font-weight: 400;
      font-size: 14px;
      line-height: 20px;
      text-align: center;
      color: #99a0ad;
      width: 100%;
    }
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

@media only screen and (max-width: 576px) {
  .table-checkbox-content {
    left: -62px !important;
  }
}

.show-hide-column {
  padding: 10px;
  border-radius: 10px;
  gap: 8px;
  display: flex;
  align-items: center;
  cursor: pointer;
  border: 1px solid theme("colors.neutral.200");
  height: 40px;
  width: 40px;

  .title {
    font-family: "Inter", sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: theme("colors.neutral.600");
    user-select: none;
  }
}

.show-hide-column:hover {
  border: 1px solid #299b9b;
}

.active-show-hide-column {
  border: 1px solid #299b9b;
  background: #299b9b1a;

  .title {
    color: #299b9b;
  }
}

@media only screen and (max-width: 767px) {
  .show-hide-column {
    .title {
      display: none;
    }
  }
}
</style>
`;export{e as default};
