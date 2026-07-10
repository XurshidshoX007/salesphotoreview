const e=`<template>
  <form id="app" class="w-full" @submit.prevent="save">
    <d-modal
      :name="t('cash.access_to_change_payment_modal_name')"
      @closeDialog="closeDialog"
    >
      <div class="grid grid-cols-1 gap-5">
        <d-input
          :label="\`\${t('column.term_access')} (мин)\`"
          required
          :max="60"
          type="number"
          :value="data.expires_in"
          @change="data.expires_in = $event"
        />
        <DropdownsByFilterStates
          :filterStates="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <d-input
          :label="t('column.comment')"
          pattern-type="comment"
          type="text"
          :value="data.comment"
          @change="data.comment = $event"
        />
      </div>
      <template #footer>
        <m-btn :loading="isLoadingBtn" class="w-full" type="submit">
          {{ t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import type { DropdownsByFilterStates } from "#components";
import type { UnitModel } from "~/interfaces/api/settings/unit-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { PaymentBatchDetailModel } from "~/interfaces/api/clients/payment-batch-detail-model";
import type { PaymentCancellationModel } from "~/interfaces/api/cashboxes/payment-cancellation-model";
import type { ExpeditorModel } from "~/interfaces/api/users/expeditor-model";

// props
const props = defineProps<{
  item: PaymentBatchDetailModel;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// Stores
const clientsPaymentStore = useClientsPaymentStore("main");

// State
const { t } = useI18n();
const isLoadingBtn = ref(false);
const cancelReason = ref<DropdownItemsModelByType<UnitModel>>();
const expeditor = ref<DropdownItemsModelByType<ExpeditorModel>>();

const data = ref<Partial<PaymentCancellationModel>>({
  id: uuidv4(),
  income_payment_id: null,
  accessed_for_user_id: null,
  payment_cancellation_reason_id: null,
  comment: null,
  expires_in: null,
});

let filterStates = ref([
  {
    name: t("filters.expeditor"),
    key: "expeditor",
    isSingleSelect: true,
    required: true,
    get initialName() {
      return props.item?.payment_courier_name;
    },
    get data() {
      return expeditor.value || [];
    },
    get getSelectedData() {
      return data.value.accessed_for_user_id;
    },
    set setSelectedData(value: string) {
      data.value.accessed_for_user_id = value;
    },
  },
  {
    name: t("settings_sidebar.payment_cancellation_reason"),
    key: "payment-reason",
    isSingleSelect: true,
    required: true,
    get data() {
      return cancelReason.value || [];
    },
    get getSelectedData() {
      return data.value.payment_cancellation_reason_id;
    },
    set setSelectedData(value: string) {
      data.value.payment_cancellation_reason_id = value;
    },
  },
]);

// hooks

onMounted(() => {
  if (props.item) {
    data.value.accessed_for_user_id = props.item?.payment_courier_id;
    data.value.income_payment_id = props.item?.identity;
  }
});

// methods

const onOpenDropdown = async (key: string) => {
  if (key === "payment-reason" && !cancelReason.value) {
    await getPaymentCancelReason();
  } else if (key === "expeditor" && !expeditor.value) {
    await getExpeditor();
  }
};

const getPaymentCancelReason = async () => {
  cancelReason.value = await clientsPaymentStore.getPaymentCancelReason();
};
const getExpeditor = async () => {
  expeditor.value = await clientsPaymentStore.getExpeditors();
};

const save = async () => {
  isLoadingBtn.value = true;
  const res = await clientsPaymentStore.paymentCancellation(data.value);
  if (res !== "error") {
    await clientsPaymentStore.refresh();
    notify({ title: t("saved"), type: "success" });
    closeDialog();
  }
  isLoadingBtn.value = false;
};

const closeDialog = () => emit("closeDialog");
<\/script>
`;export{e as default};
