const n=`<template>
  <div id="toggle" v-click-outside="clicked" class="checkbox-table dropdown">
    <Tooltip position="top-end" :tooltip="t('gps.place_type')" nowrap>
      <i-btn @click="toggleOpen = !toggleOpen">
        <icon-exchange color="#FFF" size="20" />
      </i-btn>
    </Tooltip>
    <div
      class="table-checkbox-content"
      :class="{ show: toggleOpen, top: isDropdownTop() }"
      style="right: 0"
    >
      <div class="table-checkbox">
        <div class="place-checkbox-item">
          <Checkbox
            id="choose_all"
            :title="t('filters.choose_all')"
            :checked="isAllChecked"
            :indeterminate="isAllIndeterminate"
            @change="onToggleAll"
          />
        </div>
        <div
          v-for="(item, index) in __headers"
          :key="item"
          class="place-checkbox-item"
        >
          <Checkbox
            :id="item.name + item?.key + index"
            :title="item.name"
            :checked="item.checked"
            class="whitespace-nowrap"
            @change="onToggleItem(item, $event)"
          />

          <div
            class="circle"
            :style="\`background: \${item.hex_color};
            box-shadow: 0 0 0 6px color-mix(in srgb, \${item.hex_color}, transparent 80%);\`"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { setCheckedItemsToLocalByKey } from "~/utils/local-storage";

// props
const props = defineProps<{
  headers: Template[];
  saveKey?: string;
}>();
//state

let toggleOpen = ref(false);
const { t } = useI18n();

// hooks
const __headers = computed<Template[]>(() => {
  return props.headers?.filter(
    (item) => item.type !== "checkbox" && item.type !== "action",
  );
});

const isAllChecked = computed(() => {
  return __headers.value.every((item) => item.checked);
});

const isAllIndeterminate = computed(() => {
  return (
    __headers.value.some((item) => item.checked) &&
    !__headers.value.every((item) => item.checked)
  );
});

// methods

function clicked() {
  toggleOpen.value = false;
}

function isDropdownTop() {
  const dropdownButton = document.getElementById("toggle");
  if (!dropdownButton) return false;
  const windowHeight = window.innerHeight;
  const buttonRect = dropdownButton.getBoundingClientRect();
  return windowHeight < buttonRect.bottom + 150;
}

const onToggleItem = (item: Template, isChecked: boolean) => {
  item.checked = isChecked;
  setCheckedItemsToLocalByKey(props.saveKey, props.headers);
};

const onToggleAll = (isChecked: boolean) => {
  if (isChecked) {
    __headers.value.forEach((item) => {
      item.checked = true;
    });
  } else {
    __headers.value.forEach((item) => {
      item.checked = false;
    });
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
  gap: 5px;
  background-color: white;
  z-index: 9999;
  box-shadow:
    rgba(14, 30, 37, 0.12) 0px 2px 4px 0px,
    rgba(14, 30, 37, 0.32) 0px 2px 16px 0px;
  position: absolute;
  top: 100%;
  width: fit-content;
  max-width: 400px;
  border-bottom: 10px inherit;
  border-top: 10px inherit;
  border-radius: 12px;
  display: none;
  min-width: 246px;

  .table-checkbox {
    overflow-y: auto;
    padding: 8px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 440px;
    overflow-x: hidden;

    .place-checkbox-item {
      border-radius: 8px;
      cursor: pointer;
      padding: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: space-between;

      .circle {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #ffcc00;
        //box-shadow: 0 0 0 6px rgba(255, 204, 0, 0.2);
      }
    }

    .place-checkbox-item:hover {
      background: theme("colors.neutral.50");
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
</style>
`;export{n as default};
