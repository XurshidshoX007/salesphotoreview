const e=`<template>
  <form @submit.prevent="onSave">
    <d-modal
      :name="dialogName"
      :loading="isLoading"
      @close-dialog="closeDialog"
    >
      <flex-col class="gap-4">
        <d-input-date-picker
          :value="data.payment_date"
          @change="data.payment_date = $event"
        />
        <DropdownsByFilterStates
          :filter-states="filterStates"
          @on-open-dropdown="onOpenDropdown"
        />
        <d-input
          type="number"
          required
          :value="data.payment_amount"
          :label="t('suppliers.payment.payment_amount')"
          @change="data.payment_amount = $event"
        />
        <d-input
          pattern-type="comment"
          :label="t('column.comment')"
          :value="data.description"
          @change="data.description = $event"
        />
      </flex-col>

      <template #footer>
        <m-btn type="submit" :loading="isSaving" class="w-full">
          {{ btnTitle }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { CashboxesModel } from "~/interfaces/api/cashboxes/cashboxes-model";
import type { CurrencyModel } from "~/interfaces/api/settings/currency-model";
import type { PaymentPostModel } from "~/interfaces/api/supplier/payment-models";
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

// store
const supplierPaymentsStore = useSupplierPaymentsStore("main");

// states
const { t } = useI18n();
const cashboxes = ref<DropdownItemsModelByType<CashboxesModel>>();
const paymentMethods = ref<DropdownItemsModelByType<CurrencyModel>>();
const suppliers = ref<DropdownItemsModelByType<SupplierModel>>();
const isSaving = ref<boolean>(false);
const isLoading = ref<boolean>(false);

const data = ref<PaymentPostModel>({
  id: props.id || uuidv4(),
  supplier_id: "",
  cash_box_id: "",
  payment_amount: null,
  currency_id: "",
  payment_date: "",
  description: undefined,
});

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
      return data.value.supplier_id;
    },
    set setSelectedData(value: string) {
      data.value.supplier_id = value;
    },
  },
  {
    name: t("cash.cash"),
    key: "cash",
    isSingleSelect: true,
    required: true,
    get data() {
      return cashboxes.value || [];
    },
    get getSelectedData() {
      return data.value.cash_box_id;
    },
    set setSelectedData(value: string) {
      data.value.cash_box_id = value;
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
      return data.value.currency_id;
    },
    set setSelectedData(value: string) {
      data.value.currency_id = value;
    },
  },
]);

// hooks
const dialogName = computed((): string => {
  return props.id ? t("edit") : t("add");
});

const btnTitle = computed((): string => {
  return props.id ? t("save") : t("add");
});

onMounted(async () => {
  if (props.id)
    await Promise.all([
      getSuppliers(),
      getCashboxes(),
      getPaymentMethods(),
      getDataById(),
    ]);
});

// methods
const closeDialog = () => {
  emit("close-dialog");
};

const onOpenDropdown = async (key: string) => {
  if (key === "supplier" && !suppliers.value) await getSuppliers();
  if (key === "cash" && !cashboxes.value) await getCashboxes();
  if (key === "currencies" && !paymentMethods.value) await getPaymentMethods();
};

const getSuppliers = async () => {
  suppliers.value = await supplierPaymentsStore.getSuppliers();
};

const getCashboxes = async () => {
  cashboxes.value = await supplierPaymentsStore.getCashboxes();
};

const getPaymentMethods = async () => {
  paymentMethods.value = await supplierPaymentsStore.getPaymentMethods();
};

async function getDataById() {
  try {
    isLoading.value = true;
    const res = await supplierPaymentsStore.getById(props.id!);
    if (res) data.value = res;
  } catch (error) {
    console.log(error);
  } finally {
    isLoading.value = false;
  }
}

const onSave = async () => {
  isSaving.value = true;
  const method = props.id ? "put" : "post";
  const res = await supplierPaymentsStore.savePayment(data.value, method);
  if (res !== "error") {
    notify({
      title: t("toast.success"),
      type: "success",
    });
    closeDialog();
    await supplierPaymentsStore.refresh();
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
