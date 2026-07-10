const n=`<template>
  <d-modal
    :name="t('invoices.result_creation_shipping_invoices')"
    @close-dialog="closeDialog"
  >
    <flex-col>
      <div
        v-for="item in responseResults"
        class="w-full flex items-center gap-2 flex-wrap py-2 border-b-1 last-border-b-0"
      >
        <div class="w-7">
          <IconLoading
            v-if="item.loading"
            :loading="true"
            color="#fff"
            :width="4"
            :height="4"
          />
          <IconCheck v-else-if="item.status === 'OK'" :color="'#299B9B'" />
          <IconX v-else />
        </div>
        <div class="text-nowrap fs-14">
          {{ getExpeditorById(item.expeditor_id) }}
        </div>
        <div>
          <div v-if="item.status === 'OK'" class="text-[#299B9B] fs-14">
            {{ t("successfully") }}
          </div>
          <div v-else class="text-red-3 w-full w-full text-wrap fs-14">
            {{ item.message }}
          </div>
        </div>
      </div>
    </flex-col>
    <template #footer>
      <m-btn class="w-full" group="outlined" @click="closeDialog">
        {{ t("invoices.back_to_creating_shipping_notes") }}
      </m-btn>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useNotification } from "@kyvg/vue3-notification";
const { notify } = useNotification();
// store
const shippingInvoiceStore = useShippingInvoicesStore("main");

// props
const props = defineProps<{
  responseResults: {
    expeditor_id: string;
    status: string;
    message: string;
    loading: boolean;
  }[];
}>();

// emits
const emit = defineEmits(["closeDialog"]);

// states
const { t } = useI18n();

// methods

const closeDialog = () => {
  emit("closeDialog");
};

const getExpeditorById = (id: string) => {
  return shippingInvoiceStore.expeditorData?.items?.find(
    (item) => item.id === id
  )?.name;
};
<\/script>
`;export{n as default};
