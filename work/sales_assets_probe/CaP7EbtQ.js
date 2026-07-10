const n=`<template>
  <div v-if="paymentInfo" class="w-full">
    <div class="border-b p-3 flex justify-between border-[#E1E4E4] w-full">
      <div class="fs-14 text-[#8FA0A0]">{{ t("cash.fact") }}</div>
      <div class="fs-16 fs-[500]">
        {{ paymentInfo?.payment_amount }} {{ paymentInfo?.currency_name }}
      </div>
    </div>
    <div class="border-b p-3 flex justify-between border-[#E1E4E4]">
      <div class="fs-14 text-[#8FA0A0]">{{ t("sidebar.clients") }}</div>
      <link-component
        :value="paymentInfo?.client_name"
        :to="\`/clients/about-clients/\${paymentInfo.client_id}\`"
        nonCopyable
      />
    </div>
    <div class="border-b p-3 flex justify-between border-[#E1E4E4]">
      <div class="fs-14 text-[#8FA0A0]">{{ t("column.phone") }}</div>
      <div class="fs-16 fs-[500]">{{ paymentInfo?.phone }}</div>
    </div>
    <div class="border-b p-3 flex justify-between border-[#E1E4E4]">
      <div class="fs-14 text-[#8FA0A0]">Агент</div>
      <div class="fs-16 fs-[500]">{{ paymentInfo?.agent_name }}</div>
    </div>
    <div class="border-b p-3 flex justify-between border-[#E1E4E4]">
      <div class="fs-14 text-[#8FA0A0]">{{ t("column.payment_date") }}</div>
      <div class="fs-16 fs-[500]">
        {{
          getFormattedDate(
            paymentInfo?.payment_received_date,
            "DD.MM.YYYY HH:mm",
          )
        }}
      </div>
    </div>
    <div class="border-b p-3 flex justify-between border-[#E1E4E4]">
      <div class="fs-14 text-[#8FA0A0]">{{ t("column.created") }}</div>
      <div class="fs-16 fs-[500]">
        {{ paymentInfo?.created_by?.name || paymentInfo?.created_by }}
      </div>
    </div>
    <div class="border-b p-3 flex justify-between border-[#E1E4E4]">
      <div class="fs-14 text-[#8FA0A0]">{{ t("column.last_modified_by") }}</div>
      <div class="fs-16 fs-[500]">
        {{ paymentInfo?.modified_by?.name || paymentInfo?.modified_by }}
      </div>
    </div>
    <div class="border-b p-3 flex justify-between border-[#E1E4E4]">
      <div class="fs-14 text-[#8FA0A0]">{{ t("column.comment") }}</div>
      <div class="fs-16 fs-[500]">
        {{ paymentInfo?.description || paymentInfo?.comment }}
      </div>
    </div>
    <div class="border-b p-3 flex justify-between border-[#E1E4E4]">
      <div class="fs-14 text-[#8FA0A0]">{{ t("column.created_date") }}</div>
      <div class="fs-16 fs-[500]">
        {{
          getFormattedDate(
            paymentInfo?.payment_approved_date,
            "DD.MM.YYYY HH:mm",
          )
        }}
      </div>
    </div>
    <div class="p-3 flex justify-between">
      <div class="fs-14 text-[#8FA0A0]">
        {{ t("settings_sidebar.trade_direction") }}
      </div>
      <div class="fs-16 fs-[500]">
        {{
          paymentInfo?.sales_channel?.name || paymentInfo?.sales_channel_name
        }}
      </div>
    </div>

    <flex-row
      v-if="type === 'payment-customers'"
      class="w-full page-gap items-center justify-end"
    >
      <!--      <cancel-btn class="h-11" @click="onDeletePayment">-->
      <!--        <IconTrash size="24" />-->
      <!--      </cancel-btn>-->
      <nuxt-link
        :to="\`/dashboard/cashbox/payment-customers/history/\${paymentInfo?.id.identity}\`"
      >
        <cancel-btn class="h-11 flex gap-3 items-center">
          <IconHistory color="#299B9B" /> {{ t("cash.history") }}
        </cancel-btn>
      </nuxt-link>

      <!--      <m-btn class="h-11" @click="onChangePayment">-->
      <!--        <IconEdit color="#fff" /> Изменить-->
      <!--      </m-btn>-->
    </flex-row>

    <div
      v-if="type === 'about-clients'"
      class="border border-[#299B9B] flex h-11 rounded-lg m-4"
    >
      <button
        @click="onConversionDialog"
        class="w-[40%] border-r border-[#299B9B] font-[500]"
      >
        {{ t("clients.convert") }}
      </button>
      <button class="w-[30%] border-r border-[#299B9B] font-[500]">
        {{ t("comment.history") }}
      </button>
      <button class="w-[30%] font-[500]" @click="onChangePayment">
        {{ t("clients.update") }}
      </button>
    </div>
  </div>
  <div v-else class="w-full flex justify-center items-center">
    <IconLoading :loading="true" :width="11" :height="11" />
  </div>
</template>

<script setup>
import { getFormattedDate } from "~/utils/formatters";
import { useI18n } from "vue-i18n";

// store
const clientDebtsStore = useClientsDebtsStore("main");

// props
const props = defineProps({
  paymentId: Object,
  type: String,
});

// emits
const emit = defineEmits(
  "onOpenConversionDialog",
  "onChangePayment",
  "onDeletePayment",
);

// state
const { t } = useI18n();
const paymentInfo = ref(null);

// methods
onMounted(async () => {
  console.log(props.paymentId);
  await getPaymentInfo();
});

const getPaymentInfo = async () => {
  if (props.paymentId) {
    console.log(props.paymentId);
    paymentInfo.value = await clientDebtsStore.getClientPaymentInfo(
      props.paymentId,
    );
  }
};

const onConversionDialog = () => {
  emit("onOpenConversionDialog");
};

const onChangePayment = () => {
  emit("onChangePayment");
};

const onDeletePayment = () => {
  emit("onDeletePayment");
};
<\/script>

<style scoped></style>
`;export{n as default};
