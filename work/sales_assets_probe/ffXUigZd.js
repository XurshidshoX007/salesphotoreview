const n=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="dialogStore.singleData?.id ? t('edit') : t('clients.add')"
      :loading="printersActiveStore.loadingUpdate"
      @closeDialog="dialogStore.closeDialog"
    >
      <flex-col class="gap-5">
        <d-input
          type="text"
          :label="t('column.name')"
          :required="true"
          focusable
          :value="data.name"
          @change="(value) => (data.name = value)"
        />
        <d-input
          :label="t('column.address')"
          type="text"
          :value="data.url"
          @change="(value) => (data.url = value)"
        />
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filterStates="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <Switch :active="data.is_active" @change="onChangeActivity" />
      </flex-col>
      <template #footer>
        <m-btn class="w-full" :loading="isLoadingBtn" type="submit">
          {{ !dialogStore.singleData ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import type { DropdownsByFilterStates } from "#components";
import { useI18n } from "vue-i18n";
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { AgentModel } from "~/interfaces/api/users/agent/agent-model";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";

const printersActiveStore = usePrintersStore("main");
const dialogStore = useDialogStore("printers");
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);
const dropdownParams = ref(
  dialogStore.singleData?.id
    ? { ...dropdownParamsAll }
    : { ...defaultDropdownParams }
);
const agents = ref<DropdownItemsModelByType<AgentModel> | undefined>();
const agentsParams = ref<defaultDropdownParamsType>(dropdownParams.value);

const { t } = useI18n();

const data = ref({
  id: undefined,
  name: "",
  url: "",
  agent_id_arr: [],
  is_active: true,
});
const isLoadingBtn = ref(false);

const filterStates = ref([
  {
    name: t("dashboard.agents"),
    key: "agents",
    required: true,
    get data() {
      return agents.value || [];
    },
    get getSelectedData() {
      return data.value.agent_id_arr;
    },
    set setSelectedData(value: string[]) {
      data.value.agent_id_arr = value;
    },
  },
]);

const save = async (e: any) => {
  isLoadingBtn.value = true;
  try {
    e.preventDefault();
    await printersActiveStore.add(data.value);

    await printersActiveStore.refresh();
    await dialogStore.closeDialog();
  } catch (e) {}
  isLoadingBtn.value = false;
};

onBeforeMount(async () => {
  if (dialogStore.singleData !== null) {
    await getAgents();
    data.value = await printersActiveStore.getDetail(dialogStore.singleData.id);
  }
});

const getAgents = async () => {
  agents.value = await printersActiveStore.getAgents(agentsParams.value);
};

const onOpenDropdown = async (state: string, value: any) => {
  if (state === "agents" && !agents.value) {
    await getAgents();
  }
};

const onChangeActivity = (isActive: boolean) => {
  data.value.is_active = isActive;
};
<\/script>
`;export{n as default};
