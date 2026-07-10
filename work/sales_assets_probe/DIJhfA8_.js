const n=`<template>
  <div v-if="isShowable" class="search-input search-order">
    <d-input
      v-if="isShowable"
      ref="searchInput"
      type="text"
      :value="_value"
      without-style
      :label="!hasPlaceholder ? t('search') : ''"
      :placeholder="hasPlaceholder ? t('search') : null"
      @change="onChange"
      @input="onInput"
    />
    <div v-show="_value" class="clear-icon" @click="onClear">
      <icon-clear-icon :hash="'&#xf00d;'" class="text-gray-4" />
    </div>
    <div class="search-icon">
      <icon-search />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { nextTick } from "vue";

// props
const props = defineProps<{
  itemsTotalCount?: number;
  value?: string;
  noDebounce?: boolean;
  hasPlaceholder?: boolean;
  modelValue?: string;
  autoFocus?: boolean;
}>();

// emits
let debounceTimeout: NodeJS.Timeout | null = null;
const emit = defineEmits(["change", "update:modelValue"]);

// states
const { t } = useI18n();
const savedTotalCount = ref<boolean | number | undefined>(undefined);
const _value = ref<string | null>(props.modelValue || props.value || null);
const searchInput = ref<HTMLElement | null>(null);

// hooks
onMounted(() => {
  if (!savedTotalCount.value) savedTotalCount.value = props.itemsTotalCount;
  _value.value = props.modelValue || props.value || null;
  if (props.autoFocus) {
    setFocused();
  }
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== undefined && _value.value !== newVal) {
      _value.value = newVal;
    }
  },
  { immediate: true },
);

const isShowable = computed(() => {
  if (props.itemsTotalCount && savedTotalCount.value! < 10) {
    return false;
  }
  return true;
});

watch(_value, () => {
  emit("update:modelValue", _value.value);

  if (props.noDebounce) {
    emit("change", _value.value);
    return;
  }
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    emit("change", _value.value);
  }, 400);
});

onBeforeRouteLeave(() => onClearBeforeLeave());

// methods
const onChange = (newValue: string) => {
  _value.value = newValue;
};

const onInput = (event: Event) => {
  _value.value = (event.target as HTMLInputElement).value;
};

async function setFocused() {
  searchInput.value?.focus?.();
}

const onClear = () => {
  _value.value = null;
  emit("update:modelValue", null);
  if (props.value || props.modelValue) {
    setFocused();
  }
};

const onClearBeforeLeave = () => {
  if (!_value.value) return;
  _value.value = null;
  emit("update:modelValue", null);
  emit("change", _value.value);
};

const focusInput = () => {
  nextTick(() => {
    setFocused();
  });
};

defineExpose({
  onClear,
  focus: focusInput,
});
<\/script>

<style lang="scss">
.search-input {
  position: relative;
  border-radius: 10px;
  border: 1px solid #e1e4e4;
  background-color: theme("colors.neutral.0");

  .form-field {
    margin-left: 24px;

    label {
      color: theme("colors.neutral.400");
    }

    input {
      border: none;
      height: 40px;
      width: 100%;
      font-weight: 400;
      font-family: "Inter", sans-serif;
      font-size: 14px;
      padding-right: 37px;
      background: theme("colors.neutral.0");
      text-overflow: ellipsis;
    }

    input:focus {
      background: transparent;
    }
  }

  .search-icon {
    pointer-events: none;
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
  }

  .clear-icon {
    cursor: pointer;
    position: absolute;
    right: 12px;
    z-index: 8;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    padding: 4px;
  }
  .clear-icon:hover {
    background: #057cd11a;
  }
}

@media only screen and (max-device-width: 767px) {
  .search-input {
    .form-field {
      input {
        height: 36px;
      }
    }
  }
}
</style>
`;export{n as default};
