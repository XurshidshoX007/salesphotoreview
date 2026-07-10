const n=`<template>
  <link-component :to="link">
    <button
      type="button"
      class="size-10 flex items-center bg-white rounded-lg border border-neutral-200 outline-none hover:bg-gray-100 active:bg-gray-200 p-2.5"
    >
      <icon-arrow-left
        class="transition-all transform group-active:-translate-x-2"
      />
      <div v-if="!withoutTitle" class="ml-2">{{ t("labels.back") }}</div>
      <slot></slot>
    </button>
  </link-component>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// Props
const props = defineProps<{
  link?: string;
  withoutTitle?: boolean;
}>();

// Composabled
const { t } = useI18n();
<\/script>
`;export{n as default};
