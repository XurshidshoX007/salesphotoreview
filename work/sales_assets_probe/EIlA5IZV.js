const n=`<template>
  <d-modal
    data-container-width="323px"
    withOutHeader
    @closeDialog="closeDialog"
  >
    <flex-col class="gap-4 w-full py-4">
      <div class="flex justify-center w-full">
        <IconPaperClipOff :size="90" class="text-red-500" />
      </div>
      <div class="text-center font-medium">
        {{ t("clients.detach_qr_code_confirmation") }}
      </div>
    </flex-col>
    <template #footer>
      <div class="grid grid-cols-2 page-gap">
        <m-btn
          group="outlined"
          @click="closeDialog"
          class="!text-red-500 !border-red-500"
        >
          {{ t("cancel") }}
        </m-btn>
        <m-btn
          group="delete"
          :loading="isDetachLoading"
          @click="onDetachQRCode"
        >
          {{ t("clients.detach") }}
        </m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { IconPaperClipOff } from "#components";
import { useI18n } from "vue-i18n";

type Props = {
  isDetachLoading?: boolean;
};

type Emits = {
  (e: "close-dialog"): void;
  (e: "on-detach-qr-code"): Promise<void>;
};

// props
const props = defineProps<Props>();

// emits
const emit = defineEmits<Emits>();

// states
const { t } = useI18n();

// methods
const closeDialog = () => emit("close-dialog");

const onDetachQRCode = () => emit("on-detach-qr-code");
<\/script>
`;export{n as default};
