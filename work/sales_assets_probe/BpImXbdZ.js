const n=`<template>
  <div class="form-field" :class="disabled && 'pointer-events-none'">
    <label
      @click="handleFocus"
      :class="[
        isFocused ? 'focused' : '',
        'top-[50%]',
        disabled && 'disabled_label',
        isInvalid && 'invalid_label',
      ]"
      :title="name"
      :style="{
        pointerEvents: disabled ? 'none' : 'auto',
        zIndex: isMenuActive ? '46' : '5',
      }"
    >
      <div class="title truncate">{{ name }}</div>
    </label>
    <m-btn-outlined
      group="outlined"
      class="flex items-center w-full overflow-hidden group h-9 md:h-10"
      :class="[
        btnBorderClasses,
        (disabled && 'bg-[#f7fafa] opacity-70') || 'bg-[#FFFFFF]',
      ]"
      :style="buttonInlineStyle"
      :isOpenDropDown="isMenuActive"
      :dropdownPosition="contentPosition"
      @focus="handleFocus"
    >
      <div class="dropdown-btn-inner">
        <div class="dropdown-btn-content" :class="hasIconSlot && 'pr-3'">
          <div
            class="dropdown-btn-text flex gap-2 whitespace-nowrap justify-between truncate"
          >
            <div
              v-if="placeholder && !selectedItemsText"
              class="text-neutral-400"
            >
              {{ placeholder }}
            </div>
            <div
              v-if="selectedItemsText"
              class="truncate"
              :class="[textColorClass, disabled && 'text-[#abaeae]']"
              :style="dynamicStyles"
            >
              {{ selectedItemsText }}
            </div>
            <div
              v-else-if="initialName"
              :class="disabled && 'text-[#abaeae]'"
              class="truncate"
            >
              {{ initialName }}
            </div>
          </div>
          <div class="action-btn flex-shrink-0">
            <icon-arrow-bottom
              v-if="!checkSelectedDataForIcon"
              class="transition-all transform rounded-full"
              :class="iconClasses"
              :style="dynamicStyles"
              :color="disabled && '#abaeae'"
            />
            <icon-clear-icon v-else @click.stop="removeSelect" />
          </div>
        </div>
      </div>
      <div v-if="hasIconSlot" class="dropdown-icon-slot">
        <slot name="icon-btn"></slot>
      </div>
    </m-btn-outlined>
    <div :id="stateKey" class="for-id"></div>
  </div>
</template>

<script setup>
// props
const props = defineProps({
  disabled: Boolean,
  isSingleSelect: Boolean,
  isOnBlur: Boolean,
  isClearable: Boolean,
  name: String,
  initialName: String,
  selectedItemsText: String,
  isInvalid: Boolean,
  btnBorderClasses: String,
  isMenuActive: Boolean,
  setSelectedData: [String, Array, Number],
  stateKey: String,
  contentPosition: String,
  placeholder: String,
  hasIcon: Boolean,
});

// emit

const emit = defineEmits(["onClear"]);

// hooks

const iconClasses = computed(() => {
  return [
    { "rotate-180": !props.disabled && props.isMenuActive },
    props.btnColor && "dynamic-text-color",
  ];
});

const textColorClass = computed(() => {
  return props.btnColor && "dynamic-text-color";
});

const dynamicStyles = computed(() => {
  return props.btnColor ? { "--dynamic-color": props.btnColor } : {};
});

const isInvalid = computed(() => {
  return props.isInvalid;
});
const isFocused = ref(false);
const inputValue = ref(props.setSelectedData);
const checkSelectedDataForIcon = computed(() => {
  if (!props.isSingleSelect || props.isClearable) {
    return Boolean(props.selectedItemsText || props.initialName);
  }
  return false;
});

const handleFocus = () => {
  if (props.isMenuActive) {
    isFocused.value = true;
  }
};

const removeSelect = () => {
  if (checkSelectedDataForIcon.value) {
    emit("onClear");
  }
};

const setFocusedInitialName = () => {
  if (props.initialName) {
    isFocused.value = true;
  }
};
// hooks
const isSetSelectedDataProcessed = ref(false);
const hasIconSlot = computed(() => Boolean(props.hasIcon));
const buttonInlineStyle = computed(() =>
  hasIconSlot.value ? { paddingRight: "0px" } : undefined,
);

watch(
  () => props.setSelectedData,
  async (newValue) => {
    isFocused.value = true;
    if (newValue === null || newValue === undefined) {
      isFocused.value = false;
    }
    if (props.isMenuActive) {
      inputValue.value = props.setSelectedData;
    } else {
      if (!props.setSelectedData?.length && !props.isSingleSelect) {
        isFocused.value = false;
      }
    }
    isSetSelectedDataProcessed.value = true;

    await nextTick();

    if (props.selectedItemsText) {
      isFocused.value = true;
    }
  },
);

watch(
  () => props.selectedItemsText,
  (newValue) => {
    if (isSetSelectedDataProcessed.value) {
      if (newValue) {
        isFocused.value = true;
      }
    } else {
      if (newValue) {
        isFocused.value = true;
      }
    }
  },
);

watch(
  () => isInvalid.value,
  (newValue) => {
    if (isInvalid.value) {
      isFocused.value = true;
    }
  },
);

watch(
  () => props.isMenuActive,
  (newValue) => {
    if (props.isSingleSelect) {
      if (props.selectedItemsText || props.initialName) {
        isFocused.value = true;
      } else {
        isFocused.value = props.isMenuActive;
      }
    } else {
      if (props.setSelectedData?.length > 0) {
        isFocused.value = true;
      } else {
        isFocused.value = props.isMenuActive;
      }
    }
  },
);

watch(
  () => props.isOnBlur,
  (newValue) => {
    isFocused.value = props.isOnBlur;
  },
);

onMounted(() => {
  if (props.selectedItemsText) {
    isFocused.value = true;
  }
});

defineExpose({
  setFocusedInitialName,
});
<\/script>

<style scoped lang="scss">
.form-field {
  min-width: 100%;
  box-sizing: border-box;
  user-select: none;
  position: relative;

  label {
    position: absolute;
    transform: translateY(-50%);
    left: 11px;
    transition:
      top 0.3s,
      font-size 0.3s;
    max-width: calc(100% - 45px);
    padding: 0 5px;
    user-select: none;
    background-image: none !important;
    background-color: theme("colors.neutral.0") !important;

    .title {
      color: theme("colors.neutral.600");
      font-size: 14px;
      font-family: "Inter", sans-serif;
      line-height: 16px;
      font-weight: 400;
      transition:
        top 0.3s,
        font-size 0.3s;
    }

    &.focused {
      left: 11px;
      top: 0;
      line-height: 16px;
      transition:
        top 0.3s,
        font-size 0.3s;

      .title {
        font-size: 12px;
        transition:
          top 0.3s,
          font-size 0.3s;
      }
    }

    &.disabled_label {
      z-index: 1;
      color: theme("colors.neutral.300") !important;
      background-color: theme("colors.neutral.0") !important;

      .title {
        color: theme("colors.neutral.300") !important;
      }
    }

    &.invalid_label {
      background-image: none !important;
      background-color: theme("colors.neutral.0") !important;

      .title {
        color: theme("colors.red.500");
      }
    }
  }

  .action-btn {
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .action-btn:hover {
    background: #057cd11a;
  }

  .for-id {
    position: absolute;
    left: 11px;
    top: -10px;
  }
}

.disabled-form-field {
  pointer-events: none;
  background: #f7fafa;
  opacity: 0.7;
}

.dynamic-text-color {
  color: var(--dynamic-color, currentColor);
}

.dropdown-btn-inner {
  display: flex;
  align-items: stretch;
  width: 100%;
}

.dropdown-btn-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.dropdown-btn-text {
  min-width: 0;
}

.dropdown-icon-slot {
  display: flex;
  align-items: stretch;
  height: 100%;
}

.dropdown-icon-slot :deep(button) {
  height: 100%;
  border-radius: 0 10px 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
`;export{n as default};
