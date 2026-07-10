const n=`<template>
  <div
    class="relative w-[190px] min-w-[190px] h-[190px] rounded-xl overflow-hidden cursor-pointer bg-[#efefef] group/card"
  >
    <img :src="path" :alt="alt" class="w-full h-full object-cover block" />

    <div
      class="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1"
    >
      <RadioBtn
        class="h-7 flex-1 bg-white/30 backdrop-blur-md !py-0 px-2 !border-none flex items-center !text-neutral-950 rounded-lg"
        ref="RadioBtnComponent"
        :items="[{ id: path, name: t('settings.product.main') }]"
        name-class="text-xs font-medium !text-neutral-950"
        label-class="flex-1 items-center"
        :selected-item="isMain ? path : 0"
        @on-select-item-id="emits('setMain')"
      />

      <RoundedIconBtn
        class="bg-white/30 backdrop-blur-md !border-none"
        size="2xsm"
        type="danger"
        :icon-size="20"
        icon-file-name="Trash"
        @click="emits('remove')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// Composables
const { t } = useI18n();

// Props
const props = defineProps<{
  path: string;
  alt?: string;
  isMain?: boolean;
  showRemove?: boolean;
}>();

// Emits

type Emits = {
  (e: "remove"): void;
  (e: "setMain"): void;
};
const emits = defineEmits<Emits>();
<\/script>

<style scoped></style>
`;export{n as default};
