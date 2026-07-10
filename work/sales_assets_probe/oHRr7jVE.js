const e=`<template>
  <d-modal
    :name="t('settings.attaching_agents')"
    :loading="isLoading"
    @closeDialog="closeDialog"
  >
    <flex-col v-if="!isLoading" class="gap-5">
      <dropdowns-by-filter-states
        :filter-states="filterStates"
        @onOpenDropdown="onOpenDropdown"
      />
      <TerritoryTreeDropdowns
        :selected-item-ids="selectedTerritories"
        @onSelect="selectedTerritories = $event"
        @pass-territory-filter-states="addTerritoryFilterStates"
      />
    </flex-col>
    <template #footer>
      <m-btn :loading="isBtnLoading" @click="onFinish" class="w-full">
        {{ t("save") }}
      </m-btn>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { AgentModel } from "~/interfaces/api/users/agent/agent-model";
import type { TerritoryModel } from "~/interfaces/api/settings/territory-model";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import type { BonusesModel } from "~/interfaces/api/settings/bonuses-discounts-models";
import { notify } from "@kyvg/vue3-notification";
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";
import { useI18n } from "vue-i18n";

// stores
const bonusStore = useBonusesStore("true");

// props
const props = defineProps<{
  bonusId: string;
}>();

// emits
const emit = defineEmits(["onCloseDialog"]);

// states
const { t } = useI18n();
const agents = ref<DropdownItemsModelByType<AgentModel>>();
const territories = ref<DropdownItemsModelByType<TerritoryModel>>();
const detail = ref<BonusesModel>();
const selectedAgents = ref<string[]>([]);
const selectedTerritories = ref<string[]>([]);
const isBtnLoading = ref(false);
const isLoading = ref(false);

const territoriesParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});

const agentsParams = ref<defaultDropdownParamsType>(
  props.bonusId
    ? { ...dropdownParamsAll }
    : {
        ...defaultDropdownParams,
      }
);

const filterStates = ref([
  {
    name: t("users.agents.agent"),
    key: "agent",
    get isLoading() {
      return isLoading.value;
    },
    get data() {
      return agents.value || [];
    },
    get getSelectedData() {
      return selectedAgents.value;
    },
    set setSelectedData(value: string[]) {
      selectedAgents.value = value;
    },
  },
]);

// Methods
const addTerritoryFilterStates = (
  territoryFilterStates: FilterStateModel[]
) => {
  filterStates.value.push(...territoryFilterStates);
};

const onOpenDropdown = async (state: string, value: string) => {
  if (state === "agent" && !agents.value) {
    await getAgents();
    return;
  } else if (state === "territory" && !territories.value) {
    await getTerritories();
    return;
  }
};

const getTerritories = async () => {
  territories.value = await bonusStore.getTerritories(territoriesParams.value);
};

const getAgents = async () => {
  agents.value = await bonusStore.getAgents(agentsParams.value);
};

const onFinish = async () => {
  const setAgents = [];
  const setTerritory = [];

  const detailAgentsMap = new Map(
    detail.value?.agent_id_arr.map((agent) => [agent, agent])
  );
  const detailTerritoriesMap = new Map(
    detail.value?.bonus_territory_id_arr.map((territory) => [
      territory,
      territory,
    ])
  );

  const selectedAgentsSet = new Set(selectedAgents.value);
  const selectedTerritoriesSet = new Set(selectedTerritories.value);

  agents.value?.items?.forEach((item) => {
    const isInDetail = detailAgentsMap.has(item.id);
    const isInSelected = selectedAgentsSet.has(item.id);

    if (isInDetail || isInSelected) {
      setAgents.push({
        is_selected: (isInDetail && isInSelected) || isInSelected,
        id: item.id,
      });
    }
  });

  territories.value?.items?.forEach((item) => {
    const isInDetail = detailTerritoriesMap.has(item.id);
    const isInSelected = selectedTerritoriesSet.has(item.id);

    if (isInDetail || isInSelected) {
      setTerritory.push({
        is_selected: (isInDetail && isInSelected) || isInSelected,
        id: item.id,
      });
    }
  });

  const payload = {
    agents: setAgents,
    territories: setTerritory,
    bonus_id: props.bonusId,
  };
  isBtnLoading.value = true;
  const response = await bonusStore.attachAgents(payload);
  if (response !== "error") {
    notify({ type: "success", title: t("settings.agent_added_success") });
    closeDialog();
  }
  isBtnLoading.value = false;
};

const closeDialog = () => emit("onCloseDialog");

onMounted(async () => {
  if (props.bonusId) {
    isLoading.value = true;
    await Promise.all([getById(), getAgents(), getTerritories()]);
    setSelectedAgentIds();
    setSelectedTerritoryIds();
    isLoading.value = false;
  }
});

const getById = async () => {
  detail.value = await bonusStore.getWithId(props.bonusId);
};

const setSelectedAgentIds = () => {
  selectedAgents.value = detail.value?.agent_id_arr?.map((item) => item) || [];
};

const setSelectedTerritoryIds = () => {
  selectedTerritories.value =
    detail.value?.bonus_territory_id_arr?.map((item) => item) || [];
};
<\/script>
`;export{e as default};
