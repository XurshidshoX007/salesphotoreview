const e=`<template>
  <d-modal
    :dataContainerWidth="'360px'"
    :name="t('clients.deleted_photo')"
    @closeDialog="closeDialog"
  >
    <div class="w-full">
      <d-input
        pattern-type="comment"
        :label="t('column.reason')"
        :value="data.reason"
        @change="data.reason = $event"
      />
    </div>
    <template #footer>
      <div class="grid grid-cols-2 page-gap">
        <m-btn group="outlined" @click="closeDialog">
          {{ t("column.no_exit") }}
        </m-btn>
        <m-btn
          :disabled="deletedLoading"
          group="delete"
          @click="deletePayments"
        >
          {{ t("column.yes_deleted") }}
        </m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
// Props
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";

const clientStore = useClientsStore("main");
const deletedLoading = ref(false);
const props = defineProps({
  isActive: {
    type: Boolean,
    required: true,
  },
  id: String,
  clientId: String,
});
const data = ref({
  reason: "",
});
// State
const { t } = useI18n();
const emit = defineEmits(["closeDeleteDialog"]);
const closeDialog = () => {
  emit("closeDeleteDialog");
};

const deletePayments = async () => {
  deletedLoading.value = true;
  try {
    await clientStore.setPhotoDeletedReport(props?.id, data.value.reason);
    await clientStore.getClientFiles(props?.clientId);
    closeDialog();
    notify({ title: t("successful"), type: "success" });
  } catch (e) {
    notify({ type: "error", title: t("error") });
  }
  deletedLoading.value = false;
};
<\/script>
`;export{e as default};
