const e=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="id ? t('edit') : t('clients.add')"
      :loading="assemblyInvoiceStore.loadingUpdate"
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-5">
        <DropdownsByFilterStates
          :filter-states="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <RangeTimePicker
          :labels="t('column.time_range')"
          :range_time="data.display_time_range"
          @change-time-picker="changeTimePicker"
        />
        <d-input
          type="number"
          :label="t('labels.min_volume')"
          :value="data.min_allowed_volume"
          required
          accept-zero
          :after-point-length="5"
          @change="onChangeMinLimit"
        />
      </flex-col>
      <template #footer>
        <m-btn :loading="isBtnLoading" class="w-full" type="submit">
          {{ !id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useAssemblyInvoiceStore } from "~/stores/settings/assembly-invoice/assembly-invoice.store";
import type { AssemblyInvoiceSettingsModel } from "~/interfaces/api/invoice-assembly";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import type { WarehousesModel } from "~/interfaces/api/warehouse/warehouses-model";
import type { DropdownsByFilterStates } from "#components";
import { variableData } from "~/variable/variable";

// Store
const assemblyInvoiceStore = useAssemblyInvoiceStore("main");

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog"]);

// State
const { t } = useI18n();
const isBtnLoading = ref(false);
const warehouses = ref<DropdownItemsModelByType<WarehousesModel>>();
const data = ref<AssemblyInvoiceSettingsModel>({
  id: undefined,
  display_time_range: {
    from_value: "08:00:00",
    to_value: "20:00:00",
  },
  min_allowed_volume: null,
  warehouse_id: null,
});

const filterStates = ref<Array<FilterStateModel<object>>>([
  {
    name: t("sidebar.warehouse"),
    key: "warehouses",
    isSingleSelect: true,
    required: true,
    focusable: true,
    get data() {
      return warehouses.value || [];
    },
    get getSelectedData() {
      return data.value.warehouse_id;
    },
    set setSelectedData(value: string) {
      data.value.warehouse_id = value;
    },
  },
]);
const initialDetailData = ref(); // used to store the detail data on edit

// hooks
onBeforeMount(async () => {
  if (props.id) {
    await getDetail();
  }
});

// Methods
const onOpenDropdown = async (state: string, value: unknown) => {
  if (state === "warehouses" && !warehouses.value) {
    await getWarehouse();
  }
};

const getWarehouse = async () => {
  warehouses.value = await assemblyInvoiceStore.getWarehouses();
};

const save = async () => {
  isBtnLoading.value = true;
  const res = await assemblyInvoiceStore.add(data.value);
  if (res !== "error") {
    await assemblyInvoiceStore.refresh();
    notify({ title: "Сохранено!", type: "success" });
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getDetail = async () => {
  await getWarehouse();
  initialDetailData.value = await assemblyInvoiceStore.getDetailInvoices(
    props.id,
  );
  data.value = { ...initialDetailData.value };
};

const closeDialog = () => {
  emit("closeDialog");
};

const changeTimePicker = (date: {
  from_value: string | null;
  to_value: string | null;
}) => {
  data.value.display_time_range = date;
};

const onChangeMinLimit = (value: number) => {
  data.value.min_allowed_volume = value;
};
<\/script>
`;export{e as default};
