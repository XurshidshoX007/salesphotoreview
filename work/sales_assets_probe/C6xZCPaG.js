const n=`<template>
  <d-modal :name="props.name" @close-dialog="closeDialog">
    <div class="flex justify-center items-center p-4">
      <div ref="printRef">
        <slot name="content" />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center gap-4 w-full">
        <m-btn group="outlined" class="w-full" @click="closeDialog"
          >{{ t("cancel") }}
        </m-btn>
        <m-btn class="w-full" group="orange" @click="handlePrint">
          {{ t("print") }} <IconPrinter />
        </m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

type Props = {
  name?: string;
  printStyles?: string;
};

type Emits = {
  (e: "close-dialog"): void;
  (e: "on-after-print"): void;
};

// props
const props = defineProps<Props>();

// emits
const emit = defineEmits<Emits>();

// states
const { t } = useI18n();
const { $printComponent } = useNuxtApp();
const printRef = ref();

// methods
const closeDialog = () => emit("close-dialog");

const handlePrint = async () => {
  if (!printRef.value) return;

  await $printComponent({
    content: () => printRef.value,
    styles: props.printStyles,
    onAfterPrint: () => {
      emit("on-after-print");
      closeDialog();
    },
  });
};
<\/script>
`;export{n as default};
