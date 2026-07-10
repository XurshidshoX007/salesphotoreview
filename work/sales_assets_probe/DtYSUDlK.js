const n=`<template>
  <form @submit.prevent="save">
    <d-modal
      :name="t('clients.generate_qr_codes')"
      :loading="isLoading"
      @closeDialog="closeDialog"
    >
      <div class="space-y-4">
        <d-input
          :label="t('clients.number_of_qr_codes')"
          type="number"
          id="count"
          min="1"
          required
          focusable
          :max="limit"
          :value="methodData.count"
          @change="(value: number) => (methodData.count = value)"
        />
        <p class="text-sm text-gray-500 text-right">
          {{ t("clients.qr_codes.qr_codes_limit_message", limit) }}
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <m-btn type="button" group="border" @click="closeDialog">
            {{ t("cancel") }}
          </m-btn>
          <m-btn type="submit" :loading="isLoading">
            {{ t("save") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";

type Emits = {
  (e: "closeDialog"): void;
};

// emits
const emit = defineEmits<Emits>();

// stores
const clientsQRCodeStore = useClientsQRCodeStore();

// states
const { t } = useI18n();
const isLoading = ref(false);
const limit = ref(0);
const methodData = ref({
  count: null as number | null,
});

// Hooks
onMounted(() => {
  handleAvailableGenerationCount();
});

// methods
const closeDialog = () => emit("closeDialog");

const save = async () => {
  isLoading.value = true;
  try {
    await clientsQRCodeStore.generateQRCodes(methodData.value.count);

    clientsQRCodeStore.refresh();
    closeDialog();
    notify({ title: t("toast.success"), type: "success" });
  } catch (error) {
    console.error(error);
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isLoading.value = false;
  }
};

const handleAvailableGenerationCount = async () => {
  try {
    const { data } = await clientsQRCodeStore.getAvailableGenerationCount();

    limit.value = data;
  } catch (error) {
    console.error(error);
  }
};
<\/script>
`;export{n as default};
