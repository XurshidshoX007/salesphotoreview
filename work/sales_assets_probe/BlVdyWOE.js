const n=`<template>
  <div class="flex justify-between gap-2.5">
    <div class="flex gap-2.5">
      <m-btn
        :disabled="loading"
        class="!border-[#EAEDF1] !bg-[#EAEDF1] !text-[#525866] hover:!bg-[#E1E3E8] transition-colors"
        @click="decrease"
      >
        <template v-if="$slots['decrease-content']">
          <slot name="decrease-content" />
        </template>
        <template v-else>
          <div class="w-5">
            <span v-if="isDecreasing" class="text-sm font-medium">{{
              localCount
            }}</span>
            <IconMinus v-else color="#525866" />
          </div>
          {{ t("decrease") }}
        </template>
      </m-btn>

      <m-btn
        :disabled="loading"
        class="!border-[#EAEDF1] !bg-[#EAEDF1] !text-[#525866] hover:!bg-[#E1E3E8] transition-colors"
        @click="increase"
      >
        <template v-if="$slots['increase-content']">
          <slot name="increase-content" />
        </template>
        <template v-else>
          <div class="w-5">
            <span v-if="isIncreasing" class="text-sm font-medium">{{
              localCount
            }}</span>
            <IconPlus v-else color="#525866" />
          </div>
          {{ t("increase") }}
        </template>
      </m-btn>
    </div>

    <slot name="actions"></slot>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { debounce } from "~/utils/helpers";

type Props = {
  debounceTime?: number;
  step?: number;
  loading?: boolean;
  min?: number;
  max?: number;
} & (
  | {
      multiple?: false;
      defaultValue: number;
      onChange: (value: number) => void;
    }
  | {
      multiple: true;
      defaultValue: { id: number; value: number }[];
      onChange: (values: { id: number; value: number }[]) => void;
    }
);

// props
const props = withDefaults(defineProps<Props>(), {
  debounceTime: 0,
  step: 1,
  min: 0,
  max: Number.MAX_SAFE_INTEGER,
});

// states
const { t } = useI18n();

const localCount = ref<number | { id: number; value: number }[]>(
  props.defaultValue
);
const isIncreasing = ref(false);
const isDecreasing = ref(false);

// hooks
watch(
  () => props.defaultValue,
  (newValue) => {
    if (!isIncreasing.value && !isDecreasing.value) {
      localCount.value = newValue;
    }
  },
  { deep: true }
);

// methods
const handleChange = () => {
  if (props.multiple && Array.isArray(localCount.value)) {
    (props.onChange as (values: { id: number; value: number }[]) => void)(
      localCount.value
    );
  } else if (!props.multiple && typeof localCount.value === "number") {
    (props.onChange as (value: number) => void)(localCount.value);
  }
};

const debouncedSubmit = debounce(handleChange, props.debounceTime);
const debouncedClearStatus = debounce(() => {
  isIncreasing.value = false;
  isDecreasing.value = false;
}, props.debounceTime || 500);

const increase = () => {
  if (props.multiple && Array.isArray(localCount.value)) {
    localCount.value = localCount.value.map((item) => ({
      ...item,
      value: Math.min(item.value + props.step, props.max),
    }));
  } else if (typeof localCount.value === "number") {
    localCount.value = Math.min(localCount.value + props.step, props.max);
  }

  isIncreasing.value = true;
  isDecreasing.value = false;

  debouncedSubmit();
  debouncedClearStatus();
};

const decrease = () => {
  if (props.multiple && Array.isArray(localCount.value)) {
    localCount.value = localCount.value.map((item) => ({
      ...item,
      value: Math.max(item.value - props.step, props.min),
    }));
  } else if (typeof localCount.value === "number") {
    localCount.value = Math.max(localCount.value - props.step, props.min);
  }

  isDecreasing.value = true;
  isIncreasing.value = false;

  debouncedSubmit();
  debouncedClearStatus();
};
<\/script>
`;export{n as default};
