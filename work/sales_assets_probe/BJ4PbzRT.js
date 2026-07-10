const e=`<template>
  <form id="app" class="w-full relative" @submit.prevent="save">
    <d-modal
      only-close-dialog
      :name="cashExpenditureStore.editId ? t('edit') : t('clients.add')"
      :loading="cashExpenditureStore.isDetailLoading"
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-5">
        <d-input-date-picker
          :label="t('cash.expense_date')"
          :value="data.payment_date"
          @change="(newDate) => (data.payment_date = newDate)"
        />
        <DropdownsByFilterStates
          :filterStates="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <d-input
          type="number"
          :label="t('column.sum')"
          :value="data.amount"
          required
          @change="(value) => (data.amount = value)"
        />
        <d-input
          :label="t('column.comment')"
          :value="data.comment"
          pattern-type="comment"
          @change="(value) => (data.comment = value)"
        />
      </flex-col>
      <template #footer>
        <m-btn
          :loading="cashExpenditureStore.isSaveLoading"
          class="w-full"
          type="submit"
        >
          {{ !data.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup>
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";
import { useI18n } from "vue-i18n";

// Store
const cashExpenditureStore = useCashExpenses("main");

// State
const { t } = useI18n();
const expenditure = ref();
const expenditureParams = ref({ ...defaultDropdownParams });
const cash = ref();
const cashboxParams = ref({ ...defaultDropdownParams });
const currency = ref();
const currencyParams = ref({ ...dropdownParamsAll });

let data = ref({
  id: undefined,
  amount: null,
  currency_id: null,
  cash_box_id: null,
  payment_date: new Date().toISOString(),
  expense_type_id: null,
  comment: "",
  accepted_negative_balance: null,
});

const roles = ref({ items: null });

const filterStates = ref([
  {
    name: t("cash.cash"),
    key: "cash",
    get data() {
      return cash.value || [];
    },
    get getSelectedData() {
      return data.value.cash_box_id;
    },
    set setSelectedData(value) {
      data.value.cash_box_id = value;
    },
    isSingleSelect: true,
    required: true,
  },
  {
    name: t("settings.category_group"),
    key: "expenditure",
    get data() {
      return expenditure.value || [];
    },
    get getSelectedData() {
      return data.value.expense_type_id;
    },
    set setSelectedData(value) {
      data.value.expense_type_id = value;
    },
    isSingleSelect: true,
    required: true,
  },
  {
    name: t("settings_sidebar.payment_method"),
    key: "currency",
    get data() {
      return currency.value || [];
    },
    get getSelectedData() {
      return data.value.currency_id;
    },
    set setSelectedData(value) {
      data.value.currency_id = value;
    },
    onLoadElse: async () => {
      await onLoadElseCurrency();
    },
    isSingleSelect: true,
    required: true,
  },
]);

// Hooks
onMounted(async () => {
  if (cashExpenditureStore.editId) {
    let detail = await cashExpenditureStore.expenseDetail(
      cashExpenditureStore.editId,
    );
    if (detail) {
      await Promise.all([getCash(), getExpenditure(), getCurrency()]);
      data.value = {
        id: cashExpenditureStore.editId,
        amount: detail.amount,
        currency_id: detail.currency_id,
        cash_box_id: detail.cash_box_id,
        payment_date: detail.payment_date,
        expense_type_id: detail.expense_type_id,
        comment: detail.comment,
      };
    }
  }
});

// Methods
const save = async (e) => {
  try {
    if (data.value.id === undefined) {
      const { id, ...newDataWithoutId } = data.value;
      cashExpenditureStore.saveExpense(newDataWithoutId, "expense");
      e.preventDefault();
    } else {
      cashExpenditureStore.saveExpense(data.value, "expense-edit");
      e.preventDefault();
    }
  } catch (e) {}
  cashExpenditureStore.editId = null;
};

const closeDialog = () => {
  cashExpenditureStore.expensesShow = false;
  cashExpenditureStore.editId = null;
};

const onOpenDropdown = async (state, value) => {
  if (state === "cash" && !cash.value) {
    await getCash();
    return;
  }
  if (state === "currency" && !currency.value) {
    await getCurrency();
    return;
  }
  if (state === "expenditure" && !expenditure.value) {
    await getExpenditure();
    return;
  }
  return;
};

const getExpenditure = async () => {
  expenditure.value = await cashExpenditureStore.getExpenditure(
    expenditureParams.value,
  );
};

const getCash = async () => {
  cash.value = await cashExpenditureStore.getCash(cashboxParams.value);
};

const getCurrency = async () => {
  currency.value = await cashExpenditureStore.getCurrency(currencyParams.value);
};
<\/script>

<style scoped>
.slider {
  transition: 0.2s !important;
}

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
</style>
`;export{e as default};
