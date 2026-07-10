const n=`<template>
  <d-modal :name="t('cash.close_cash')" @close-dialog="closeDialog">
    <d-input
      :label="t('labels.enter_comment')"
      pattern-type="comment"
      @change="comment = $event"
    />
    <template #footer>
      <m-btn
        :loading="isSaving"
        class="justify-self-end"
        @click="approveClosing"
      >
        {{ t("save") }}
      </m-btn>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  isSaving: boolean;
}>();

// emits
const emit = defineEmits<{
  (e: "close-dialog"): void;
  (e: "approve-closing", comment: string): void;
}>();

// state
const { t } = useI18n();
const comment = ref<string>("");

// methods
const closeDialog = () => {
  emit("close-dialog");
};

const approveClosing = () => {
  emit("approve-closing", comment.value);
};
<\/script>
`;export{n as default};
