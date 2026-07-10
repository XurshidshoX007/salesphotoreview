const e=`<template>
  <form @submit.prevent="onSave">
    <d-modal :name="t('invoices.start_collecting')" @close-dialog="closeDialog">
      <flex-col class="gap-3">
        <dropdowns-by-filter-states
          :filter-states="filterStates"
          @on-open-dropdown="onOpenDropdown"
        />
      </flex-col>
      <template #footer>
        <m-btn type="submit" :loading="isBtnLoading" class="w-full">
          {{ t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { DropdownWarehousemanModel } from "~/interfaces/api/users/dropdown-warehouseman-model";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import type { WarehouseBlockDropdownModel } from "~/interfaces/api/warehouse/warehouse-block-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import { defaultDropdownParams } from "~/variable/params";
import type { InvoiceModel } from "~/interfaces/api/invoices/assembly/summarized-by-expeditor-list-model";

// props
const props = defineProps<{
  itemData: InvoiceModel;
}>();

// emits
const emit = defineEmits(["closeDialog", "returnItemId"]);

// stores
const invoicesStore = useInvoicesStore("main");

// states
const { t } = useI18n();
const isBtnLoading = ref(false);

const warehouseBlocks =
  ref<DropdownItemsModelByType<WarehouseBlockDropdownModel>>();
const selectedWarehouseBlock = ref<string>();

const warehouseMen = ref<
  DropdownItemsModelByType<DropdownWarehousemanModel> | undefined
>();
const selectedWarehouseMan = ref<string>();

const expeditor = computed(() => props.itemData?.expeditor);

const warehouse = computed(() => props.itemData?.warehouse);

const filterStates = ref([
  {
    name: t("sidebar.warehouse"),
    key: "warehouses",
    initialName: warehouse.value?.name,
    disabled: true,
    get getSelectedData() {
      return [warehouse.value?.id];
    },
  },
  {
    name: t("sidebar.delivery"),
    key: "expeditors",
    initialName: expeditor.value?.name,
    disabled: true,
    get getSelectedData() {
      return [expeditor.value?.id];
    },
  },
  {
    name: t("sidebar.warehouse_block"),
    key: "warehouse-blocks",
    isSingleSelect: true,
    required: true,
    get data() {
      return warehouseBlocks.value || [];
    },
    get getSelectedData() {
      return selectedWarehouseBlock.value;
    },
    set setSelectedData(value: string) {
      selectedWarehouseBlock.value = value;
    },
  },
  {
    name: t("invoices.collector"),
    key: "warehouse-men",
    required: true,
    isSingleSelect: true,
    get data() {
      return warehouseMen.value || [];
    },
    get getSelectedData() {
      return selectedWarehouseMan.value;
    },
    set setSelectedData(value: string) {
      selectedWarehouseMan.value = value;
    },
  },
]);

// hooks
const warehouseBlocksParams = computed<defaultDropdownParamsType>(() => ({
  ...defaultDropdownParams,
  filter: [
    ...(defaultDropdownParams.filter || []),
    {
      field: "warehouse_id",
      value: warehouse.value?.id ? [warehouse.value.id] : [],
    },
    {
      field: "expeditor_id",
      value: expeditor.value?.id ? [expeditor.value.id] : [],
    },
  ],
}));

const warehouseMenParams = computed<defaultDropdownParamsType>(() => ({
  ...defaultDropdownParams,
  warehouse_id_arr: [warehouse.value?.id || undefined],
}));

onMounted(async () => {
  await Promise.all([getWarehouseBlocks(), getWarehouseMen()]);
  onAutoSelectSingleWarehouseBlock();
  onAutoSelectSingleWarehouseMan();
});

// methods
const closeDialog = () => {
  emit("closeDialog");
};

const onOpenDropdown = async (key: string, value: unknown) => {
  if (key === "warehouse-blocks" && !warehouseBlocks.value) {
    await getWarehouseBlocks();
  } else if (key === "warehouse-men" && !warehouseMen.value) {
    await getWarehouseMen();
  }
};

const getWarehouseBlocks = async () => {
  warehouseBlocks.value = await invoicesStore.getWarehouseBlocks(
    warehouseBlocksParams.value
  );
};

const getWarehouseMen = async () => {
  warehouseMen.value = await invoicesStore.getWarehouseMen(
    warehouseMenParams.value
  );
};

const onSave = async () => {
  isBtnLoading.value = true;
  const saveData = {
    expected_shipping_date: props.itemData.shipping_date,
    warehouse_id: warehouse.value.id,
    expeditor_id: expeditor.value.id,
    collector_id: selectedWarehouseMan.value,
    warehouse_block_id: selectedWarehouseBlock.value,
    comment: null,
  };
  const res = await invoicesStore.startCollecting(saveData);
  isBtnLoading.value = false;
  if (res === "error") {
    notify({ title: t("toast.error"), type: "error" });
    return;
  }
  emit("returnItemId", res);
  closeDialog();
};

const onAutoSelectSingleWarehouseMan = () => {
  if (warehouseMen.value?.items?.length === 1) {
    selectedWarehouseMan.value = warehouseMen.value?.items[0]?.id;
  }
};

const onAutoSelectSingleWarehouseBlock = () => {
  if (warehouseBlocks.value?.items?.length === 1) {
    selectedWarehouseBlock.value = warehouseBlocks.value?.items[0]?.id;
  }
};
<\/script>
`;export{e as default};
