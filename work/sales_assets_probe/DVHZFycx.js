const n=`<template>
  <d-modal
    :name="title"
    @closeDialog="emit('closeDialog')"
    with-out-header
    :data-container-width="'320px'"
  >
    <div class="flex flex-col items-center gap-4">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100"
      >
        <icon-device-delete class="h-6 w-6 text-red-500" />
      </div>
      <div class="flex flex-col items-center gap-2">
        <p class="text-base font-medium text-neutral-900 mb-0">
          {{ title }}
        </p>
        <p class="text-center text-sm text-neutral-600 mb-0">
          {{ description }}
        </p>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-between items-center gap-2.5">
        <m-btn group="outlined" @click="emit('closeDialog')" class="w-full">
          {{ cancelLabel }}
        </m-btn>
        <m-btn
          group="delete"
          :loading="loading"
          class="w-full"
          @click="onConfirm"
        >
          {{ confirmLabel }}
        </m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// Composables
const { t } = useI18n();

// Props
const props = withDefaults(
  defineProps<{
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

// Emits
const emit = defineEmits<{
  (e: "closeDialog"): void;
  (e: "confirm"): void;
}>();

// Computed
const confirmLabel = computed(
  () => props.confirmText || t("sessions.terminate"),
);

const cancelLabel = computed(() => props.cancelText || t("cancel"));

// Methods
const onConfirm = () => {
  emit("confirm");
};
<\/script>
`;export{n as default};
