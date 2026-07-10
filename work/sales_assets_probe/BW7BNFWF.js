const e=`<template>
  <i-btn
    :disabled="isFilterClearable"
    @click="onClearFilter"
    v-tooltip="{
      text: t('filters.reset_filter'),
      placement: 'top',
      disabled: isFilterClearable,
    }"
  >
    <IconResetFilter />
  </i-btn>
</template>

<script setup lang="ts">
// props
import { useI18n } from "vue-i18n";

const props = defineProps<{
  isFilterClearable: Boolean;
}>();
const { t } = useI18n();
// emits
const emit = defineEmits(["onClearFilter"]);

// methods
const onClearFilter = () => {
  emit("onClearFilter");
};
<\/script>
`;export{e as default};
