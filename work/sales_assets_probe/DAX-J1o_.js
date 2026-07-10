const n=`<template>
  <form id="app" class="w-full relative" @submit.prevent="save">
    <d-modal
      :dataContainerWidth="'400px'"
      :name="t('settings.edit_password')"
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-4">
        <d-input
          v-if="props.oldPasswordInput"
          :label="t('settings.old_password')"
          :type="'password'"
          :value="data.old_password"
          required
          @change="data.old_password = $event"
        />

        <d-input
          :label="t('settings.new_password')"
          :type="'password'"
          :value="data.new_password"
          required
          @change="data.new_password = $event"
        />
      </flex-col>

      <template #footer>
        <m-btn type="submit" :loading="isLoading" class="w-full">{{
          t("save")
        }}</m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  oldPasswordInput?: boolean;
  savePassword?: (payload: {
    old_password: string;
    new_password: string;
  }) => Promise<void>;
}>();

// emits
const emit = defineEmits(["closeDialog", "changePassword"]);

// State
const { t } = useI18n();
const isLoading = ref(false);

const data = ref({
  old_password: "",
  new_password: "",
});

// Methods
const closeDialog = () => {
  emit("closeDialog");
};

const save = async () => {
  try {
    if (props.savePassword) {
      isLoading.value = true;
      await props.savePassword(data.value);
    } else {
      emit("changePassword", data.value.new_password);
    }
    emit("closeDialog");
  } catch (error) {
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isLoading.value = false;
  }
};
<\/script>
`;export{n as default};
