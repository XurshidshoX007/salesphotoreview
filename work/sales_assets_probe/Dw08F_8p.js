const n=`<template>
  <div class="flex flex-row items-center justify-between gap-2">
    <span v-if="!withoutTitle" class="fs-14 fw-4">{{ title }}</span>
    <label
      :class="
        cn(
          'shrink-0 relative w-9 h-5',
          'cursor-pointer inset-0 rounded-full',
          animate && 'transition-colors duration-300',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          indeterminate || switchValue ? 'bg-primary-600' : 'bg-gray-300',
        )
      "
    >
      <input
        v-model="switchValue"
        type="checkbox"
        class="opacity-0 w-0 h-0"
        :disabled="disabled"
        @change="onToggleChange"
      />

      <span
        :class="
          cn(
            'absolute size-4 bg-white rounded top-1/2 -translate-y-1/2 left-0',
            animate && 'transition-transform duration-300',
            switchValue ? 'translate-x-[18px]' : 'translate-x-0.5',
            indeterminate
              ? 'h-1 left-1/2 -translate-x-1/2'
              : 'shadow rounded-full',
          )
        "
        @transitionend="animate = false"
      />
    </label>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { cn } from "~/utils/helpers";
const { t } = useI18n();

interface Props {
  active?: boolean;
  title?: string;
  withoutTitle?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  active: true,
  disabled: false,
  indeterminate: false,
});

const emit = defineEmits<{
  (e: "change", value: boolean): void;
}>();

const switchValue = ref<boolean>(props.active);
const animate = ref(false);

const onToggleChange = (): void => {
  if (!props.disabled) {
    animate.value = true;
    emit("change", switchValue.value);
  }
};

watch(
  () => props.active,
  (newVal) => {
    switchValue.value = newVal ?? false;
  },
);

const title = computed(() => props.title ?? t("active"));
<\/script>
`;export{n as default};
