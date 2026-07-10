const e=`<template>
  <div class="w-full" v-if="detail">
    <div class="flex justify-between py-3 border-b-1" v-if="detail.fact">
      <div class="fs-14">{{ t("column.fact") }}</div>
      <div class="fs-16 font-medium">{{ detail.fact }}</div>
    </div>

    <div
      class="flex justify-between py-3 border-b-1"
      v-if="detail.payment_courier"
    >
      <div class="fs-14">{{ t("sidebar.suppliers") }}</div>
      <div class="fs-16 font-medium">{{ detail.payment_courier?.name }}</div>
    </div>

    <div class="flex justify-between py-3 border-b-1" v-if="detail.agent">
      <div class="fs-14">{{ t("users.agents.agent") }}</div>
      <div class="fs-16 font-medium">{{ detail.agent?.name }}</div>
    </div>
    <div class="flex justify-between py-3 border-b-1" v-if="detail.agent">
      <div class="fs-14">{{ t("column.client") }}</div>
      <div class="fs-16 font-medium">{{ detail.client?.name }}</div>
    </div>

    <div class="flex justify-between py-3 border-b-1" v-if="detail.phone">
      <div class="fs-14">{{ t("column.client_phone") }}</div>
      <div class="fs-16 font-medium">{{ detail.phone }}</div>
    </div>
    <div class="flex justify-between py-3 border-b-1" v-if="detail.phone">
      <div class="fs-14">{{ t("column.cash") }}</div>
      <div class="fs-16 font-medium">{{ detail.cash_box?.name }}</div>
    </div>

    <div
      class="flex justify-between py-3 border-b-1"
      v-if="detail.payment_date"
    >
      <div class="fs-14">{{ t("column.payment_date") }}</div>
      <div class="fs-16 font-medium">
        {{ moment(detail.payment_date).format("DD.MM.YYYY") }}
      </div>
    </div>

    <div class="flex justify-between py-3 border-b-1" v-if="detail.created_by">
      <div class="fs-14">{{ t("column.created_by") }}</div>
      <div class="fs-16 font-medium">{{ detail.created_by?.name }}</div>
    </div>

    <div class="flex justify-between py-3 border-b-1" v-if="detail.edited_by">
      <div class="fs-14">{{ t("column.changed") }}</div>
      <div class="fs-16 font-medium">{{ detail.edited_by?.name }}</div>
    </div>

    <div class="flex justify-between py-3 border-b-1" v-if="detail.description">
      <div class="fs-14">{{ t("column.comment") }}</div>
      <div class="fs-16 font-medium">{{ detail.description }}</div>
    </div>

    <div
      class="flex justify-between py-3 border-b-1"
      v-if="detail.created_date"
    >
      <div class="fs-14">{{ t("column.created_date") }}</div>
      <div class="fs-16 font-medium">
        {{ moment(detail.created_date).format("DD.MM.YYYY") }}
      </div>
    </div>

    <div class="flex justify-between py-3" v-if="detail.trade_direction">
      <div class="fs-14">{{ t("settings_sidebar.trade_direction") }}</div>
      <div class="fs-16 font-medium">{{ detail.trade_direction?.name }}</div>
    </div>
    <div class="flex justify-between">
      <div></div>
      <div class="flex pt-4 mb-[-20px]">
        <!--        <button class="bg-[#EFF3F3] py-[10px] px-3 rounded-lg mr-4" @click.prevent="deleteItem(detail.id)">-->
        <!--          <IconTrash />-->
        <!--        </button>-->
        <!--        <m-btn @click.prevent="$emit('editItem')">-->
        <!--          <div class="flex">-->
        <!--            <IconEditb :color="true" class="mr-3" />-->
        <!--            <div>Изменить</div>-->
        <!--          </div>-->
        <!--        </m-btn>-->
      </div>
    </div>
  </div>
</template>

<script setup>
import moment from "moment";
import { useI18n } from "vue-i18n";
const emit = defineEmits(["closeModal", "editItem"]);
// Store
const clientsInitialBalanceStore = useClientsInitialBalanceStore("main");

// State
const { t } = useI18n();
const detail = ref(clientsInitialBalanceStore.detail);
<\/script>
`;export{e as default};
