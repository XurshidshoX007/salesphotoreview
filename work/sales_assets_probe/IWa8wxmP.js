const n=`<template>
  <form @submit.prevent="onSave">
    <d-modal :name="t('edit')" @close-dialog="closeDialog">
      <flex-col class="gap-3">
        <DropdownsByFilterStates
          :filter-states="filterStates"
          @on-open-dropdown="onOpenDropdown"
          @search="onSearchDropdown"
        />
        <d-input
          required
          type="tel"
          :label="t('column.phone_number')"
          :value="tel"
          @change="tel = $event"
        />
        <d-input
          type="text"
          pattern-type="comment"
          :label="t('column.comment')"
          :value="comment"
          @change="comment = $event"
        />
      </flex-col>
      <template #footer>
        <m-btn type="submit" :loading="isSaving" class="w-full">{{
          t("save")
        }}</m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { clientDynamicDropdownParams } from "~/variable/params";

// props
const props = defineProps<{
  editingData?: {
    id?: string;
    phone?: string | number;
    comment?: string;
    name?: string;
  };
}>();

// emits
const emit = defineEmits<{
  (e: "closeDialog"): void;
}>();

// stores
const constestStore = useClientsContestStore("main");

// states
const { t } = useI18n();
const client = ref<string>(props.editingData?.id || "");
const tel = ref<string | number>(props.editingData?.phone || "");
const comment = ref<string>(props.editingData?.comment || "");
const isSaving = ref<boolean>(false);

const dynamicClients = ref<AppResponse<ClientsModel>>();
const clientsParams = ref({ ...clientDynamicDropdownParams });

const filterStates = ref([
  {
    name: t("sidebar.clients"),
    key: "clients-dynamic",
    isSingleSelect: true,
    disabled: !!props.editingData?.id,
    required: true,
    get initialName() {
      return props.editingData?.name;
    },
    get data() {
      return dynamicClients.value || [];
    },
    get getSelectedData() {
      return client.value;
    },
    set setSelectedData(value: string) {
      client.value = value;
    },
    onLoadElse: () => {
      onLoadElseClients();
    },
  },
]);

// methods
const closeDialog = () => emit("closeDialog");

const onSave = async () => {
  const payload = {
    client_id: props.editingData?.id
      ? props.editingData?.id
      : (client.value as string),
    phone_number: tel.value?.toString(),
    comment: comment.value,
  };
  isSaving.value = true;
  const res = await constestStore.update(payload);
  if (res !== "error") {
    closeDialog();
    constestStore.getData();
    notify({ title: t("toast.saved"), type: "success" });
  } else notify({ title: t("toast.error"), type: "error" });
  isSaving.value = false;
};

const getClientDynamicList = async () => {
  dynamicClients.value = await constestStore.getClientDynamicList(
    clientsParams.value
  );
};

const onLoadElseClients = async () => {
  clientsParams.value.page_size += 10;

  await getClientDynamicList();
};

const onOpenDropdown = async (state: string) => {
  if (state === "clients-dynamic" && !dynamicClients.value) {
    await getClientDynamicList();
  }
};

const onSearchDropdown = async (state: string, value: string) => {
  if (state === "clients-dynamic") {
    clientsParams.value.search = value;
    await getClientDynamicList();
  }
};
<\/script>
`;export{n as default};
