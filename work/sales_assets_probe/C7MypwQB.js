const n=`<template>
  <div
    class="cursor-pointer w-6 h-6 flex items-center justify-center"
    v-tooltip="_tooltip"
  >
    <div class="w-5">
      <IconCheck v-if="isCopied" color="#299B9B" />
      <IconCopy v-else size="18" @click.stop="copyToClipboard" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  value: string | number;
}>();

// states
const { t } = useI18n();
const isCopied = ref<boolean>(false);
const _tooltip = ref<string>(t("copy"));

// methods
const copyToClipboard = () => {
  navigator.clipboard.writeText(props.value.toString());
  isCopied.value = true;
  _tooltip.value = t("copied");
  setTimeout(() => {
    isCopied.value = false;
    _tooltip.value = t("copy");
  }, 2000);
};
<\/script>
`;export{n as default};
