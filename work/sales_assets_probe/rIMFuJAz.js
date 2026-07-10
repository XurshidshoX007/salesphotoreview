const e=`<template>
  <d-modal
    dataContainerWidth="1200px"
    backgroundColor="#f6f6f6"
    :name="title"
    @closeDialog="closeDialog"
  >
    <flex-col class="gap-4">
      <OrdersCreateOrdersFilterCard />
      <OrdersCreateOrdersDataTable @closeDialog="closeDialog" />
    </flex-col>
  </d-modal>
</template>

<script setup>
// props
import { useI18n } from "vue-i18n";

const props = defineProps({
  isPopup: Boolean,
});

// emits
const emit = defineEmits(["closeDialog"]);

// state
const { t } = useI18n();
const route = useRoute();
const title = ref("");

// hooks
watchEffect(() => {
  if (route.query) {
    const queryKey = Object.keys(route.query)?.join("");
    if (queryKey === "request") title.value = t("orders.request_order");
    else if (queryKey === "exchange") title.value = t("orders.exchange_order");
    else if (queryKey === "refund" && route.query[queryKey] === "tara") {
      title.value = t("orders.refund_order");
    } else {
      title.value = t("orders.shelf_order");
    }
  }
});

// methods
const closeDialog = () => emit("closeDialog");
<\/script>
`;export{e as default};
