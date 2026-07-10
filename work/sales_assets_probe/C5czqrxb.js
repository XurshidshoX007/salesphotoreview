const e=`<template>
  <form @submit.prevent="onSave">
    <d-modal :name="props.expeditor?.name" @close-dialog="closeDialog">
      <flex-col class="gap-4">
        <DInputDatePicker
          v-if="props.datePicker"
          without-time
          :disabled="props.isDatePickerDisabled"
          :value="shippingDate"
          :label="t('column.shipped_date')"
          @change="changeShippingDate"
        />
        <DropdownsByFilterStates
          readonly
          :filter-states="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <Checkbox
          id="expeditor_confirmation"
          :checked="data.is_expeditor_confirmation_required"
          :title="t('invoices.expeditor_confirmation')"
          @change="data.is_expeditor_confirmation_required = $event"
        />
        <Checkbox
          id="warehouseman_confirmation"
          :checked="data.is_warehouseman_confirmation_required"
          :title="t('invoices.warehouseman_confirmation')"
          @change="data.is_warehouseman_confirmation_required = $event"
        />
        <Checkbox
          id="operator_confirmation"
          :checked="data.is_operator_confirmation_required"
          :title="t('invoices.operator_confirmation')"
          @change="data.is_operator_confirmation_required = $event"
        />
      </flex-col>
      <template #footer>
        <m-btn
          :loading="isLoading"
          class="w-full"
          type="submit"
          :disabled="!checkConfirm"
        >
          {{ t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { GenerateShippingInvoicePostModel } from "~/interfaces/api/invoices/assembly/generate-shipping-invoice-model";
import type { DropdownsByFilterStates } from "#components";

// props
const props = defineProps<{
  warehouse: {
    id: string;
    name: string;
  };
  expeditor: {
    id: string;
    name: string;
  };
  shippingDate?: string;
  isLoading?: boolean;
  datePicker?: boolean;
  isDatePickerDisabled?: boolean;
}>();

const shippingDate = ref(props.shippingDate);

const shippingInvoiceStore = useShippingInvoicesStore("main");

// emits
const emit = defineEmits(["closeDialog", "save"]);

// states
const { t } = useI18n();

const data = ref<GenerateShippingInvoicePostModel>({
  warehouse_id: props.warehouse.id,
  expeditor_id: props.expeditor.id,
  shipping_date: shippingDate.value!,
  is_expeditor_confirmation_required: false,
  is_warehouseman_confirmation_required: false,
  is_operator_confirmation_required: false,
});

const filterStates = ref([
  {
    name: t("sidebar.warehouse"),
    key: "warehouses",
    isSingleSelect: true,
    required: true,
    initialName: props.warehouse.name,
    get data() {
      return shippingInvoiceStore.warehousesData || [];
    },
    get getSelectedData() {
      return data.value.warehouse_id;
    },
    set setSelectedData(id: string) {
      data.value.warehouse_id = id;
    },
  },
  {
    name: t("filters.expeditor"),
    key: "expeditors",
    isSingleSelect: true,
    required: true,
    initialName: props.expeditor.name,
    get data() {
      return shippingInvoiceStore.expeditorData || [];
    },
    get getSelectedData() {
      return data.value.expeditor_id;
    },
    set setSelectedData(id: string) {
      data.value.expeditor_id = id;
    },
  },
]);

const checkConfirm = computed(() => {
  return (
    data.value.is_expeditor_confirmation_required ||
    data.value.is_warehouseman_confirmation_required ||
    data.value.is_operator_confirmation_required
  );
});

const onOpenDropdown = async (state: string, value: any) => {
  if (state === "expeditors" && !shippingInvoiceStore.expeditorData) {
    await shippingInvoiceStore.getExpeditors();
  } else if (state === "warehouses" && !shippingInvoiceStore.warehousesData) {
    await shippingInvoiceStore.getWarehouses();
  }
};
// methods
const closeDialog = () => {
  emit("closeDialog");
};

const onSave = async () => {
  emit("save", data.value);
};

const changeShippingDate = (date: string) => {
  shippingDate.value = date;
  data.value.shipping_date = date;
};
<\/script>
`;export{e as default};
