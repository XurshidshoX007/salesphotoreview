const n=`<template>
  <d-modal
    only-close-dialog
    :name="t('orders.info')"
    @close-dialog="closeDialog"
  >
    <flex-col v-if="erroredResponses > 0" class="text-center gap-3">
      <div class="text-red-3 font-semibold text-lg">
        {{ t("orders.some_payments_failed") }}
      </div>
      <div>
        {{ t("orders.amount_of_failed_payments") }}:
        <span class="text-red-3 font-semibold">{{
          props.erroredResponses
        }}</span>
      </div>
      <div class="w-full">
        {{
          t("orders.try_again_to_resend_them_by_clicking_to_this_btn_in_table")
        }}:
        <div class="w-full flex items-center justify-center">
          <rounded-icon-btn non-clickable without-tooltip icon="refresh" />
        </div>
      </div>
    </flex-col>
    <div v-else class="text-center">
      <p class="text-success font-semibold text-lg">
        {{ t("orders.all_payments_saved_successfully") }}
      </p>
    </div>
    <template #footer>
      <div class="text-center">
        <m-btn @click="onBtnClick" class="w-full">{{ btnTitle }}</m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  erroredResponses: number;
}>();

// emits
const emit = defineEmits(["closeDialog"]);

// states
const { t } = useI18n();

// hooks
const btnTitle = computed(() =>
  props.erroredResponses > 0
    ? t("orders.close")
    : t("orders.return_to_orders_page"),
);

// methods
const closeDialog = (showErrors = props.erroredResponses > 0) => {
  emit("closeDialog", showErrors);
};

const onBtnClick = () => {
  if (props.erroredResponses > 0) {
    closeDialog();
    return;
  }
  navigateTo("/orders/orders");
};
<\/script>
`;export{n as default};
