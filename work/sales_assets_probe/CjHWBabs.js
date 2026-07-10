const n=`<template>
  <form @submit.prevent="onSave">
    <d-modal
      :name="t('settings.discount.change_expiration_date')"
      @close-dialog="closeDialog"
    >
      <d-input-date-picker
        required
        without-default
        :value="changedDate"
        @change="changedDate = $event"
      />

      <template #footer>
        <m-btn type="submit" class="justify-self-end"> {{ t("save") }} </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// states
const { t } = useI18n();
const changedDate = ref<string>("");

// props
const props = defineProps<{
  prolong: (date: string) => void;
}>();

// emits
const emit = defineEmits<{
  (e: "closeDialog"): void;
}>();

// methods
const closeDialog = () => {
  emit("closeDialog");
};

const onSave = async () => {
  emit("closeDialog");
};
<\/script>
`;export{n as default};
