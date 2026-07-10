const n=`<template>
  <form @submit.prevent="save">
    <d-modal :name="t('clients.attach_qr_code')" @close-dialog="closeDialog">
      <dropdowns-by-filter-states
        :filter-states="filterStates"
        @onOpenDropdown="onOpenDropdown"
        @search="search"
      />
      <template #footer>
        <m-btn
          type="submit"
          :loading="clientsQRCodeStore.isQRCodeAttachLoading"
          class="w-full"
        >
          {{ t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { clientDropdownParams } from "~/variable/params";

type Emits = {
  (e: "close-dialog"): void;
  (e: "on-attach-qr-code", clientId: string): Promise<void>;
};

// emits
const emit = defineEmits<Emits>();

// stores
const clientsQRCodeStore = useClientsQRCodeStore();

// states
const { t } = useI18n();
const clients = ref<AppResponse<ClientModel> | null>(null);
const clientsParams = ref({ ...clientDropdownParams });

const filterStates = ref<FilterStateModel[]>([
  {
    name: t("sidebar.clients"),
    key: "clients",
    isSingleSelect: true,
    required: true,
    get data() {
      return clients.value || [];
    },
    get getSelectedData() {
      if (!methodData.value.client_id) return;

      return methodData.value.client_id;
    },
    set setSelectedData(value: string) {
      methodData.value.client_id = value;
    },
    onLoadElse: async () => {
      await onLoadElseClients();
    },
  },
]);

const methodData = ref<{
  client_id: string | null;
}>({
  client_id: null,
});

// methods
const closeDialog = () => emit("close-dialog");

const onAttachQRCode = (clientId: string) =>
  emit("on-attach-qr-code", clientId);

const save = async () => {
  if (!methodData.value.client_id) return;

  onAttachQRCode(methodData.value.client_id);
};

const getClients = async () => {
  clientsQRCodeStore.getClients(clientsParams.value).then((response) => {
    if (response) {
      clients.value = response;
    }
  });
};

const onLoadElseClients = async () => {
  clientsParams.value.page_size += 10;
  await getClients();
};

const onOpenDropdown = async (state: string) => {
  if (state === "clients" && !clients.value) {
    await getClients();
    return;
  }
};

const search = async (state: string, value: string) => {
  if (state === "clients") {
    clientsParams.value.search = value;
    await getClients();
    return;
  }
};
<\/script>
`;export{n as default};
