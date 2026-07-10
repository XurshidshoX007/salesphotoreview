const e=`<template>
  <form @submit.prevent="onSave">
    <d-modal :name="t('add')" @close-dialog="closeDialog">
      <flex-col class="gap-4">
        <DropdownsByFilterStates
          :filter-states="filterStates"
          @on-open-dropdown="onOpenDropdown"
        />
        <d-input
          type="number"
          required
          :value="data.amount"
          :label="t('suppliers.payment.payment_amount')"
          @change="data.amount = $event"
        />
        <d-input
          pattern-type="comment"
          :label="t('column.comment')"
          :value="data.comment"
          @change="data.comment = $event"
        />
        <RadioBtn
          :items="radioItems"
          :selected-item="selectedRadioItem"
          :label="t('column.remainder_type')"
          @on-select-item-id="onSelectRadioItem"
        />
      </flex-col>

      <template #footer>
        <m-btn type="submit" :loading="isSaving" class="w-full">
          {{ t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { CurrencyModel } from "~/interfaces/api/settings/currency-model";
import type { InitialBalancePostModel } from "~/interfaces/api/supplier/initial-balance-models";
import type { SupplierModel } from "~/interfaces/api/supplier/supplier-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import { uuidv4 } from "~/utils/uuidV4";

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits<{
  (e: "close-dialog"): void;
}>();

// stores
const suppliersInitialBalanceStore = useSuppliersInitialBalanceStore("main");

// states
const { t } = useI18n();
const paymentMethods = ref<DropdownItemsModelByType<CurrencyModel>>();
const suppliers = ref<DropdownItemsModelByType<SupplierModel>>();
const isSaving = ref<boolean>(false);
const selectedRadioItem = ref<number>(1); // 1 for debt, 2 for payment

const data = reactive<InitialBalancePostModel>({
  id: props.id || uuidv4(),
  supplier_id: "",
  amount: null,
  currency_id: "",
  is_debt: true,
  comment: undefined,
});

const radioItems = ref([
  { id: 1, name: t("column.debt") },
  { id: 2, name: t("clients.payment") },
]);

const filterStates = ref<FilterStateModel[]>([
  {
    name: t("sidebar.suppliers"),
    key: "supplier",
    isSingleSelect: true,
    required: true,
    get data() {
      return suppliers.value || [];
    },
    get getSelectedData() {
      return data.supplier_id;
    },
    set setSelectedData(value: string) {
      data.supplier_id = value;
    },
  },
  {
    name: t("settings_sidebar.payment_method"),
    key: "currencies",
    isSingleSelect: true,
    required: true,
    get data() {
      return paymentMethods.value || [];
    },
    get getSelectedData() {
      return data.currency_id;
    },
    set setSelectedData(value: string) {
      data.currency_id = value;
    },
  },
]);

// methods
const closeDialog = () => {
  emit("close-dialog");
};

const onSelectRadioItem = (value: number) => {
  selectedRadioItem.value = value;
  data.is_debt = value === 1;
};

const onOpenDropdown = async (key: string) => {
  if (key === "supplier" && !suppliers.value) await getSuppliers();
  if (key === "currencies" && !paymentMethods.value) await getPaymentMethods();
};

const getSuppliers = async () => {
  suppliers.value = await suppliersInitialBalanceStore.getSuppliers();
};

const getPaymentMethods = async () => {
  paymentMethods.value = await suppliersInitialBalanceStore.getPaymentMethods();
};

const onSave = async () => {
  isSaving.value = true;
  const res = await suppliersInitialBalanceStore.setInitialBalance(data);
  if (res !== "error") {
    notify({
      title: t("toast.success"),
      type: "success",
    });
    closeDialog();
    await suppliersInitialBalanceStore.refresh();
  } else {
    notify({
      title: t("toast.error"),
      type: "error",
    });
  }
  isSaving.value = false;
};
<\/script>
`;export{e as default};
