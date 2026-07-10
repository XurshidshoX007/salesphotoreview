const e=`<template>
  <form class="w-full gap-3" @submit.prevent="save">
    <d-modal :name="modalName" only-close-dialog @closeDialog="closeDialog">
      <div class="flex flex-col gap-5">
        <DropdownsByFilterStates
          :filterStates="dropdownHeader"
          @onOpenDropdown="filtersStore.onOpenDropdown"
          @search="filtersStore.onSearchDropdown"
        />
        <DInput
          :label="t('column.sum')"
          :type="'number'"
          :value="form.payment_amount"
          @change="form.payment_amount = $event"
          required
        />
        <DInputDatePicker
          :value="form.payment_date"
          :label="t('column.payment_date')"
          withoutTime
          @change="(newDate) => (form.payment_date = newDate)"
        />
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filterStates="dropdownPayment"
          @onOpenDropdown="filtersStore.onOpenDropdown"
          @search="filtersStore.onSearchDropdown"
        />
        <DInput
          :label="t('column.comment')"
          pattern-type="comment"
          :value="form.description"
          @change="form.description = $event"
        />
      </div>
      <template #footer>
        <div>
          <m-btn class="w-full" :loading="loading" type="submit">
            {{ t("save") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup>
import moment from "moment";
import { defaultDropdownParams } from "~/variable/params";
import { useI18n } from "vue-i18n";

// Store
const initialBalanceClientsStore = useClientsInitialBalanceStore("main");
const filtersStore = useFiltersStore("/dashboard/cashbox/initialBalance");

// props
const props = defineProps({
  modalName: String,
});

// emits
const emit = defineEmits(["closeDialog"]);

// State
const { t } = useI18n();
let loading = ref(false);

const form = ref({
  payment_date: moment().format("YYYY-MM-DDTHH:mm"),
  payment_amount: null,
  currency_id: null,
  cash_box_id: null,
  payment_courier_id: null,
  client_id: null,
  agent_id: null,
  description: "",
  trade_direction_id: null,
  type: null,
});

const dropdownHeader = ref([
  {
    name: t("sidebar.clients"),
    key: "clients",
    required: true,
    get data() {
      return filtersStore.clients || [];
    },
    get getSelectedData() {
      return form.value.client_id;
    },
    set setSelectedData(value) {
      generationClientToAgent(value);
    },
    onLoadElse: async () => {
      await onLoadElseClients();
    },
    isSingleSelect: true,
  },
  {
    name: t("users.agents.agent"),
    key: "agent-dropdown",
    required: true,
    get disabled() {
      return !form.value.client_id;
    },
    get data() {
      return filtersStore.agents || [];
    },
    get getSelectedData() {
      return form.value.agent_id;
    },
    set setSelectedData(value) {
      form.value.agent_id = value;
    },
    isSingleSelect: true,
  },
]);

const dropdownPayment = ref([
  {
    name: t("settings_sidebar.payment_method"),
    key: "currencies",
    required: true,
    get data() {
      return filtersStore.currency || [];
    },
    get getSelectedData() {
      return form.value.currency_id;
    },
    set setSelectedData(value) {
      form.value.currency_id = value;
    },
    isSingleSelect: true,
  },
  {
    name: t("cash.cash"),
    key: "cash",
    required: true,
    get data() {
      return filtersStore.cashboxes || [];
    },
    get getSelectedData() {
      return form.value.cash_box_id;
    },
    set setSelectedData(value) {
      form.value.cash_box_id = value;
    },
    isSingleSelect: true,
  },
  {
    name: t("settings_sidebar.trade_direction"),
    key: "trade-directions",
    required: true,
    get data() {
      return filtersStore.tradeDirections || [];
    },
    get getSelectedData() {
      return form.value.trade_direction_id;
    },
    set setSelectedData(value) {
      form.value.trade_direction_id = value;
    },
    isSingleSelect: true,
  },
  {
    name: t("column.remainder_type"),
    key: "initial-payment",
    required: true,
    isSingleSelect: true,
    get data() {
      return filtersStore.initialBalancePaymentType || [];
    },
    get getSelectedData() {
      return form.value.type;
    },
    set setSelectedData(value) {
      form.value.type = value;
    },
  },
]);

// Methods
onMounted(async () => {
  await filtersStore.getCashboxes();
  form.value.cash_box_id = filtersStore.cashboxes?.items[0]?.id;
});

const save = async (e) => {
  e.preventDefault();
  loading.value = true;
  try {
    await initialBalanceClientsStore.add(form.value);
    closeDialog();
  } finally {
    loading.value = false;
  }
};

const generationClientToAgent = async (clientId) => {
  form.value.client_id = clientId;
  filtersStore.agents = await initialBalanceClientsStore.getAgentsDropdown({
    ...defaultDropdownParams,
    client_id_arr: [clientId],
  });
  if (filtersStore.agents?.items?.length === 1) {
    form.value.agent_id = filtersStore.agents?.items[0]?.id;
  }
};
const onLoadElseClients = async () => {
  filtersStore.clientsParams.page_size += 10;
  await filtersStore.getClientList();
};
const closeDialog = () => emit("closeDialog");
<\/script>
`;export{e as default};
