const n=`<template>
  <form @submit.prevent="handleSubmit">
    <d-modal
      :name="t('clients.duplication.save_merge')"
      @close-dialog="closeDialog"
    >
      <d-input
        required
        pattern-type="comment"
        :label="t('column.comment')"
        :value="description"
        @change="description = $event"
      />
      <template #footer>
        <m-btn type="submit" :loading="isLoading" class="w-full">
          {{ t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";

type Props = {
  initialValue?: string;
  onSave: (description: string) => Promise<unknown>;
};

type Emits = {
  (e: "close-dialog"): void;
  (e: "on-success"): void;
};

// Props
const props = defineProps<Props>();

// Emits
const emits = defineEmits<Emits>();

// Composables
const { t } = useI18n();

// States
const description = ref(props.initialValue || "");
const isLoading = ref(false);

// Methods
const closeDialog = () => emits("close-dialog");

const handleSuccess = () => emits("on-success");

const handleSubmit = async () => {
  isLoading.value = true;
  try {
    await props.onSave(description.value);

    notify({ title: t("toast.saved"), type: "success" });
    handleSuccess();
  } catch (error) {
    console.error("Error saving draft:", error);
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isLoading.value = false;
  }
};
<\/script>
`;export{n as default};
