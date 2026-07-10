const n=`<template>
  <form @submit.prevent="onSave">
    <d-modal
      data-container-width="900px"
      :name="t('labels.equipment_seizure')"
      @closeDialog="onSelectExit"
    >
      <div class="flex px-4 gap-x-6 withdraw-inventory-component">
        <flex-col class="w-1/2">
          <div class="section-list">
            <div class="key">{{ t("column.contact_person") }}:</div>
            <div class="value">{{ detailClientDevice?.client_name }}</div>
          </div>
          <div class="section-list">
            <div class="key">{{ t("settings_sidebar.inventory_type") }}:</div>
            <div class="value">{{ detailClientDevice?.inventory_name }}</div>
          </div>
          <div class="section-list">
            <div class="key">{{ t("column.name") }}:</div>
            <div class="value">{{ detailClientDevice?.name }}</div>
          </div>
          <div class="section-list">
            <div class="key">{{ t("column.created_date") }}:</div>
            <div class="value">
              {{
                getFormattedDate(
                  detailClientDevice?.manufacture_date,
                  "DD.MM.YYYY HH:mm",
                )
              }}
            </div>
          </div>
          <div class="section-list">
            <div class="key">{{ t("column.attachment_date") }}:</div>
            <div class="value">
              {{
                getFormattedDate(
                  detailClientDevice?.attachment_date,
                  "DD.MM.YYYY HH:mm",
                )
              }}
            </div>
          </div>
          <div class="section-list">
            <div class="key">{{ t("column.state") }}:</div>
            <div class="value">{{ detailClientDevice?.condition }}</div>
          </div>
          <div class="section-list">
            <div class="key">{{ t("column.comment") }}:</div>
            <div class="value">{{ detailClientDevice?.commentary }}</div>
          </div>
        </flex-col>
        <flex-col class="w-1/2 gap-7 py-7">
          <DropdownsByFilterStates
            :filterStates="clientFilterState"
            @onOpenDropdown="onOpenDropdown"
            @search="onSearchDropdown"
          />
          <d-input-date-picker
            :disabled="!selectedClient"
            :value="data.manufacture_date"
            :label="t('column.date_seizure')"
            @change="data.manufacture_date = $event"
          />
          <d-input
            :label="t('column.status_during_transmission')"
            :id="'condition'"
            type="text"
            :disabled="!selectedClient"
            :value="data.condition"
            @change="(value) => (data.condition = value)"
          />
          <d-input-date-picker
            :disabled="!selectedClient"
            :label="t('column.date_transmission')"
            :value="data.attachment_date"
            @change="data.attachment_date = $event?.split('T')[0]"
          />
          <d-input
            :disabled="!selectedClient"
            pattern-type="comment"
            :label="t('column.description_transmission')"
            id="comment"
            :value="data.commentary"
            @change="data.commentary = $event"
          />
        </flex-col>
      </div>
      <template #footer>
        <div class="flex justify-end gap-x-4">
          <m-btn group="outlined">{{ t("clients.cancel") }}</m-btn>
          <m-btn v-if="selectedClient" type="submit">{{
            t("clients.transmission")
          }}</m-btn>
          <m-btn v-else group="delete" disabled @click="onSave">
            {{ t("clients.withdraw") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { clientDropdownParams } from "~/variable/params";
import { useI18n } from "vue-i18n";
//props
const props = defineProps<{
  clientId: string;
}>();
// Store
const equipmentStore = useClientsEquipmentStore("main");
// emit
const emit = defineEmits(["onInputReason", "onSelectDelete", "onClosed"]);
// states
const { t } = useI18n();
const data = ref({
  id: undefined,
  manufacture_date: null,
  attachment_date: null,
  condition: null,
  commentary: null,
});

const detailClientDevice = ref(null);

const clients = ref(null);
const selectedClient = ref<string | null>(null);

const clientsParams = ref({ ...clientDropdownParams });
const clientFilterState = ref([
  {
    name: t("column.give_to_client"),
    key: "clients",
    required: true,
    isSingleSelect: true,
    get data() {
      return clients.value || [];
    },
    get getSelectedData() {
      return selectedClient.value;
    },
    set setSelectedData(value: string) {
      selectedClient.value = value;
    },
    onLoadElse: async () => {
      await onLoadElseClients();
    },
  },
]);

// hoooks
onMounted(async () => {
  detailClientDevice.value = await equipmentStore.getClientDeviceById(
    props.clientId,
  );
});

// methods
const onSelectExit = () => {
  emit("onClosed");
};

const onOpenDropdown = async (state: string, value: string) => {
  if (state === "clients" && !clients.value) {
    await getClients();
    return;
  }
  return;
};

const getClients = async () => {
  clients.value = await equipmentStore.getClients(clientsParams.value);
};

const onLoadElseClients = async () => {
  clientsParams.value.page_size += 10;
  await getClients();
};

const onSearchDropdown = async (state: string, value: string) => {
  if (state === "clients") {
    clientsParams.value.search = value;
    await getClients();
    return;
  }
};

const onSave = async () => {
  const postData = {
    device_id: detailClientDevice.value?.id,
    client_id: detailClientDevice.value?.client_id,
    ...data.value,
  };

  await equipmentStore.onCancelDevice(postData);
};
<\/script>

<style scoped>
.withdraw-inventory-component {
  .section-list {
    border-bottom: 1px solid #e1e4e4;
    padding: 8px 0;
    gap: 12px;

    .key {
      color: #8fa0a0;
      font-size: 14px;
      font-weight: 400;
      font-family: "Inter", sans-serif;
      text-wrap: nowrap;
    }

    .value {
      font-family: "Inter", sans-serif;
      color: #424f4f;
      font-weight: 500;
      font-size: 16px;
    }
  }
  .section-list:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}
</style>
`;export{n as default};
