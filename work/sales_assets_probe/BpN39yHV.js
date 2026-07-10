const n=`<template>
  <form @submit.prevent="onSave">
    <d-modal
      :name="t('clients.qr_codes.custom_size')"
      @close-dialog="onCloseDialog"
    >
      <div class="flex gap-3">
        <d-input
          type="number"
          :value="methodData.width"
          :label="t('clients.qr_codes.width_cm')"
          :min="1"
          :max="100"
          required
          @change="(value: number) => (methodData.width = value)"
        />
        <d-input
          type="number"
          :value="methodData.height"
          :label="t('clients.qr_codes.height_cm')"
          :min="1"
          :max="100"
          required
          @change="(value: number) => (methodData.height = value)"
        />
      </div>
      <template #footer>
        <div class="flex gap-3">
          <m-btn group="outlined" @click="onCloseDialog" class="w-full">
            {{ t("cancel") }}
          </m-btn>
          <m-btn type="submit" class="w-full">
            {{ t("apply") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import type { PrintSizeType } from "#imports";
import { useI18n } from "vue-i18n";

type Props = {
  initialValue?: {
    width: number;
    height: number;
  };
};

type Emits = {
  (e: "close-dialog"): void;
  (e: "save", data: PrintSizeType): void;
};

// Props
const props = defineProps<Props>();

// Emits
const emit = defineEmits<Emits>();

// Composables
const { t } = useI18n();

// States
const methodData = ref<{
  width: number | null;
  height: number | null;
}>({
  width: null,
  height: null,
});

// Hooks
onMounted(() => {
  if (props.initialValue) {
    methodData.value.width = props.initialValue.width;
    methodData.value.height = props.initialValue.height;
  }
});

// Methods
const onCloseDialog = () => emit("close-dialog");

const onSave = () => {
  if (!methodData.value.width || !methodData.value.height) {
    return;
  }

  emit("save", {
    width: methodData.value.width,
    height: methodData.value.height,
  });
  onCloseDialog();
};
<\/script>
`;export{n as default};
