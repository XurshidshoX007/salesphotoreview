const e=`<template>
  <d-modal
    dataContainerWidth="1600px"
    backgroundColor="#f6f6f6"
    :name="t('orders.select_an_order_to_create_return')"
    only-close-dialog
    @closeDialog="closeDialog"
  >
    <flex-col class="page-gap">
      <OrdersOrderRefundCreateOrderRefundFilter
        :is-with-client="isWithClient"
      />
      <OrdersOrderRefundCreateOrderRefundTable
        :is-with-client="isWithClient"
        @closeDialog="closeDialog"
        @onSelectItemId="onSelectItemId"
      />
    </flex-col>
  </d-modal>
</template>
<script setup lang="ts">
//state
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const props = defineProps({
  isWithClient: Boolean,
});
// emits
const emit = defineEmits(["closeDialog", "onSelectItemId"]);
// methods
const closeDialog = () => emit("closeDialog");

const onSelectItemId = (id: string) => {
  emit("onSelectItemId", id);
  closeDialog();
};
<\/script>
`;export{e as default};
