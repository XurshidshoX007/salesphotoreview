const n=`<template>
  <form @submit.prevent="onSave">
    <d-modal :name="modalName" @closeDialog="onCancel">
      <flex-col class="gap-5">
        <d-input
          :label="t('column.name')"
          :id="'name'"
          type="text"
          focusable
          :value="methodData.name"
          @change="(value) => (methodData.name = value)"
          required
        />
        <dropdowns-by-filter-states
          :filter-states="inventoryTypeFilterStates"
          @onOpenDropdown="onOpenDropdown"
          @search="search"
        />
        <d-input-date-picker
          :without-time="true"
          :value="methodData.manufacture_date"
          @change="methodData.manufacture_date = $event?.split('T')[0]"
          :label="t('column.created_date')"
        />
        <d-input
          :label="t('column.serial_number')"
          :id="'serial-number'"
          type="text"
          :value="methodData.serial_number"
          @change="(value) => (methodData.serial_number = value)"
        />

        <d-input
          :label="t('column.inventory_number')"
          :id="'inventory-number'"
          type="text"
          :value="methodData.inventory_number"
          @change="(value) => (methodData.inventory_number = value)"
        />
        <dropdowns-by-filter-states
          :filter-states="checkedFilterStates"
          @onOpenDropdown="onOpenDropdown"
          @search="search"
        />
        <d-input
          :label="t('column.state')"
          :id="'condition'"
          type="text"
          :value="methodData.condition"
          @change="(value) => (methodData.condition = value)"
        />
        <d-input-date-picker
          :without-time="true"
          :value="methodData.attachment_date"
          @change="methodData.attachment_date = $event?.split('T')[0]"
          :label="t('column.attachment_date')"
        />
        <d-input
          :label="t('column.comment')"
          :id="'comment'"
          pattern-type="comment"
          :value="methodData.commentary"
          @change="(value) => (methodData.commentary = value)"
        />
      </flex-col>
      <template #footer>
        <div class="flex justify-between">
          <m-btn group="outlined" @click="onCancel">{{
            t("clients.cancel")
          }}</m-btn>
          <m-btn :loading="loadingSave" type="submit"
            >{{ t("clients.add") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup>
// Store
import { notify } from "@kyvg/vue3-notification";
import {
  clientDropdownParams,
  defaultDropdownParams,
  dropdownParamsAll,
} from "~/variable/params";
import { useI18n } from "vue-i18n";

const equipmentStore = useClientsEquipmentStore("main");
const clientDevicesStore = useClientDetailsDevicesStore("main");
const loadingSave = ref(false);

// props
const props = defineProps({
  modalName: String,
  clientId: String,
});

// emits
const emit = defineEmits(["closeDialog"]);

// states
const { t } = useI18n();
const inventoryTypes = ref(null);
const clients = ref(null);

const dropdownParams = ref(
  props?.clientId ? { ...dropdownParamsAll } : { ...defaultDropdownParams }
);

const inventoryTypesParams = ref({ ...dropdownParams });
const clientsParams = ref({ ...clientDropdownParams });

const clientsFilterStates = ref([
  {
    name: t("sidebar.clients"),
    key: "clients",
    isSingleSelect: true,
    type: !props?.clientId,
    required: true,
    get initialName() {
      return methodData.value.client_name;
    },
    get data() {
      return clients.value || [];
    },
    get getSelectedData() {
      return methodData.value.client_id;
    },
    set setSelectedData(value) {
      return (methodData.value.client_id = value);
    },
    onLoadElse: async () => {
      await onLoadElseClients();
    },
  },
]);

const inventoryTypeFilterStates = ref([
  {
    name: t("column.type_equipment"),
    key: "inventory-types",
    isSingleSelect: true,
    required: true,
    get data() {
      return inventoryTypes.value || [];
    },
    get getSelectedData() {
      return methodData.value.inventory_type_id;
    },
    set setSelectedData(value) {
      methodData.value.inventory_type_id = value;
    },
  },
]);

const methodData = ref({
  inventory_type_id: "",
  client_id: null,
  name: "",
  serial_number: "",
  inventory_number: "",
  manufacture_date: "",
  commentary: "",
  condition: "",
  attachment_date: "",
});

// hooks
const checkedFilterStates = computed(() =>
  clientsFilterStates?.value.filter((item) => item.type === true)
);

onMounted(async () => {
  if (equipmentStore.inventoryId) {
    const [inventoryData, _, __] = await Promise.all([
      equipmentStore.getClientDeviceById(equipmentStore.inventoryId),
      getInventoryTypes(),
    ]);
    methodData.value = inventoryData;
  }
  if (props?.clientId) {
    await getClients();
    methodData.value.client_id = props.clientId;
  }
});

// methods
const onSave = async () => {
  loadingSave.value = true;
  const res = await equipmentStore.add(methodData.value);
  if (res !== "error") {
    notify({ title: t("saved"), type: "success" });
    emit("closeDialog");
    if (props?.clientId) {
      clientDevicesStore.refreshMainTable();
      clientDevicesStore.refreshWithdrawTable();
    }
  } else {
    notify({ title: t("error"), type: "error" });
  }
  loadingSave.value = false;
};

const onCancel = () => {
  emit("closeDialog");
};

const onOpenDropdown = async (state, value) => {
  if (state === "clients" && !clients.value) {
    await getClients();
    return;
  }
  if (state === "inventory-types" && !inventoryTypes.value) {
    await getInventoryTypes();
    return;
  }
};

const search = async (state, value) => {
  if (state === "inventory-types") {
    inventoryTypesParams.value.search = value;
    await getInventoryTypes();
    return;
  }
  if (state === "clients") {
    clientsParams.value.search = value;
    await getClients();
    return;
  }
};

const getInventoryTypes = async () => {
  inventoryTypes.value = await equipmentStore.getInventoryTypes(
    inventoryTypesParams.value
  );
};

const getClients = async () => {
  clients.value = await equipmentStore.getClients(clientsParams.value);
};

const onLoadElseClients = async () => {
  clientsParams.value.page_size += 10;
  await getClients();
};
<\/script>
`;export{n as default};
