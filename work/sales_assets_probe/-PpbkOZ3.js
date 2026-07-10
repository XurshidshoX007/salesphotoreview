const n=`<template>
  <form id="app" class="w-full" @submit.prevent="save">
    <d-modal name="Закрыть доступ" @closeDialog="closeDialog">
      <d-input
        :label="t('column.reason')"
        pattern-type="comment"
        type="text"
        :value="data.reason"
        @change="data.reason = $event"
      />
      <template #footer>
        <m-btn :loading="isLoadingBtn" class="w-full" type="submit">
          {{ t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { PaymentCancellationModel } from "~/interfaces/api/cashboxes/payment-cancellation-model";

// props
const props = defineProps<{
  accessId: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab", "refresh"]);

// Stores
const clientsPaymentStore = useClientsPaymentStore("main");

// State
const { t } = useI18n();
const isLoadingBtn = ref(false);

const data = ref<Partial<PaymentCancellationModel>>({
  accessId: props.accessId,
  reason: null,
});

// methods

const save = async () => {
  isLoadingBtn.value = true;
  const res = await clientsPaymentStore.paymentCancellationDeleteAccess(
    data.value,
  );
  if (res !== "error") {
    emit("refresh");
    notify({ title: t("saved"), type: "success" });
    closeDialog();
  }
  isLoadingBtn.value = false;
};

const closeDialog = () => emit("closeDialog");
<\/script>
`;export{n as default};
