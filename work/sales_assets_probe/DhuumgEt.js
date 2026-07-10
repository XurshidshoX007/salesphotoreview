const e=`<template>
  <form @submit.prevent="onCreateInvoice">
    <d-modal :name="t('invoices.create_invoices')" @closeDialog="closeDialog">
      <flex-col class="w-full gap-5">
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filterStates="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <d-input-date-picker
          :label="t('orders.expected_shipping_date')"
          without-time
          :value="data.selectedDate"
          :save-key="'InvoicesAssemblyExpectedShippingDate'"
          @change="onChangeDateTime"
        />
      </flex-col>
      <template #footer>
        <m-btn type="submit" class="w-full" :loading="isSaveBtnLoading">
          {{ t("invoices.create") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { defaultDropdownParams } from "~/variable/params";
import type { DropdownsByFilterStates } from "#components";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import type { WarehousesModel } from "~/interfaces/api/warehouse/warehouses-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);

// emits
const emit = defineEmits(["closeDialog"]);

// store
const invoicesStore = useInvoicesStore("main");

// states
const { t } = useI18n();
const warehouses = ref<DropdownItemsModelByType<WarehousesModel>>();
const warehousesParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});

const isSaveBtnLoading = ref(false);

const data = ref({
  warehouseId: null as string | null,
  selectedDate: null as string | null,
});

const filterStates = ref([
  {
    name: t("sidebar.warehouse"),
    key: "warehouses",
    required: true,
    isSingleSelect: true,
    get data() {
      return warehouses.value || [];
    },
    get getSelectedData() {
      return data.value.warehouseId || [];
    },
    set setSelectedData(value: string) {
      data.value.warehouseId = value;
    },
  },
]);

// hooks
onMounted(async () => {
  await getWarehouses();
  onAutoSelectSingleWarehouse();
});

// methods
const onChangeDateTime = (newDate: string) => {
  data.value.selectedDate = newDate;
};

const closeDialog = () => {
  emit("closeDialog");
  DropdownComponent.value!.onClearFilter();
};

const onCreateInvoice = async () => {
  isSaveBtnLoading.value = true;
  const payload = {
    warehouse_id: data.value.warehouseId,
    expected_shipping_date: data.value.selectedDate,
  };
  const response = await invoicesStore.createInvoice(payload);
  isSaveBtnLoading.value = false;
  if (response === "error") {
    notify({ title: t("toast.error"), type: "error" });
    return;
  }
  await invoicesStore.refresh();
  closeDialog();
};

const onOpenDropdown = async (key: string, value: unknown) => {
  if (key === "warehouses" && !warehouses.value) {
    await getWarehouses();
  } else return;
};

const getWarehouses = async () => {
  warehouses.value = await invoicesStore.getWarehouses(warehousesParams.value);
};

const onAutoSelectSingleWarehouse = () => {
  if (warehouses.value?.items?.length === 1) {
    data.value.warehouseId = warehouses.value?.items[0].id || null;
  }
};
<\/script>
`;export{e as default};
