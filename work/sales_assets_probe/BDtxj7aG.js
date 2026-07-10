const n=`<template>
  <form @submit.prevent="save">
    <d-modal
      :name="props.id ? t('edit') : t('clients.add')"
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-5">
        <d-input-date-picker
          :label="t('column.date')"
          :value="data.payment_date"
          @change="(v) => (data.payment_date = v)"
          type="text"
          required
        />
        <dropdowns-by-filter-states
          :filterStates="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <d-input
          type="number"
          min="0"
          :label="t('column.sum')"
          id="payment-amount"
          :value="data.amount"
          @change="(value) => (data.amount = value)"
          required
        />
        <d-input
          type="text"
          patternType="comment"
          :label="t('column.comment')"
          :value="data.comment"
          @change="(value) => (data.comment = value)"
        />
      </flex-col>
      <template #footer>
        <div v-if="isSaveAllowed">
          <m-btn type="submit" class="w-full" :loading="isBtnLoading">
            {{ props.id ? t("save") : t("clients.add") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup>
import { notify } from "@kyvg/vue3-notification";
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";
import { useI18n } from "vue-i18n";

// stores
const otherIncomeStore = useOtherIncome("");

// props
const props = defineProps({
  id: String,
  allowToSave: Boolean,
});

// emits
const emit = defineEmits(["closeDialog"]);

// states
const { t } = useI18n();

const currencies = ref(null);
const currenciesParams = ref({ ...dropdownParamsAll });
const cashboxes = ref();
const cashboxesParams = ref({ ...defaultDropdownParams });
const isBtnLoading = ref(false);

const data = ref({
  amount: null,
  currency_id: null,
  cash_box_id: null,
  payment_date: "",
  expense_type_id: null,
  comment: null,
  accepted_negative_balance: 0,
});

const filterStates = ref([
  {
    name: t("settings_sidebar.payment_method"),
    key: "currencies",
    isSingleSelect: true,
    required: true,
    get data() {
      return currencies.value || [];
    },
    get getSelectedData() {
      return data.value.currency_id;
    },
    set setSelectedData(value) {
      data.value.currency_id = value;
    },
  },
  {
    name: "Касса",
    key: "cashboxes",
    isSingleSelect: true,
    required: true,
    get data() {
      return cashboxes.value || [];
    },
    get getSelectedData() {
      return data.value.cash_box_id;
    },
    set setSelectedData(value) {
      data.value.cash_box_id = value;
    },
  },
]);

// hooks
const isSaveAllowed = computed(() => {
  if (!props.id) return true;
  return props.id && props.allowToSave;
});

// methods
const save = async () => {
  isBtnLoading.value = true;
  const res = await otherIncomeStore.add(data.value);
  if (res !== "error") {
    notify({ type: "success", title: t("saved") });
    await otherIncomeStore.refresh();
    closeDialog();
  }
  isBtnLoading.value = false;
};

// hooks
onBeforeMount(async () => {
  if (props.id) {
    await Promise.all([getById(), getCurrencies(), getCashboxes()]);
  }
});

const onOpenDropdown = async (state, value) => {
  if (state === "currencies" && !currencies.value) {
    await getCurrencies();
  } else if (state === "cashboxes" && !cashboxes.value) {
    await getCashboxes();
  } else return;
};

const getById = async () => {
  data.value = await otherIncomeStore.getById(props.id);
};

const getCashboxes = async () => {
  cashboxes.value = await otherIncomeStore.getCashboxes(cashboxesParams.value);
};

const getCurrencies = async () => {
  currencies.value = await otherIncomeStore.getCurrencies(
    currenciesParams.value,
  );
};

const closeDialog = () => {
  emit("closeDialog");
};
<\/script>

<style scoped>
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
}

.custom-shadow-top {
  box-shadow: rgba(33, 35, 38, 0.3) 0px -10px 10px -10px;
}
</style>
`;export{n as default};
