const n=`<template>
  <d-modal :name="t('labels.information')" @closeDialog="closeDialog">
    <div class="text-6 fw-6 py-4 text-center">
      {{ title }}
    </div>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  isSaveBtnLoading?: boolean;
  isSaveAndApproveBtnLoading: boolean;
  modalName: String;
  text: String;
  description: String;
  page: String;
  title: String;
}>();

// emit
const emit = defineEmits(["closeDialog", "onSave", "onSaveAndApprove"]);

// states
const { t } = useI18n();

// methods
const closeDialog = () => emit("closeDialog");
<\/script>
`;export{n as default};
